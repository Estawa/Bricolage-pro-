// ---------------------------------------------------------------
// Configuration Firebase — projet « Applis perso » (identifiant doucheco),
// partagé avec Courses Pro et Douch'Eco (déménagé de « escalade-pro » en oct. 2026)
// (Console Firebase > Paramètres du projet > Vos applications > Web)
// Tant que la config n'est pas remplie, l'appli fonctionne en mode
// « téléphone seul » (données stockées localement).
// ---------------------------------------------------------------
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: 'AIzaSyDhCmEw5c0hDEJZYox73mfW0BOdRicOSTk',
  authDomain: 'doucheco.firebaseapp.com',
  projectId: 'doucheco',
  storageBucket: 'doucheco.firebasestorage.app',
  messagingSenderId: '961453430586',
  appId: '1:961453430586:web:d77427df31291b8d11a203',
};

// Collection racine des données de Bricolage Pro dans Firestore.
// Un nom propre à l'appli permet de partager un projet Firebase déjà existant
// (celui d'une autre de vos applis) sans mélanger les données.
export const DATA_ROOT = 'bricolagePro';

export const firebaseEnabled = !String(firebaseConfig.apiKey).startsWith('A_REMPLACER');

let auth = null;
let db = null;

if (firebaseEnabled) {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  // Cache local : l'appli marche sans réseau et synchronise au retour de la connexion
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
}

export { auth, db };
