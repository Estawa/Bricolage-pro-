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
  const kmMaison = await routeKm(basesCoords.maison, coords);
  const kmTravail = await routeKm(basesCoords.travail, coords);
  return { kmMaison, kmTravail, coords, basesCoords };
}
