// Construction des récapitulatifs (texte à partager + données de la fiche)
import { computeEntry, sumEntries, eur, hm, km1, shortDate, totalTickets } from './calc';
import { plage } from './temps';

const n = (v) => parseFloat(String(v ?? '').replace(',', '.')) || 0;
export const frDate = (s) => s.split('-').reverse().join('/');

export function sortByDate(entries) {
  return [...entries].sort((a, b) => a.date.localeCompare(b.date) || (a.chantierNom || '').localeCompare(b.chantierNom || ''));
}

export function periode(entries) {
  if (!entries.length) return '';
  const l = sortByDate(entries);
  const a = l[0].date;
  const b = l[l.length - 1].date;
  return a === b ? `le ${frDate(a)}` : `du ${frDate(a)} au ${frDate(b)}`;
}

// Résumé court d'une prestation : "Main-d'œuvre 3 h 30 · Courses 45 min · 28 km · Camion"
// Horaires affichés quand la prestation a été saisie en « début – fin »
export function horairesTravail(e) {
  return e.travailMode === 'horaires' ? plage(e.travailDebut, e.travailFin, e.travailPause) : '';
}
export function horairesCourses(e) {
  return e.coursesMode === 'horaires' ? plage(e.coursesDebut, e.coursesFin, e.coursesPause) : '';
}

// « dont 8 km matériel (Leroy Merlin, Point P) »
export function texteMateriel(e) {
  const p = (e.passages || []).filter((x) => x.magasinNom);
  const km = parseFloat(String(e.kmCourses ?? '').replace(',', '.')) || 0;
  if (e.sansKm || (!km && !p.length)) return '';
  const noms = [...new Set(p.map((x) => x.magasinNom))].join(', ');
  return `dont ${km1(km)} matériel${noms ? ` (${noms})` : ''}`;
}

export function resumeLigne(e) {
  const c = computeEntry(e);
  const parts = [];
  const hT = horairesTravail(e);
  const hC = horairesCourses(e);
  if (c.hT) parts.push(`Main-d'œuvre ${hm(c.hT)}${hT ? ` (${hT})` : ''}`);
  if (c.hC) parts.push(`Courses ${hm(c.hC)}${hC ? ` (${hC})` : ''}`);
  parts.push(e.sansKm ? 'Sans km' : `${km1(c.km)}${texteMateriel(e) ? ` ${texteMateriel(e)}` : ''}${e.kmOffert && c.km ? ` (offerts, valeur ${eur(c.deplacementOffert)})` : ''}`);
  if (c.hTrajet) parts.push(`Trajet ${hm(c.hTrajet)}${e.trajetMode === 'offert' ? ` (offert, valeur ${eur(c.trajetOffert)})` : ''}`);
  if (e.camion) parts.push('Camion');
  if (e.nettoyage) parts.push('Nettoyage camion');
  if (c.fournitures) parts.push(`Fournitures ${eur(c.fournitures)}`);
  for (const a of e.ajustements || []) {
    const m = Math.abs(parseFloat(String(a.montant).replace(',', '.')) || 0);
    if (m) parts.push(`${a.type === 'deduction' ? '−' : '+'} ${a.libelle || (a.type === 'deduction' ? 'déduction' : 'ajout')} ${eur(m)}`);
  }
  return parts.join(' · ');
}

export function detailMontants(e) {
  const c = computeEntry(e);
  return [
    ["Main-d'œuvre", c.travail],
    ['Courses', c.courses],
    ['Temps de trajet', c.trajet],
    ['Déplacement', c.deplacement],
    ['Camion', c.camion],
    ['Nettoyage camion', c.nettoyage],
    ['Fournitures', c.fournitures],
  ].filter(([, v]) => v > 0);
}

// Récapitulatif par poste pour la fiche (avec le tarif s'il est le même partout)
// Lignes « à ajouter / à déduire » : celles des prestations (datées) puis celles du chantier (sans date)
export function lignesAjustements(entries, extra = []) {
  const out = [];
  const push = (a, date) => {
    const m = Math.abs(parseFloat(String(a.montant ?? '').replace(',', '.')) || 0);
    if (!m) return;
    const deduc = a.type === 'deduction';
    out.push({
      libelle: `${a.libelle || (deduc ? 'Déduction' : 'Ajout')}${date ? ` (${frDate(date)})` : ''}`,
      qte: '',
      pu: deduc ? 'à déduire' : 'à ajouter',
      montant: deduc ? -m : m,
      ajust: true,
      garder: true,
    });
  };
  for (const e of sortByDate(entries)) for (const a of e.ajustements || []) push(a, e.date);
  for (const a of extra) push(a, null);
  return out;
}

export function postes(entries, extra = []) {
  const s = sumEntries(entries);
  const unique = (k) => {
    const set = new Set(entries.map((e) => n(e.tarifs?.[k])));
    return set.size === 1 ? [...set][0] : null;
  };
  const nbCamion = entries.filter((e) => e.camion).length;
  const nbNett = entries.filter((e) => e.nettoyage).length;
  const tT = unique('tauxTravail');
  const tC = unique('tauxCourses');
  const tK = unique('coutKm');
  const tTr = unique('tauxTrajet');
  // temps de trajet facturé / non facturé, séparés pour la fiche
  let hTrFacture = 0;
  let hTrOffert = 0;
  let kmFacture = 0;
  let kmOffert = 0;
  for (const e of entries) {
    const c = computeEntry(e);
    if (e.trajetMode === 'offert') hTrOffert += c.hTrajet;
    else hTrFacture += c.hTrajet;
    if (e.kmOffert) kmOffert += c.km;
    else kmFacture += c.km;
  }
  return [
    { libelle: "Main-d'œuvre", qte: hm(s.hT), pu: tT != null ? `${eur(tT)} / h` : '', montant: s.travail },
    { libelle: 'Temps de courses', qte: hm(s.hC), pu: tC != null ? `${eur(tC)} / h` : '', montant: s.courses },
    { libelle: 'Temps de trajet', qte: hm(hTrFacture), pu: tTr != null ? `${eur(tTr)} / h` : '', montant: s.trajet },
    { libelle: 'Temps de trajet offert', qte: hm(hTrOffert), pu: 'offert', montant: 0, valeur: s.trajetOffert, garder: hTrOffert > 0 },
    { libelle: 'Déplacements', qte: km1(kmFacture), pu: tK != null ? `${eur(tK)} / km` : '', montant: s.deplacement },
    { libelle: 'Déplacements offerts', qte: km1(kmOffert), pu: 'offert', montant: 0, valeur: s.deplacementOffert, garder: s.deplacementOffert > 0 },
    { libelle: 'Utilisation du camion', qte: nbCamion ? `${nbCamion} fois` : '', pu: '', montant: s.camion },
    { libelle: 'Nettoyage du camion', qte: nbNett ? `${nbNett} fois` : '', pu: '', montant: s.nettoyage },
    { libelle: 'Fournitures', qte: '', pu: '', montant: s.fournitures },
    ...lignesAjustements(entries, extra),
  ].filter((p) => p.montant > 0 || p.garder);
}

export function buildRecapText(entries, settings, { details = true, chantier = null, nbTickets = 0, extra = [] } = {}) {
  const list = sortByDate(entries);
  const noms = [...new Set(list.map((e) => e.chantierNom || 'Chantier'))];
  const unSeul = noms.length === 1;
  const s = sumEntries(list);
  const lignes = [];
  const lignesExtra = [];

  lignes.push(`🔨 Récapitulatif des prestations${unSeul ? ` — ${noms[0]}` : ''}`);
  if (unSeul && chantier?.adresse) lignes.push(chantier.adresse);
  lignes.push(`${list.length} prestation${list.length > 1 ? 's' : ''} ${periode(list)}`);
  lignes.push('');

  for (const e of list) {
    const c = computeEntry(e);
    lignes.push(`📅 ${shortDate(e.date)}${unSeul ? '' : ` — ${e.chantierNom}`}`);
    if (e.description) lignes.push(e.description.trim());
    lignes.push(resumeLigne(e));
    if (details) {
      const d = detailMontants(e)
        .map(([l, v]) => `${l} ${eur(v)}`)
        .join(' · ');
      if (d) lignes.push(`   ${d}`);
    }
    const tk = totalTickets(e);
    if (e.tickets?.length) lignes.push(`🧾 ${e.tickets.length} ticket${e.tickets.length > 1 ? 's' : ''}${tk ? ` (${eur(tk)})` : ''}`);
    lignes.push(`Coût : ${eur(c.total)}`);
    lignes.push('');
  }

  const tx = extra.reduce(
    (acc, a) => {
      const m = Math.abs(parseFloat(String(a.montant ?? '').replace(',', '.')) || 0);
      if (!m) return acc;
      lignesExtra.push(`${a.type === 'deduction' ? '−' : '+'} ${a.libelle || (a.type === 'deduction' ? 'Déduction' : 'Ajout')} : ${eur(m)}`);
      return acc + (a.type === 'deduction' ? -m : m);
    },
    0
  );
  if (lignesExtra.length) {
    lignes.push(...lignesExtra);
    lignes.push('');
  }
  lignes.push('━━━━━━━━━━━━');
  if (details) {
    for (const p of postes(list)) lignes.push(`${p.libelle} : ${eur(p.montant)}`);
  }
  lignes.push(`COÛT TOTAL : ${eur(s.total + tx)}`);
  if (s.trajetOffert > 0) lignes.push(`🎁 Temps de trajet offert : ${eur(s.trajetOffert)} (non compté)`);
  if (s.deplacementOffert > 0) lignes.push(`🎁 Kilomètres offerts : ${eur(s.deplacementOffert)} (non comptés)`);
  if (nbTickets) lignes.push(`🧾 ${nbTickets} photo${nbTickets > 1 ? 's' : ''} de ticket${nbTickets > 1 ? 's' : ''} jointe${nbTickets > 1 ? 's' : ''}`);
  const nom = settings?.coordonnees?.nom;
  if (nom) {
    lignes.push('');
    lignes.push(nom);
  }
  return lignes.join('\n');
}
