// ---------------------------------------------------------------
// Configuration Firebase — À REMPLACER par celle de votre projet
// (Console Firebase > Paramètres du projet > Vos applications > Web)
// Tant que la config n'est pas remplie, l'appli fonctionne en mode
// « téléphone seul » (données stockées localement).
// ---------------------------------------------------------------
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: 'A_REMPLACER',
  authDomain: 'A_REMPLACER.firebaseapp.com',
  projectId: 'A_REMPLACER',
  storageBucket: 'A_REMPLACER.appspot.com',
  messagingSenderId: 'A_REMPLACER',
  appId: 'A_REMPLACER',
};

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
