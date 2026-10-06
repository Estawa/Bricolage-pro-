# Bricolage Pro by C. Guilhem

Calcul du coût des prestations de bricolage : temps de travail, temps de courses,
kilomètres (départ/retour Maison ou Travail), camion, nettoyage, facturation.

Stack : React + Vite + Tailwind + lucide-react + Firebase (Auth + Firestore), PWA installable.
Données synchronisées dans Firestore (avec cache hors ligne), ou dans le téléphone en mode « sans compte ».

## Mise en ligne (comme les autres applis)
1. Créer le dépôt GitHub `Estawa/bricolage-pro` et y déposer tout le contenu de ce dossier
   (sauf `node_modules` et `dist`).
2. Sur Vercel : « Add New Project » → importer le dépôt → framework **Vite** détecté → Deploy.
3. Sur le téléphone : ouvrir l'adresse Vercel → « Ajouter à l'écran d'accueil ».

## Activer la synchronisation Firebase
1. https://console.firebase.google.com → « Ajouter un projet » (ex. `bricolage-pro`).
2. **Authentication** → Commencer → Mode de connexion → activer **Adresse e-mail/Mot de passe**.
3. **Firestore Database** → Créer une base (région `europe-west`) → mode production.
4. Onglet **Règles** de Firestore → coller le contenu du fichier `firestore.rules` → Publier.
5. Paramètres du projet (roue dentée) → « Vos applications » → icône Web `</>` → enregistrer l'appli →
   copier l'objet `firebaseConfig` et le coller dans `src/firebase.js` (à la place des `A_REMPLACER`).
6. Authentication → Paramètres → **Domaines autorisés** → ajouter l'adresse Vercel de l'appli
   (ex. `bricolage-pro.vercel.app`).
7. Pousser sur GitHub : Vercel redéploie tout seul. Au premier lancement, « Créer mon compte ».

Données Firestore : `bricolagePro/{uid}/meta/settings`, `bricolagePro/{uid}/chantiers/{id}`, `bricolagePro/{uid}/entries/{id}`, `bricolagePro/{uid}/photos/{id}`.

### Utiliser un projet Firebase déjà existant (limite de projets atteinte)
Les données de l'appli sont rangées sous `bricolagePro/…`, elles ne se mélangent pas avec celles d'une autre appli.
1. Dans le projet existant : Paramètres du projet → Vos applications → `</>` → nouvelle appli Web « Bricolage Pro » → copier sa config.
2. Authentication : vérifier que « Adresse e-mail/Mot de passe » est activé (n'affecte pas les autres applis).
3. Firestore → Règles : **ajouter** le bloc `match /bricolagePro/...` de `firestore.rules` à côté des règles existantes (ne rien supprimer).
4. Authentication → Paramètres → Domaines autorisés : ajouter l'adresse Vercel de Bricolage Pro.
Les photos de tickets sont compressées dans le téléphone et rangées dans Firestore : **pas besoin d'activer Firebase Storage**
(qui exige désormais le forfait payant). Le forfait gratuit offre 1 Go, soit plusieurs milliers de tickets.

## En local
```
npm install
npm run dev
```

## Fonctionnement des calculs
- Km = km aller (depuis le point de départ) + km retour (vers le point de retour) + km de courses
- Déplacement = km × coût kilométrique
- Camion = forfait + km × supplément camion ; nettoyage = forfait (seulement si camion)
- Les tarifs sont figés dans chaque prestation : changer ses tarifs n'altère pas l'historique
  (bouton « Recalculer avec mes tarifs actuels » dans la fiche d'une prestation).
