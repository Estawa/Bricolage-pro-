// ---------------------------------------------------------------
// Configuration Firebase — projet « escalade-pro » (renommé Bricolage Pro)
// (Console Firebase > Paramètres du projet > Vos applications > Web)
// Tant que la config n'est pas remplie, l'appli fonctionne en mode
// « téléphone seul » (données stockées localement).
// ---------------------------------------------------------------
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: 'AIzaSyAUl5Z4YM5fVj_gPX9DuLWQX_oQS-u28R4',
  authDomain: 'escalade-pro.firebaseapp.com',
  projectId: 'escalade-pro',
  storageBucket: 'escalade-pro.firebasestorage.app',
  messagingSenderId: '421679387453',
  appId: '1:421679387453:web:0d6898439cd6c81eb66b54',
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
