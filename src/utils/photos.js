// ---------------------------------------------------------------
// Photos des tickets de caisse
// - compression dans le téléphone avant enregistrement (≈ 150–400 Ko)
// - mode sans compte : stockage IndexedDB (le localStorage est trop petit)
// - mode compte : un document Firestore par photo (pas besoin de Firebase Storage)
// ---------------------------------------------------------------
import { createContext, useContext, useEffect, useState } from 'react';

const MAX_DATAURL = 900 * 1024; // limite Firestore : 1 Mo par document

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Image illisible'));
    };
    img.src = url;
  });
}

export async function compressImage(file, maxSide = 1600) {
  const img = await loadImage(file);
  let side = maxSide;
  let quality = 0.72;
  for (let i = 0; i < 6; i++) {
    const scale = Math.min(1, side / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const data = canvas.toDataURL('image/jpeg', quality);
    if (data.length <= MAX_DATAURL) return data;
    quality = Math.max(0.45, quality - 0.1);
    side = Math.round(side * 0.85);
  }
  throw new Error('Photo trop lourde');
}

export function dataUrlToFile(dataUrl, name) {
  const [head, b64] = dataUrl.split(',');
  const mime = head.match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new File([arr], name, { type: mime });
}

// ---------- IndexedDB (mode sans compte) ----------
let dbPromise = null;
function idb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open('bricolage-pro', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('photos');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}
async function idbReq(mode, fn) {
  const db = await idb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('photos', mode);
    const r = fn(tx.objectStore('photos'));
    tx.oncomplete = () => resolve(r?.result);
    tx.onerror = () => reject(tx.error);
  });
}
export const localPhotos = {
  get: (id) => idbReq('readonly', (s) => s.get(id)),
  set: (id, data) => idbReq('readwrite', (s) => s.put(data, id)),
  del: (id) => idbReq('readwrite', (s) => s.delete(id)),
  clear: () => idbReq('readwrite', (s) => s.clear()),
};

// ---------- Contexte partagé par toute l'appli ----------
export const PhotoContext = createContext(null);
export const usePhotoApi = () => useContext(PhotoContext);

const cache = new Map();

export function usePhoto(id) {
  const api = usePhotoApi();
  const [src, setSrc] = useState(() => cache.get(id) || null);
  useEffect(() => {
    let alive = true;
    if (!id || !api) return undefined;
    if (cache.has(id)) {
      setSrc(cache.get(id));
      return undefined;
    }
    api
      .get(id)
      .then((d) => {
        if (d) cache.set(id, d);
        if (alive) setSrc(d || null);
      })
      .catch(() => alive && setSrc(null));
    return () => {
      alive = false;
    };
  }, [id, api]);
  return src;
}

export const photoCache = cache;
