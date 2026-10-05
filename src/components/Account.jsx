import { useState } from 'react';
import { Cloud, CloudOff, LogOut, Loader2, Smartphone, RefreshCw } from 'lucide-react';
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth, firebaseEnabled } from '../firebase';
import { Card, Label, Button, inputCls } from './ui';

const ERREURS = {
  'auth/invalid-credential': 'E-mail ou mot de passe incorrect.',
  'auth/wrong-password': 'Mot de passe incorrect.',
  'auth/user-not-found': 'Aucun compte avec cet e-mail.',
  'auth/email-already-in-use': 'Un compte existe déjà avec cet e-mail : utilisez « Se connecter ».',
  'auth/weak-password': 'Mot de passe trop court (6 caractères minimum).',
  'auth/invalid-email': 'Adresse e-mail invalide.',
  'auth/network-request-failed': 'Pas de connexion internet.',
  'auth/too-many-requests': 'Trop d’essais. Réessayez dans quelques minutes.',
};
const msgErreur = (e) => ERREURS[e?.code] || 'Une erreur est survenue. Réessayez.';

export function AuthForm() {
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const run = async (fn) => {
    setBusy(true);
    setMsg('');
    try {
      await fn();
    } catch (e) {
      setMsg(msgErreur(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block">
        <Label>E-mail</Label>
        <input id="auth-email" type="email" autoComplete="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value.trim())} />
      </label>
      <label className="block">
        <Label>Mot de passe</Label>
        <input id="auth-pwd" type="password" autoComplete="current-password" className={inputCls} value={pwd} onChange={(e) => setPwd(e.target.value)} />
      </label>
      {msg && <p className="text-sm text-red-600 dark:text-red-400">{msg}</p>}
      <Button className="w-full" disabled={busy || !email || !pwd} onClick={() => run(() => signInWithEmailAndPassword(auth, email, pwd))} data-testid="se-connecter">
        {busy && <Loader2 size={18} className="animate-spin" />} Se connecter
      </Button>
      <Button variant="ghost" className="w-full" disabled={busy || !email || !pwd} onClick={() => run(() => createUserWithEmailAndPassword(auth, email, pwd))}>
        Créer mon compte
      </Button>
      <button
        type="button"
        className="w-full text-xs text-stone-500 underline"
        onClick={() =>
          email
            ? run(async () => {
                await sendPasswordResetEmail(auth, email);
                setMsg('');
                alert(`Un e-mail de réinitialisation a été envoyé à ${email}.`);
              })
            : setMsg('Indiquez votre e-mail pour recevoir le lien.')
        }
      >
        Mot de passe oublié ?
      </button>
    </div>
  );
}

// Écran d'accueil quand Firebase est configuré et que personne n'est connecté
export function LoginScreen({ onLocal }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-orange-50/60 px-4 dark:bg-stone-900">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <img src="/icon.svg" alt="" className="mx-auto h-20 w-20 rounded-3xl shadow-lg" />
          <h1 className="mt-3 text-2xl font-extrabold text-stone-900 dark:text-stone-100">
            Bricolage Pro <span className="font-normal text-stone-400">by C. Guilhem</span>
          </h1>
          <p className="mt-1 text-sm text-stone-500">Connectez-vous pour retrouver vos données sur tous vos appareils.</p>
        </div>
        <Card>
          <AuthForm />
        </Card>
        <button type="button" onClick={onLocal} className="flex w-full items-center justify-center gap-1 text-sm text-stone-500 underline" data-testid="mode-local">
          <Smartphone size={14} /> Continuer sans compte (données sur ce téléphone)
        </button>
      </div>
    </div>
  );
}

export function SyncBadge({ state }) {
  const map = {
    synced: { icon: <Cloud size={18} />, cls: 'text-emerald-600', title: 'Synchronisé' },
    pending: { icon: <RefreshCw size={18} className="animate-spin" />, cls: 'text-amber-500', title: 'Synchronisation en cours…' },
    offline: { icon: <CloudOff size={18} />, cls: 'text-stone-400', title: 'Hors ligne — synchronisation au retour du réseau' },
    local: { icon: <Smartphone size={18} />, cls: 'text-stone-400', title: 'Données sur ce téléphone uniquement' },
  };
  const m = map[state] || map.local;
  return (
    <span className={`p-2 ${m.cls}`} title={m.title} aria-label={m.title} data-testid={`sync-${state}`}>
      {m.icon}
    </span>
  );
}

// Carte « Compte » de l'onglet Réglages
export function AccountCard({ user, syncState, onLeaveLocal }) {
  if (!firebaseEnabled) {
    return (
      <Card className="space-y-2">
        <h3 className="flex items-center gap-2 font-semibold">
          <Smartphone size={18} className="text-orange-600" /> Compte & synchronisation
        </h3>
        <p className="text-sm text-stone-500">
          Synchronisation non configurée : renseignez la configuration Firebase dans <code>src/firebase.js</code> (voir README).
        </p>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="space-y-3">
        <h3 className="flex items-center gap-2 font-semibold">
          <Cloud size={18} className="text-orange-600" /> Compte & synchronisation
        </h3>
        <p className="text-sm text-stone-500">
          Vous utilisez l’appli sans compte. Connectez-vous pour synchroniser : on vous proposera d’envoyer les données de ce téléphone.
        </p>
        <Button variant="ghost" className="w-full" onClick={onLeaveLocal}>
          Se connecter / créer un compte
        </Button>
      </Card>
    );
  }

  const libelle = {
    synced: 'Tout est synchronisé',
    pending: 'Synchronisation en cours…',
    offline: 'Hors ligne : les modifications seront envoyées au retour du réseau',
  }[syncState];

  return (
    <Card className="space-y-3">
      <h3 className="flex items-center gap-2 font-semibold">
        <Cloud size={18} className="text-orange-600" /> Compte & synchronisation
      </h3>
      <div className="text-sm">
        <div className="text-stone-500">Connecté avec</div>
        <div className="font-medium">{user.email}</div>
      </div>
      <div className="flex items-center gap-1 text-sm text-stone-600 dark:text-stone-300">
        <SyncBadge state={syncState} /> {libelle}
      </div>
      <Button
        variant="ghost"
        className="w-full"
        onClick={() => {
          if (confirm('Se déconnecter ? Vos données restent dans votre compte.')) signOut(auth);
        }}
      >
        <LogOut size={18} /> Se déconnecter
      </Button>
    </Card>
  );
}
