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

export function resumeLigne(e) {
  const c = computeEntry(e);
  const parts = [];
  const hT = horairesTravail(e);
  const hC = horairesCourses(e);
  if (c.hT) parts.push(`Main-d'œuvre ${hm(c.hT)}${hT ? ` (${hT})` : ''}`);
  if (c.hC) parts.push(`Courses ${hm(c.hC)}${hC ? ` (${hC})` : ''}`);
  parts.push(e.sansKm ? 'Sans km' : km1(c.km));
  if (e.camion) parts.push('Camion');
  if (e.nettoyage) parts.push('Nettoyage camion');
  if (c.fournitures) parts.push(`Fournitures ${eur(c.fournitures)}`);
  return parts.join(' · ');
}

export function detailMontants(e) {
  const c = computeEntry(e);
  return [
    ["Main-d'œuvre", c.travail],
    ['Courses', c.courses],
    ['Déplacement', c.deplacement],
    ['Camion', c.camion],
    ['Nettoyage camion', c.nettoyage],
    ['Fournitures', c.fournitures],
  ].filter(([, v]) => v > 0);
}

// Récapitulatif par poste pour la fiche (avec le tarif s'il est le même partout)
export function postes(entries) {
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
  return [
    { libelle: "Main-d'œuvre", qte: hm(s.hT), pu: tT != null ? `${eur(tT)} / h` : '', montant: s.travail },
    { libelle: 'Temps de courses', qte: hm(s.hC), pu: tC != null ? `${eur(tC)} / h` : '', montant: s.courses },
    { libelle: 'Déplacements', qte: km1(s.km), pu: tK != null ? `${eur(tK)} / km` : '', montant: s.deplacement },
    { libelle: 'Utilisation du camion', qte: nbCamion ? `${nbCamion} fois` : '', pu: '', montant: s.camion },
    { libelle: 'Nettoyage du camion', qte: nbNett ? `${nbNett} fois` : '', pu: '', montant: s.nettoyage },
    { libelle: 'Fournitures', qte: '', pu: '', montant: s.fournitures },
  ].filter((p) => p.montant > 0);
}

export function buildRecapText(entries, settings, { details = true, chantier = null, nbTickets = 0 } = {}) {
  const list = sortByDate(entries);
  const noms = [...new Set(list.map((e) => e.chantierNom || 'Chantier'))];
  const unSeul = noms.length === 1;
  const s = sumEntries(list);
  const lignes = [];

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

  lignes.push('━━━━━━━━━━━━');
  if (details) {
    for (const p of postes(list)) lignes.push(`${p.libelle} : ${eur(p.montant)}`);
  }
  lignes.push(`COÛT TOTAL : ${eur(s.total)}`);
  if (nbTickets) lignes.push(`🧾 ${nbTickets} photo${nbTickets > 1 ? 's' : ''} de ticket${nbTickets > 1 ? 's' : ''} jointe${nbTickets > 1 ? 's' : ''}`);
  const nom = settings?.coordonnees?.nom;
  if (nom) {
    lignes.push('');
    lignes.push(nom);
  }
  return lignes.join('\n');
}
