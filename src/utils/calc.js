// ---------------------------------------------------------------
// Calculs des prestations
// ---------------------------------------------------------------

export const BASES = ['maison', 'travail'];

export const DEFAULT_SETTINGS = {
  tauxTravail: 35, // €/h main-d'œuvre
  tauxCourses: 20, // €/h temps passé à faire les courses
  coutKm: 0.5, // €/km déplacement (voiture)
  camionForfait: 30, // € par jour d'utilisation du camion
  camionKm: 0.3, // € supplément par km fait avec le camion
  nettoyageForfait: 40, // € nettoyage complet du camion
  bases: {
    maison: { label: 'Maison', adresse: 'Champcueil, 91750, France', lat: null, lon: null },
    travail: {
      label: 'Travail',
      adresse: 'Lycée Georges-Brassens, Courcouronnes, 91080, France',
      lat: null,
      lon: null,
    },
  },
};

// Tarifs « figés » dans chaque prestation au moment de l'enregistrement :
// si vous changez vos tarifs plus tard, les journées déjà saisies ne bougent pas.
export function snapshotTarifs(settings) {
  const { tauxTravail, tauxCourses, coutKm, camionForfait, camionKm, nettoyageForfait } = settings;
  return { tauxTravail, tauxCourses, coutKm, camionForfait, camionKm, nettoyageForfait };
}

const n = (v) => {
  const x = parseFloat(String(v ?? '').replace(',', '.'));
  return Number.isFinite(x) ? x : 0;
};

export function kmTotal(e) {
  return n(e.kmAller) + n(e.kmRetour) + n(e.kmCourses);
}

export function computeEntry(e) {
  const t = e.tarifs || {};
  const km = kmTotal(e);
  const hT = n(e.heuresTravail);
  const hC = n(e.heuresCourses);
  const travail = hT * n(t.tauxTravail);
  const courses = hC * n(t.tauxCourses);
  const deplacement = km * n(t.coutKm);
  const camion = e.camion ? n(t.camionForfait) + km * n(t.camionKm) : 0;
  const nettoyage = e.camion && e.nettoyage ? n(t.nettoyageForfait) : 0;
  const fournitures = n(e.fournitures);
  const total = travail + courses + deplacement + camion + nettoyage + fournitures;
  return { km, hT, hC, travail, courses, deplacement, camion, nettoyage, fournitures, total };
}

export function sumEntries(entries) {
  const acc = {
    nb: 0,
    km: 0,
    hT: 0,
    hC: 0,
    travail: 0,
    courses: 0,
    deplacement: 0,
    camion: 0,
    nettoyage: 0,
    fournitures: 0,
    total: 0,
  };
  for (const e of entries) {
    const c = computeEntry(e);
    acc.nb += 1;
    for (const k of Object.keys(c)) acc[k] += c[k];
  }
  return acc;
}

// ---------------------------------------------------------------
// Formats
// ---------------------------------------------------------------
const eurFmt = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
export const eur = (v) => eurFmt.format(n(v));

export const km1 = (v) =>
  `${(v || 0).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} km`;

// 2.75 h -> "2 h 45"
export function hm(h) {
  const totalMin = Math.round((h || 0) * 60);
  const hh = Math.floor(totalMin / 60);
  const mm = totalMin % 60;
  if (hh === 0) return `${mm} min`;
  return mm ? `${hh} h ${String(mm).padStart(2, '0')}` : `${hh} h`;
}

// ---------------------------------------------------------------
// Dates (format AAAA-MM-JJ, en heure locale)
// ---------------------------------------------------------------
export function isoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseIso(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export const MOIS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

export function longDate(s) {
  return parseIso(s).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
