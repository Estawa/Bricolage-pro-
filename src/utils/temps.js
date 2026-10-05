// Calcul d'une durée à partir d'heures de début et de fin ("08:30" → "12:00")

const toMin = (t) => {
  if (!t || !/^\d{1,2}:\d{2}/.test(t)) return null;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

// Retourne la durée en heures décimales, ou null si les horaires sont incomplets.
// Si la fin est avant le début, on considère qu'elle est le lendemain.
export function dureeHoraires(debut, fin, pauseMin = 0) {
  const a = toMin(debut);
  const b = toMin(fin);
  if (a == null || b == null) return null;
  let d = b - a;
  if (d <= 0) d += 24 * 60;
  d -= parseInt(pauseMin || 0, 10) || 0;
  return Math.max(0, d) / 60;
}

// "08:30" -> "8 h 30"
export const heureFr = (t) => {
  const m = toMin(t);
  if (m == null) return '';
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h} h ${String(mm).padStart(2, '0')}`;
};

// Texte des horaires d'une prestation, ex. "8 h 30 – 12 h 00 (pause 30 min)"
export function plage(debut, fin, pause) {
  if (!debut || !fin) return '';
  const p = parseInt(pause || 0, 10);
  return `${heureFr(debut)} – ${heureFr(fin)}${p ? `, pause ${p} min` : ''}`;
}
