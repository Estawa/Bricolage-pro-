// ---------------------------------------------------------------
// Données de l'appli : deux « magasins » interchangeables
//  - useLocalStore : stockage dans le téléphone (sans compte)
//  - useCloudStore : Firebase Firestore (compte connecté, synchro multi-appareils)
// Les deux exposent exactement les mêmes fonctions.
// ---------------------------------------------------------------
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, setDoc, writeBatch } from 'firebase/firestore';
import { auth, db, firebaseEnabled } from '../firebase';
import { DEFAULT_SETTINGS } from './calc';
import { usePersistentState } from './storage';
import { localPhotos } from './photos';

const clean = (o) => JSON.parse(JSON.stringify(o)); // Firestore refuse les « undefined »
const byNom = (a, b) => (a.nom || '').localeCompare(b.nom || '', 'fr');
const resolve = (next, prev) => (typeof next === 'function' ? next(prev) : next);

// ---------------- Compte ----------------
export function useAuth() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(!firebaseEnabled);
  useEffect(() => {
    if (!firebaseEnabled) return undefined;
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setReady(true);
    });
  }, []);
  return { user, ready };
}

// ---------------- Mode téléphone seul ----------------
export function useLocalStore() {
  const [settings, setSettingsState] = usePersistentState('settings', DEFAULT_SETTINGS);
  const [chantiers, setChantiers] = usePersistentState('chantiers', []);
  const [entries, setEntries] = usePersistentState('entries', []);

  const upsert = (setter) => (item) =>
    setter((l) => (l.some((x) => x.id === item.id) ? l.map((x) => (x.id === item.id ? item : x)) : [...l, item]));
  const remove = (setter) => (id) => setter((l) => l.filter((x) => x.id !== id));

  return {
    mode: 'local',
    loaded: true,
    syncState: 'local',
    settings,
    chantiers: [...chantiers].sort(byNom),
    entries,
    setSettings: (next) => setSettingsState((p) => resolve(next, p)),
    saveEntry: upsert(setEntries),
    saveEntries: (items) => {
      const byId = new Map(items.map((x) => [x.id, x]));
      setEntries((l) => l.map((x) => byId.get(x.id) || x));
    },
    deleteEntry: remove(setEntries),
    saveChantier: upsert(setChantiers),
    deleteChantier: remove(setChantiers),
    photos: localPhotos,
    importAll: async (d) => {
      if (d.settings) setSettingsState(d.settings);
      setChantiers(d.chantiers || []);
      setEntries(d.entries || []);
      for (const [id, data] of Object.entries(d.photos || {})) await localPhotos.set(id, data);
    },
    resetAll: async () => {
      setChantiers([]);
      setEntries([]);
      await localPhotos.clear();
    },
  };
}

// ---------------- Mode compte Firebase ----------------
export function useCloudStore(user) {
  const uid = user?.uid || null;
  const [settings, setSettingsState] = useState(DEFAULT_SETTINGS);
  const [chantiers, setChantiers] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loadedParts, setLoadedParts] = useState({});
  const [pending, setPending] = useState({});
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  const settingsRef = useRef(DEFAULT_SETTINGS);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  useEffect(() => {
    setLoadedParts({});
    setPending({});
    if (!uid || !db) return undefined;
    const opts = { includeMetadataChanges: true };
    const mark = (part, snap) => {
      setLoadedParts((p) => (p[part] ? p : { ...p, [part]: true }));
      setPending((p) => ({ ...p, [part]: snap.metadata.hasPendingWrites }));
    };

    const u1 = onSnapshot(doc(db, 'users', uid, 'meta', 'settings'), opts, (snap) => {
      const data = snap.exists() ? snap.data() : DEFAULT_SETTINGS;
      settingsRef.current = data;
      setSettingsState(data);
      mark('settings', snap);
    });
    const u2 = onSnapshot(collection(db, 'users', uid, 'chantiers'), opts, (qs) => {
      setChantiers(qs.docs.map((d) => ({ ...d.data(), id: d.id })).sort(byNom));
      mark('chantiers', qs);
    });
    const u3 = onSnapshot(collection(db, 'users', uid, 'entries'), opts, (qs) => {
      setEntries(qs.docs.map((d) => ({ ...d.data(), id: d.id })));
      mark('entries', qs);
    });
    return () => {
      u1();
      u2();
      u3();
    };
  }, [uid]);

  const setSettings = useCallback(
    (next) => {
      if (!uid) return;
      const value = resolve(next, settingsRef.current);
      settingsRef.current = value;
      setSettingsState(value); // affichage immédiat pendant la frappe
      setDoc(doc(db, 'users', uid, 'meta', 'settings'), clean(value));
    },
    [uid]
  );

  const col = (name) => collection(db, 'users', uid, name);

  const deleteAll = async (name) => {
    const qs = await getDocs(col(name));
    for (let i = 0; i < qs.docs.length; i += 400) {
      const b = writeBatch(db);
      qs.docs.slice(i, i + 400).forEach((d) => b.delete(d.ref));
      await b.commit();
    }
  };

  const writeAll = async (name, items) => {
    for (let i = 0; i < items.length; i += 400) {
      const b = writeBatch(db);
      items.slice(i, i + 400).forEach((it) => b.set(doc(col(name), it.id), clean(it)));
      await b.commit();
    }
  };

  const photos = useMemo(
    () => ({
      get: async (id) => {
        const snap = await getDoc(doc(db, 'users', uid, 'photos', id));
        return snap.exists() ? snap.data().data : null;
      },
      set: (id, data) => setDoc(doc(db, 'users', uid, 'photos', id), { data, createdAt: Date.now() }),
      del: (id) => deleteDoc(doc(db, 'users', uid, 'photos', id)),
    }),
    [uid]
  );

  const loaded = !!(loadedParts.settings && loadedParts.chantiers && loadedParts.entries);
  const hasPending = Object.values(pending).some(Boolean);

  return {
    mode: 'cloud',
    loaded,
    syncState: !online ? 'offline' : hasPending ? 'pending' : 'synced',
    settings,
    chantiers,
    entries,
    setSettings,
    saveEntry: (e) => setDoc(doc(col('entries'), e.id), clean(e)),
    saveEntries: (items) => writeAll('entries', items),
    deleteEntry: (id) => deleteDoc(doc(col('entries'), id)),
    saveChantier: (c) => setDoc(doc(col('chantiers'), c.id), clean(c)),
    deleteChantier: (id) => deleteDoc(doc(col('chantiers'), id)),
    photos,
    importAll: async (d) => {
      await deleteAll('entries');
      await deleteAll('chantiers');
      await deleteAll('photos');
      if (d.settings) setSettings(d.settings);
      // une photo par écriture (chaque photo pèse jusqu'à ~900 Ko)
      for (const [id, data] of Object.entries(d.photos || {})) await photos.set(id, data);
      await writeAll('chantiers', d.chantiers || []);
      await writeAll('entries', d.entries || []);
    },
    resetAll: async () => {
      await deleteAll('entries');
      await deleteAll('chantiers');
      await deleteAll('photos');
    },
  };
}
