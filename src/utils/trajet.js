// Complète les temps de trajet manquants d'une prestation à partir de sa fiche chantier
const vide = (v) => v === undefined || v === null || String(v).trim() === '';

export function minDepuisChantier(chantier, base) {
  if (!chantier) return '';
  const v = base === 'maison' ? chantier.minMaison : chantier.minTravail;
  return vide(v) ? '' : v;
}

// Prestation à laquelle il manque le temps de trajet alors que le chantier le connaît
export function trajetManquant(e, chantiers) {
  if (e.sansKm) return false;
  if (!vide(e.minAller) || !vide(e.minRetour)) return false;
  const ch = chantiers.find((c) => c.id === e.chantierId);
  return !!ch && (!vide(minDepuisChantier(ch, e.depart || 'maison')) || !vide(minDepuisChantier(ch, e.retour || 'maison')));
}

export function completerTrajet(e, chantiers, settings) {
  const ch = chantiers.find((c) => c.id === e.chantierId);
  return {
    ...e,
    minAller: minDepuisChantier(ch, e.depart || 'maison'),
    minRetour: minDepuisChantier(ch, e.retour || 'maison'),
    trajetMode: e.trajetMode || settings.trajetDefaut || 'tarif',
    trajetDeduit: e.trajetDeduit ?? e.travailMode === 'horaires',
    tarifs: { tauxTrajet: settings.tauxTrajet ?? 20, ...e.tarifs },
  };
}
