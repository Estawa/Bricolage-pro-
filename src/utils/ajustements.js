// Ajouts / déductions libres (« repas offert », « location bétonnière »…)
// - dans une prestation : e.ajustements (datés par la prestation)
// - sur un chantier, sans date : chantier.ajustements (comptés au mois de leur saisie)
const n = (v) => {
  const x = parseFloat(String(v ?? '').replace(',', '.'));
  return Number.isFinite(x) ? Math.abs(x) : 0;
};

export function totauxAjustements(list = []) {
  let ajouts = 0;
  let deductions = 0;
  for (const a of list) {
    if (a.type === 'deduction') deductions += n(a.montant);
    else ajouts += n(a.montant);
  }
  return { ajouts, deductions, net: ajouts - deductions };
}

export const montantAjustement = (a) => n(a.montant);

// Ajustements « sans date » de tous les chantiers, aplatis (avec la date de saisie pour les compteurs)
export function ajustementsChantiers(chantiers = []) {
  return chantiers.flatMap((c) =>
    (c.ajustements || []).map((a) => ({ ...a, chantierId: c.id, chantierNom: c.nom, date: a.dateSaisie || '' }))
  );
}
