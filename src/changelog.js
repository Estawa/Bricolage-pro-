export const APP_VERSION = '1.8.1';

export const CHANGELOG = [
  {
    version: '1.8.1',
    date: '09/10/2026',
    items: [
      'Magasins favoris (⭐ dans les Réglages) en raccourcis dans chaque prestation : un appui ajoute le passage et calcule les km',
      'Dernier trajet mémorisé pour chaque magasin (depuis / vers / sur le trajet), les plus utilisés proposés en raccourci',
      'Ajout d’un nouveau magasin directement depuis la prestation (enregistré en favori)',
    ],
  },
  {
    version: '1.8.0',
    date: '09/10/2026',
    items: [
      'Magasins (lieux de matériel) dans les Réglages : nom + adresse',
      'Passages au magasin dans chaque prestation : depuis Maison / Travail / Chantier, puis vers Chantier / Travail / Maison',
      'Calcul automatique des km par la route : détour seul si le passage remplace un trajet, aller-retour complet sinon',
      'Option « Sur mon trajet, sans détour (0 km) » et km modifiables à la main',
      'Km matériel et magasins mentionnés sur la carte, la fiche, le PDF et le message',
    ],
  },
  {
    version: '1.7.0',
    date: '08/10/2026',
    items: [
      'Fiche récapitulative en vrai fichier PDF (A4, noir et blanc, 1 à 2 pages) : « Envoyer en PDF » et « Télécharger le PDF »',
      'Le PDF reprend toute la fiche (détail, récapitulatif, coût total, geste commercial, ajouts / déductions) et les tickets en annexe',
      'Aucune intervention ni le récapitulatif ne sont coupés entre deux pages ; pages numérotées',
      'Partager (jour / chantier) : l’envoi principal devient la fiche PDF ; le message texte reste disponible',
    ],
  },
  {
    version: '1.6.0',
    date: '06/10/2026',
    items: [
      'Lignes libres « À ajouter » / « À déduire » (montant + observation), autant que nécessaire',
      'Dans chaque prestation (datées), ou sur la fiche récap sans date (enregistrées avec le chantier)',
      'Comptées dans la fiche récap, la fiche chantier, les compteurs et le bilan (mois / année), et dans l’export CSV',
    ],
  },
  {
    version: '1.5.2',
    date: '06/10/2026',
    items: [
      'Fiche de coût : alerte quand les prestations n’ont pas de temps de trajet, et bouton « Compléter depuis le chantier »',
      'En ajoutant des temps de trajet à un chantier, l’appli propose de les reporter dans ses prestations déjà saisies',
    ],
  },
  {
    version: '1.5.1',
    date: '06/10/2026',
    items: [
      'Fiche de coût : choix « Temps de trajet » et « Kilomètres » (selon prestations / tout facturé / tout offert) avec coût total recalculé en direct',
      'Bouton « Enregistrer ces choix » pour les reporter dans les prestations',
      'Kilomètres offerts possibles dans chaque prestation, avec la valeur du cadeau',
    ],
  },
  {
    version: '1.5.0',
    date: '06/10/2026',
    items: [
      'Temps de trajet moyen par chantier, depuis la maison et depuis le travail (calcul automatique possible)',
      'Trajet facturé à un tarif horaire dédié, ou non facturé',
      'Comparaison immédiate dans la prestation : coût avec trajet facturé / non facturé',
      '🎁 Trajet offert : valeur du « cadeau » affichée (prestation, compteurs, chantier, bilan, fiche de coût)',
      'Trajet retiré automatiquement du temps de travail quand il est saisi en horaires (porte à porte)',
      'Fiche de coût : ligne « Temps de trajet » et mention « Geste commercial : temps de trajet offert »',
      'Comparaison A / B : tarif trajet et choix facturé / non facturé',
    ],
  },
  {
    version: '1.4.2',
    date: '06/10/2026',
    items: ['Plus de chargement sans fin : en cas de refus de Firebase, la raison s’affiche ; si le réseau est lent, l’appli s’ouvre au bout de 8 s'],
  },
  {
    version: '1.4.1',
    date: '06/10/2026',
    items: ['Données Firebase rangées sous « bricolagePro » : l’appli peut partager un projet Firebase existant sans mélanger les données'],
  },
  {
    version: '1.4.0',
    date: '05/10/2026',
    items: [
      'Changement des tarifs en une fois sur toutes les prestations ou une sélection (filtres chantier, période, anciens tarifs)',
      'Comparaison de deux tarifs face à face (A / B) : coût par poste, coût total, écart en € et en %',
      'Sources de comparaison : tarifs enregistrés, tarifs actuels ou valeurs personnalisées à tester',
      'Application du tarif choisi avec confirmation (coût avant / après)',
      'Accès depuis Réglages et depuis la fiche chantier (bouton « Tarifs »)',
    ],
  },
  {
    version: '1.3.0',
    date: '05/10/2026',
    items: [
      'Temps de travail et temps de courses : saisie au choix en durée ou en heure de début / heure de fin',
      'Durée calculée automatiquement (pause déductible pour le travail, fin après minuit gérée)',
      'Horaires repris sur les cartes, le partage, la fiche récapitulative et l’export CSV',
      'Le dernier mode de saisie utilisé est proposé par défaut',
    ],
  },
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
