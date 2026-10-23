import { useState } from 'react';

// Choix « Trajet / km offerts » mémorisé sur l'appareil (commun fiche, PDF et partage)
const CLE = 'bricolage-pro:voirOffert';

export function useVoirOffert() {
  const [v, setV] = useState(() => {
    try {
      return localStorage.getItem(CLE) || 'valeur';
    } catch {
      return 'valeur';
    }
  });
  const changer = (x) => {
    setV(x);
    try {
      localStorage.setItem(CLE, x);
    } catch {
      /* stockage indisponible */
    }
  };
  return [v, changer];
}
