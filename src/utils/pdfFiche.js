// ---------------------------------------------------------------
// Fiche récapitulative en PDF (A4, noir et blanc) — fichier à envoyer au client
// Même contenu que la fiche de l'appli ; aucun bloc n'est coupé entre deux pages.
// ---------------------------------------------------------------
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { computeEntry, sumEntries, eur, hm, km1, isoDate } from './calc';
import { sortByDate, periode, frDate, postes, detailMontants, horairesTravail, horairesCourses } from './recap';
import { totauxAjustements } from './ajustements';

const NOIR = rgb(0, 0, 0);
const W = 595.28;
const H = 841.89;
const M = 40; // marges
const BAS = 50; // marge basse (numéro de page)

// Les polices PDF standard ne connaissent que l'alphabet « WinAnsi » : on remplace le reste
const WINANSI_EXTRA = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ';
function propre(t) {
  return String(t ?? '')
    .replace(/[   ]/g, ' ')
    .replace(/−/g, '-')
    .replace(/→/g, '->')
    .replace(/[^\x20-\x7E\xA0-\xFF\n]/g, (c) => (WINANSI_EXTRA.includes(c) ? c : ''))
    .trim();
}

export async function genererPdfFiche({ entries, extra = [], settings, chantier, detail = true, annexe = true, getPhoto }) {
  const list = sortByDate(entries);
  const s = sumEntries(list);
  const tx = totauxAjustements(extra);
  const total = s.total + tx.net;
  const noms = [...new Set(list.map((e) => e.chantierNom))];
  const nomChantier = chantier?.nom || (noms.length === 1 ? noms[0] : 'Plusieurs chantiers');
  const co = settings.coordonnees || {};

  const doc = await PDFDocument.create();
  doc.setTitle(propre(`Récapitulatif des prestations - ${nomChantier}`));
  doc.setAuthor(propre(co.nom || ''));
  doc.setCreator('Bricolage Pro');
  const F = {
    r: await doc.embedFont(StandardFonts.Helvetica),
    b: await doc.embedFont(StandardFonts.HelveticaBold),
    i: await doc.embedFont(StandardFonts.HelveticaOblique),
  };

  let page;
  let y;
  const nouvellePage = () => {
    page = doc.addPage([W, H]);
    y = H - M;
  };
  nouvellePage();

  const larg = (t, size, f = F.r) => f.widthOfTextAtSize(propre(t), size);
  const texte = (t, x, size, f = F.r, opts = {}) => {
    const v = propre(t);
    if (!v) return;
    const xx = opts.droite ? x - f.widthOfTextAtSize(v, size) : x;
    page.drawText(v, { x: xx, y: opts.y ?? y, size, font: f, color: NOIR });
  };
  const ligne = (x1, x2, yy, ep = 0.5) => page.drawLine({ start: { x: x1, y: yy }, end: { x: x2, y: yy }, thickness: ep, color: NOIR });
  // découpe d'un texte en lignes tenant dans `max` points
  const couper = (t, size, max, f = F.r) => {
    const out = [];
    for (const para of propre(t).split('\n')) {
      let cur = '';
      for (const mot of para.split(/\s+/).filter(Boolean)) {
        const essai = cur ? `${cur} ${mot}` : mot;
        if (f.widthOfTextAtSize(essai, size) <= max) cur = essai;
        else {
          if (cur) out.push(cur);
          cur = mot;
        }
      }
      if (cur) out.push(cur);
    }
    return out;
  };
  // garantit qu'un bloc de hauteur h tient sur la page (sinon nouvelle page)
  const place = (h, apresSaut) => {
    if (y - h < BAS) {
      nouvellePage();
      if (apresSaut) apresSaut();
      return true;
    }
    return false;
  };

  // ---------- En-tête ----------
  texte('RÉCAPITULATIF DES PRESTATIONS', M, 15, F.b);
  const coords = [co.nom, co.adresse, co.telephone && `Tél. ${co.telephone}`, co.email].filter(Boolean);
  coords.forEach((c, i) => texte(c, W - M, 9, i === 0 ? F.b : F.r, { droite: true, y: y - i * 11 }));
  y -= 17;
  texte(`Édité le ${frDate(isoDate(new Date()))}`, M, 9);
  y -= 11;
  texte(`Période : ${periode(list)}`, M, 9);
  y = Math.min(y, H - M - coords.length * 11) - 10;
  ligne(M, W - M, y, 1.5);
  y -= 16;

  // ---------- Chantier ----------
  const hBox = chantier?.adresse ? 40 : 30;
  page.drawRectangle({ x: M, y: y - hBox + 10, width: W - 2 * M, height: hBox, borderColor: NOIR, borderWidth: 0.8 });
  texte('CHANTIER / CLIENT', M + 8, 7);
  y -= 12;
  texte(nomChantier, M + 8, 11, F.b);
  if (chantier?.adresse) {
    y -= 11;
    texte(chantier.adresse, M + 8, 9);
  }
  y -= hBox - (chantier?.adresse ? 23 : 12) + 14;

  // ---------- Détail des interventions ----------
  const xDesc = M + 62;
  const largDesc = W - M - 75 - xDesc;
  const enteteTableau = () => {
    texte('DÉTAIL DES INTERVENTIONS', M, 10, F.b);
    y -= 12;
    ligne(M, W - M, y + 8, 1.2);
    texte('DATE', M, 7.5, F.b);
    texte('TRAVAUX RÉALISÉS', xDesc, 7.5, F.b);
    texte('COÛT', W - M, 7.5, F.b, { droite: true });
    y -= 5;
    ligne(M, W - M, y, 1.2);
    y -= 12;
  };
  enteteTableau();

  for (const e of list) {
    const c = computeEntry(e);
    const L = []; // [texte, taille, police]
    if (!chantier && noms.length > 1) L.push([e.chantierNom, 9, F.b]);
    if (e.description) couper(e.description, 9, largDesc).forEach((l) => L.push([l, 9, F.r]));
    const infos = [
      c.hT ? `Main-d'œuvre ${hm(c.hT)}${horairesTravail(e) ? ` (${horairesTravail(e)})` : ''}` : null,
      c.hC ? `Courses ${hm(c.hC)}${horairesCourses(e) ? ` (${horairesCourses(e)})` : ''}` : null,
      e.sansKm ? null : `${km1(c.km)}${e.kmOffert && c.km ? ` (offerts, valeur ${eur(c.deplacementOffert)})` : ''}`,
      c.hTrajet ? `Trajet ${hm(c.hTrajet)} ${e.trajetMode === 'offert' ? `(offert, valeur ${eur(c.trajetOffert)})` : '(facturé)'}` : null,
      e.camion ? 'Camion' : null,
      e.nettoyage ? 'Nettoyage camion' : null,
    ]
      .filter(Boolean)
      .join(' · ');
    couper(infos, 8, largDesc).forEach((l) => L.push([l, 8, F.r]));
    for (const a of e.ajustements || []) {
      const m = Math.abs(parseFloat(String(a.montant ?? '').replace(',', '.')) || 0);
      if (m) L.push([`${a.type === 'deduction' ? '- À déduire' : '+ À ajouter'} : ${a.libelle || '-'} (${eur(m)})`, 8, F.r]);
    }
    if (detail) {
      const d = detailMontants(e)
        .map(([l, v]) => `${l} ${eur(v)}`)
        .join(' · ');
      couper(d, 7, largDesc, F.i).forEach((l) => L.push([l, 7, F.i]));
    }
    if (!L.length) L.push(['-', 9, F.r]);
    const h = L.reduce((acc, [, sz]) => acc + sz + 2.5, 0) + 8;
    place(h, enteteTableau);
    const yTop = y;
    texte(frDate(e.date), M, 9);
    texte(eur(c.total), W - M, 9, F.b, { droite: true });
    for (const [t, sz, f] of L) {
      texte(t, xDesc, sz, f);
      y -= sz + 2.5;
    }
    y = yTop - h + 9;
    ligne(M, W - M, y + 2, 0.4);
    y -= 11;
  }

  // ---------- Récapitulatif (bloc jamais coupé) ----------
  const lignes = postes(list, extra);
  const x0 = W - M - 330;
  const hRecap = 22 + lignes.length * 15 + 26 + (s.offert > 0 ? 13 : 0) + 14;
  y -= 6;
  place(hRecap);
  texte('RÉCAPITULATIF', x0, 10, F.b);
  y -= 15;
  for (const p of lignes) {
    const lib = couper(p.libelle, 8.5, 140)[0] || '';
    texte(lib, x0, 8.5);
    if (p.qte) texte(p.qte, x0 + 205, 8, F.r, { droite: true });
    if (p.pu && p.pu !== 'offert') texte(p.pu, x0 + 268, 8, F.r, { droite: true });
    if (p.pu === 'offert') {
      texte('offert', x0 + 268, 8, F.r, { droite: true });
      const zero = eur(0);
      const val = eur(p.valeur);
      texte(zero, W - M, 8.5, F.r, { droite: true });
      const xv = W - M - larg(zero, 8.5) - 6 - larg(val, 8.5);
      texte(val, xv, 8.5);
      ligne(xv, xv + larg(val, 8.5), y + 3, 0.6); // montant barré
    } else if (p.ajust) {
      texte(`${p.montant < 0 ? '-' : '+'} ${eur(Math.abs(p.montant))}`, W - M, 8.5, F.r, { droite: true });
    } else {
      texte(eur(p.montant), W - M, 8.5, F.r, { droite: true });
    }
    y -= 4;
    ligne(x0, W - M, y, 0.4);
    y -= 11;
  }
  y -= 2;
  ligne(x0, W - M, y + 11, 1.4);
  y -= 3;
  texte('COÛT TOTAL', x0, 11.5, F.b);
  texte(eur(total), W - M, 11.5, F.b, { droite: true });
  y -= 7;
  ligne(x0, W - M, y, 1.4);
  y -= 12;
  if (s.offert > 0) {
    const quoi = [s.trajetOffert > 0 ? 'temps de trajet' : null, s.deplacementOffert > 0 ? 'kilomètres' : null].filter(Boolean).join(' et ');
    texte(`Geste commercial : ${quoi} offerts`, x0, 8, F.i);
    texte(eur(s.offert), W - M, 8, F.i, { droite: true });
    y -= 13;
  }
  texte(
    `${s.nb} intervention${s.nb > 1 ? 's' : ''} · ${hm(s.hT)} de main-d'œuvre · ${hm(s.hC)} de courses${s.hTrajet ? ` · ${hm(s.hTrajet)} de trajet` : ''} · ${km1(s.km)}`,
    x0,
    7
  );
  y -= 22;
  place(20);
  ligne(M, W - M, y + 8, 0.4);
  texte('Document récapitulatif du coût des prestations réalisées - ne constitue pas une facture.', M, 7);
  y -= 14;

  // ---------- Annexe : tickets de caisse ----------
  const tickets = list.flatMap((e) => (e.tickets || []).map((t) => ({ ...t, date: e.date })));
  if (annexe && tickets.length && getPhoto) {
    nouvellePage();
    texte('ANNEXE - TICKETS DE CAISSE', M, 10, F.b);
    y -= 18;
    const colW = (W - 2 * M - 16) / 2;
    const maxH = 330;
    let col = 0;
    let hLigne = 0;
    for (const t of tickets) {
      const data = await getPhoto(t.id);
      if (!data || !String(data).startsWith('data:image/')) continue;
      const bytes = Uint8Array.from(atob(String(data).split(',')[1]), (ch) => ch.charCodeAt(0));
      let img;
      try {
        img = String(data).startsWith('data:image/png') ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
      } catch {
        continue;
      }
      const k = Math.min(colW / img.width, maxH / img.height);
      const iw = img.width * k;
      const ih = img.height * k;
      const hBloc = ih + 22;
      if (col === 0 && y - hBloc < BAS) {
        nouvellePage();
      }
      const x = M + col * (colW + 16);
      page.drawRectangle({ x: x - 2, y: y - ih - 2, width: colW + 4, height: ih + 4, borderColor: NOIR, borderWidth: 0.4 });
      page.drawImage(img, { x: x + (colW - iw) / 2, y: y - ih, width: iw, height: ih });
      const leg = [frDate(t.date), t.libelle, t.montant && eur(t.montant)].filter(Boolean).join(' - ');
      texte(couper(leg, 8, colW)[0] || '', x, 8, F.r, { y: y - ih - 12 });
      hLigne = Math.max(hLigne, hBloc);
      col += 1;
      if (col === 2) {
        col = 0;
        y -= hLigne + 14;
        hLigne = 0;
      }
    }
  }

  // ---------- Numéros de page ----------
  const pages = doc.getPages();
  pages.forEach((pg, i) => {
    const t = `Page ${i + 1} / ${pages.length}`;
    pg.drawText(t, { x: W - M - F.r.widthOfTextAtSize(t, 7), y: 25, size: 7, font: F.r, color: NOIR });
  });

  const bytes = await doc.save();
  const nomFichier = propre(`Recapitulatif ${nomChantier} ${frDate(isoDate(new Date())).replace(/\//g, '-')}`)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9-]+/g, '-')
    .replace(/-+/g, '-');
  return { bytes, nomFichier: `${nomFichier}.pdf`, total, pages: pages.length };
}

// Envoi (feuille de partage du téléphone) ou téléchargement si le partage de fichier n'est pas possible
export async function envoyerPdf({ bytes, nomFichier }, titre) {
  const file = new File([bytes], nomFichier, { type: 'application/pdf' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: titre });
      return 'partage';
    } catch (e) {
      if (e?.name === 'AbortError') return 'annule';
    }
  }
  telechargerPdf({ bytes, nomFichier });
  return 'telecharge';
}

export function telechargerPdf({ bytes, nomFichier }) {
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nomFichier;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
