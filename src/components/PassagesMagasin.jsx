import { useRef, useState } from 'react';
import { Store, Plus, Trash2, Wand2, Loader2, ArrowRight, Star, Check, X } from 'lucide-react';
import { uid, km1 } from '../utils/calc';
import { calculerPassage } from '../utils/distance';
import { inputCls, Segmented } from './ui';

// Passages au magasin d'une prestation : depuis (Maison / Travail / Chantier) → magasin → vers (…)
// Chaque passage donne des km « matériel » ; la somme remplit « Km supplémentaires pour les courses ».
// value = [{ id, magasinId, magasinNom, depuis, vers, km, surTrajet, info }]
const n = (v) => parseFloat(String(v ?? '').replace(',', '.')) || 0;

export const kmPassages = (list = []) => Math.round(list.reduce((a, p) => a + (p.surTrajet ? 0 : n(p.km)), 0) * 10) / 10;

// Mémoire (sur ce téléphone) du dernier trajet utilisé pour chaque magasin + nombre d'utilisations
const MEMO_KEY = 'bricolage-pro:magasins-memo';
function lireMemo() {
  try {
    return JSON.parse(localStorage.getItem(MEMO_KEY) || '{}');
  } catch {
    return {};
  }
}
function ecrireMemo(id, patch) {
  try {
    const m = lireMemo();
    m[id] = { ...m[id], ...patch, nb: (m[id]?.nb || 0) + (patch.compter ? 1 : 0) };
    delete m[id].compter;
    localStorage.setItem(MEMO_KEY, JSON.stringify(m));
  } catch {
    /* ignore */
  }
}

export default function PassagesMagasin({ value = [], onChange, settings, chantier, depart, onAddMagasin }) {
  const magasins = settings.magasins || [];
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState({});
  const [nouveau, setNouveau] = useState(null); // { pourId, nom, adresse }
  const [, forcer] = useState(0);
  // toujours la dernière liste (les calculs sont asynchrones)
  const valeurs = useRef(value);
  valeurs.current = value;
  const memo = lireMemo();

  const lieux = [
    { value: 'maison', label: settings.bases.maison.label },
    { value: 'travail', label: settings.bases.travail.label },
    { value: 'chantier', label: 'Chantier' },
  ];
  const nomLieu = (v) => lieux.find((l) => l.value === v)?.label || v;

  // Raccourcis : favoris d'abord, puis les plus utilisés
  const raccourcis = [...magasins]
    .filter((m) => m.favori || memo[m.id]?.nb)
    .sort((a, b) => (b.favori ? 1 : 0) - (a.favori ? 1 : 0) || (memo[b.id]?.nb || 0) - (memo[a.id]?.nb || 0))
    .slice(0, 6);

  const maj = (id, patch) => onChange(valeurs.current.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const calculer = async (p) => {
    const magasin = magasins.find((m) => m.id === p.magasinId);
    if (!magasin) return;
    setBusy(p.id);
    setErr((e) => ({ ...e, [p.id]: '' }));
    try {
      const r = await calculerPassage({ depuis: p.depuis, vers: p.vers, magasin, bases: settings.bases, chantier });
      const info =
        p.depuis === p.vers
          ? `Aller-retour ${nomLieu(p.depuis)} ↔ ${magasin.nom} : ${km1(r.via)}`
          : `${nomLieu(p.depuis)} → ${magasin.nom} → ${nomLieu(p.vers)} : ${km1(r.via)} au lieu de ${km1(r.direct)} en direct`;
      maj(p.id, { km: r.detour, info });
    } catch (e) {
      setErr((x) => ({ ...x, [p.id]: `${e.message}. Saisissez les km à la main.` }));
    } finally {
      setBusy(null);
    }
  };

  // Nouveau passage avec le dernier trajet mémorisé pour ce magasin
  const ajouter = (m, auto = false) => {
    const mem = (m && memo[m.id]) || {};
    const p = {
      id: uid(),
      magasinId: m?.id || '',
      magasinNom: m?.nom || '',
      depuis: mem.depuis || depart || 'maison',
      vers: mem.vers || 'chantier',
      surTrajet: !!mem.surTrajet,
      km: '',
      info: '',
    };
    onChange([...valeurs.current, p]);
    if (m) {
      ecrireMemo(m.id, { compter: true });
      forcer((x) => x + 1);
    }
    if (auto && m && !p.surTrajet) setTimeout(() => calculer(p), 0);
  };

  // Retenir le trajet choisi pour ce magasin
  const majEtRetenir = (p, patch) => {
    maj(p.id, patch);
    if (p.magasinId) {
      const { depuis, vers, surTrajet } = { ...p, ...patch };
      ecrireMemo(p.magasinId, { depuis, vers, surTrajet });
    }
  };

  const choisirMagasin = (p, id) => {
    if (id === '__nouveau__') {
      setNouveau({ pourId: p.id, nom: '', adresse: '' });
      return;
    }
    const m = magasins.find((x) => x.id === id);
    const mem = memo[id] || {};
    maj(p.id, {
      magasinId: id,
      magasinNom: m?.nom || '',
      info: '',
      km: '',
      ...(mem.depuis ? { depuis: mem.depuis, vers: mem.vers, surTrajet: !!mem.surTrajet } : {}),
    });
    if (m) ecrireMemo(id, { compter: true });
  };

  const enregistrerNouveau = () => {
    const m = { id: uid(), nom: nouveau.nom.trim(), adresse: nouveau.adresse.trim(), favori: true };
    onAddMagasin?.(m);
    if (nouveau.pourId) maj(nouveau.pourId, { magasinId: m.id, magasinNom: m.nom, info: '', km: '' });
    else onChange([...valeurs.current, { id: uid(), magasinId: m.id, magasinNom: m.nom, depuis: depart || 'maison', vers: 'chantier', km: '', surTrajet: false, info: '' }]);
    ecrireMemo(m.id, { compter: true });
    setNouveau(null);
  };

  return (
    <div className="space-y-2 rounded-xl border border-stone-200 bg-white p-3 dark:border-stone-700 dark:bg-stone-800" data-testid="passages">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Store size={16} className="text-orange-600" /> Passages au magasin (matériel)
      </div>

      {/* Raccourcis : un appui = passage ajouté + km calculés */}
      {raccourcis.length > 0 && (
        <div className="flex flex-wrap gap-1.5" data-testid="raccourcis">
          {raccourcis.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => ajouter(m, true)}
              className="inline-flex items-center gap-1 rounded-full border border-orange-300 bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-800 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-200"
              data-testid="raccourci"
              title={memo[m.id]?.depuis ? `${nomLieu(memo[m.id].depuis)} → ${m.nom} → ${nomLieu(memo[m.id].vers)}` : m.nom}
            >
              {m.favori ? <Star size={12} className="fill-current" /> : <Plus size={12} />} {m.nom || 'Magasin'}
            </button>
          ))}
        </div>
      )}
      {magasins.length === 0 && !nouveau && <p className="text-xs text-stone-500">Aucun magasin enregistré : ajoutez-en un ci-dessous (ou dans Réglages).</p>}

      {value.map((p) => {
        const mag = magasins.find((m) => m.id === p.magasinId);
        return (
          <div key={p.id} className="space-y-2 rounded-lg bg-stone-50 p-2 dark:bg-stone-900/60" data-testid="passage">
            <div className="flex items-center gap-2">
              <select className={`${inputCls} flex-1 py-1.5 text-sm`} value={p.magasinId} onChange={(e) => choisirMagasin(p, e.target.value)} data-testid="passage-magasin">
                {!mag && <option value="">— Magasin —</option>}
                {[...magasins]
                  .sort((a, b) => (b.favori ? 1 : 0) - (a.favori ? 1 : 0))
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.favori ? '★ ' : ''}
                      {m.nom}
                    </option>
                  ))}
                <option value="__nouveau__">+ Nouveau magasin…</option>
              </select>
              <button type="button" onClick={() => onChange(valeurs.current.filter((x) => x.id !== p.id))} className="rounded-lg p-1.5 text-red-600" aria-label="Supprimer le passage">
                <Trash2 size={16} />
              </button>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-orange-600"
                checked={!!p.surTrajet}
                onChange={(e) => majEtRetenir(p, { surTrajet: e.target.checked })}
                data-testid="passage-surtrajet"
              />
              Sur mon trajet, sans détour (0 km)
            </label>

            {!p.surTrajet && (
              <>
                <div>
                  <span className="mb-1 block text-xs text-stone-500">Depuis</span>
                  <Segmented small value={p.depuis} onChange={(v) => majEtRetenir(p, { depuis: v, info: '' })} options={lieux} />
                </div>
                <div>
                  <span className="mb-1 block text-xs text-stone-500">Puis vers</span>
                  <Segmented small value={p.vers} onChange={(v) => majEtRetenir(p, { vers: v, info: '' })} options={lieux} />
                </div>
                <div className="flex items-center gap-1 text-xs text-stone-500">
                  {nomLieu(p.depuis)} <ArrowRight size={11} /> {mag?.nom || 'magasin'} <ArrowRight size={11} /> {nomLieu(p.vers)}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => calculer(p)}
                    disabled={!mag || busy === p.id}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-stone-200 px-2 py-1.5 text-xs font-semibold text-stone-700 disabled:opacity-50 dark:bg-stone-700 dark:text-stone-200"
                    data-testid="passage-calculer"
                  >
                    {busy === p.id ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />} Calculer les km
                  </button>
                  <div className="relative w-24">
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      min="0"
                      className={`${inputCls} py-1.5 pr-8 text-right text-sm`}
                      value={p.km}
                      onChange={(e) => maj(p.id, { km: e.target.value })}
                      data-testid="passage-km"
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-stone-400">km</span>
                  </div>
                </div>
                {p.info && (
                  <p className="text-xs text-stone-600 dark:text-stone-300" data-testid="passage-info">
                    {p.info} → <b>{km1(n(p.km))} comptés</b>
                  </p>
                )}
                {err[p.id] && <p className="text-xs text-red-600">{err[p.id]}</p>}
              </>
            )}
          </div>
        );
      })}

      {/* Ajout rapide d'un magasin, mémorisé pour les prochaines fois */}
      {nouveau && (
        <div className="space-y-2 rounded-lg border border-orange-300 p-2 dark:border-orange-800" data-testid="nouveau-magasin">
          <div className="text-xs font-semibold">Nouveau magasin (enregistré en favori)</div>
          <input className={`${inputCls} py-1.5 text-sm`} placeholder="Nom (ex. Point P Corbeil)" value={nouveau.nom} onChange={(e) => setNouveau({ ...nouveau, nom: e.target.value })} data-testid="nouveau-magasin-nom" />
          <input
            className={`${inputCls} py-1.5 text-sm`}
            placeholder="Adresse"
            value={nouveau.adresse}
            onChange={(e) => setNouveau({ ...nouveau, adresse: e.target.value })}
            data-testid="nouveau-magasin-adresse"
          />
          <div className="flex gap-2">
            <button type="button" onClick={() => setNouveau(null)} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-stone-100 px-2 py-1.5 text-xs font-semibold dark:bg-stone-700">
              <X size={14} /> Annuler
            </button>
            <button
              type="button"
              disabled={!nouveau.nom.trim()}
              onClick={enregistrerNouveau}
              className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-orange-600 px-2 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
              data-testid="nouveau-magasin-ok"
            >
              <Check size={14} /> Enregistrer
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => ajouter(null)}
          className="flex items-center justify-center gap-1 rounded-lg border border-dashed border-orange-300 px-2 py-1.5 text-sm font-semibold text-orange-700 dark:text-orange-300"
          data-testid="passage-ajouter"
        >
          <Plus size={16} /> Passage
        </button>
        <button
          type="button"
          onClick={() => setNouveau({ pourId: null, nom: '', adresse: '' })}
          className="flex items-center justify-center gap-1 rounded-lg border border-dashed border-stone-300 px-2 py-1.5 text-sm font-semibold text-stone-600 dark:text-stone-300"
          data-testid="magasin-nouveau"
        >
          <Store size={16} /> Nouveau magasin
        </button>
      </div>
      {value.length > 0 && (
        <p className="text-xs text-stone-500">
          Total matériel : <b data-testid="passages-total">{km1(kmPassages(value))}</b> (reporté dans « Km supplémentaires pour les courses »)
        </p>
      )}
    </div>
  );
}
