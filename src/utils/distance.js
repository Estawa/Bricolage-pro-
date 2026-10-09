// Calcul automatique des kilomètres par la route (services gratuits OpenStreetMap)
// - Nominatim : transforme une adresse en coordonnées GPS
// - OSRM : calcule la distance routière en voiture
// En cas d'échec (pas de réseau, adresse introuvable), on saisit les km à la main.

export async function geocode(adresse) {
  const url =
    'https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=fr&accept-language=fr&q=' +
    encodeURIComponent(adresse);
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('Service d’adresses indisponible');
  const data = await res.json();
  if (!data.length) throw new Error(`Adresse introuvable : « ${adresse} »`);
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
}

export async function routeKm(from, to) {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Service d’itinéraire indisponible');
  const data = await res.json();
  if (!data.routes?.length) throw new Error('Aucun itinéraire trouvé');
  return Math.round(data.routes[0].distance / 100) / 10; // km, 1 décimale
}

// Distance (km) + durée (minutes) en voiture
export async function routeKmMin(from, to) {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Service d’itinéraire indisponible');
  const data = await res.json();
  if (!data.routes?.length) throw new Error('Aucun itinéraire trouvé');
  const r = data.routes[0];
  return { km: Math.round(r.distance / 100) / 10, min: Math.max(1, Math.round(r.duration / 60)) };
}

const pause = (ms) => new Promise((r) => setTimeout(r, ms));

// Retourne { kmMaison, kmTravail, coords, basesCoords }
export async function distancesDepuisBases(adresseChantier, bases) {
  const basesCoords = {};
  for (const key of ['maison', 'travail']) {
    const b = bases[key];
    if (b.lat != null && b.lon != null) {
      basesCoords[key] = { lat: b.lat, lon: b.lon };
    } else {
      basesCoords[key] = await geocode(b.adresse);
      await pause(1100); // Nominatim demande 1 requête / seconde max
    }
  }
  const coords = await geocode(adresseChantier);
  const m = await routeKmMin(basesCoords.maison, coords);
  const t = await routeKmMin(basesCoords.travail, coords);
  return { kmMaison: m.km, kmTravail: t.km, minMaison: m.min, minTravail: t.min, coords, basesCoords };
}

// ---------------------------------------------------------------
// Passages au magasin (matériel)
// ---------------------------------------------------------------
// Coordonnées mémorisées par adresse (évite de redemander à chaque calcul)
const CACHE_KEY = 'bricolage-pro:geocache';
function lireCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
  } catch {
    return {};
  }
}
export async function geocodeMemo(adresse) {
  const k = String(adresse || '').trim().toLowerCase();
  if (!k) throw new Error('Adresse manquante');
  const cache = lireCache();
  if (cache[k]) return cache[k];
  const c = await geocode(adresse);
  cache[k] = c;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* ignore */
  }
  await pause(1100); // Nominatim : 1 requête / seconde
  return c;
}

// Coordonnées d'un lieu : 'maison' | 'travail' | 'chantier'
async function coordsLieu(lieu, { bases, chantier }) {
  if (lieu === 'chantier') {
    if (!chantier?.adresse) throw new Error('Adresse du chantier manquante (fiche chantier)');
    return geocodeMemo(chantier.adresse);
  }
  const b = bases[lieu];
  if (b?.lat != null && b?.lon != null) return { lat: b.lat, lon: b.lon };
  return geocodeMemo(b?.adresse);
}

// Trajet « depuis → magasin → vers ».
// Si départ et arrivée diffèrent (ex. Maison → magasin → Chantier), ce trajet remplace le trajet direct :
// seul le détour est compté. Si c'est le même lieu (Chantier → magasin → Chantier), tout l'aller-retour compte.
export async function calculerPassage({ depuis, vers, magasin, bases, chantier }) {
  if (!magasin?.adresse) throw new Error('Adresse du magasin manquante (Réglages)');
  const A = await coordsLieu(depuis, { bases, chantier });
  const B = depuis === vers ? A : await coordsLieu(vers, { bases, chantier });
  const S = await geocodeMemo(magasin.adresse);
  const l1 = await routeKmMin(A, S);
  const l2 = await routeKmMin(S, B);
  const via = Math.round((l1.km + l2.km) * 10) / 10;
  let direct = 0;
  if (depuis !== vers) direct = (await routeKmMin(A, B)).km;
  const detour = Math.max(0, Math.round((via - direct) * 10) / 10);
  return { via, direct, detour, minutes: l1.min + l2.min };
}
