export const APP_VERSION = '1.2.0';

export const CHANGELOG = [
  {
    version: '1.2.0',
    date: '05/10/2026',
    items: [
      'Option « Aucun kilométrage » (ex. courses sur le trajet habituel, sans détour)',
      'Fiche chantier : toutes les prestations par date, modifiables, avec totaux',
      'Date modifiable dans une prestation, ajout direct depuis la fiche chantier',
      'Photos des tickets de caisse (montant et libellé), report du total en fournitures',
      'Partage sélectif (WhatsApp, mail…) : prestations choisies + photos des tickets',
      'Fiche récapitulative style facturation terminée par le « Coût total », imprimable / PDF en noir et blanc, tickets en annexe',
      'Coordonnées du prestataire dans les réglages ; sauvegarde incluant les photos',
    ],
  },
  {
    version: '1.1.0',
    date: '05/10/2026',
    items: [
      'Synchronisation Firebase : compte e-mail, données retrouvées sur tous les appareils',
      'Fonctionne hors ligne, synchronise au retour du réseau (indicateur nuage dans l’en-tête)',
      'Proposition d’envoyer dans le compte les données déjà saisies sur le téléphone',
      'Bouton « Recalculer avec les tarifs actuels » dans chaque prestation, avec confirmation (avant / après / écart)',
      'Étiquette « Anciens tarifs » sur les prestations calculées avec d’anciens tarifs',
    ],
  },
  {
    version: '1.0.0',
    date: '05/10/2026',
    items: [
      'Première version de Bricolage Pro',
      'Tarifs : coût horaire travail, coût horaire courses, coût kilométrique',
      'Départ et retour au choix : Maison (Champcueil) ou Travail (Courcouronnes)',
      'Option camion (forfait + supplément au km) et nettoyage complet',
      'Calendrier : saisie des prestations jour par jour',
      'Compteurs en direct : travail, courses, kilomètres, facturation (jour / mois / année)',
      'Fiches chantiers avec calcul automatique des km par la route',
      'Bilan mensuel / annuel par chantier, export CSV, sauvegarde et restauration',
    ],
  },
];
