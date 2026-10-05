import { useMemo, useState } from 'react';
import { CheckSquare, Square, ArrowRight, Scale } from 'lucide-react';
import { computeEntry, snapshotTarifs, eur, shortDate, hm, km1 } from '../utils/calc';
import { sortByDate } from '../utils/recap';
import { Modal, Button, inputCls } from './ui';
import { anciensTarifs } from './EntryCard';

const CHAMPS = [
  ['tauxTravail', 'Travail', '€/h'],
  ['tauxCourses', 'Courses', '€/h'],
  ['coutKm', 'Kilomètre', '€/km'],
  ['camionForfait', 'Forfait camion', '€'],
  ['camionKm', 'Supp. km camion', '€/km'],
  ['nettoyageForfait', 'Nettoyage camion', '€'],
];
const POSTES = [
  ['travail', "Main-d'œuvre"],
  ['courses', 'Courses'],
  ['deplacement', 'Déplacements'],
  ['camion', 'Camion'],
  ['nettoyage', 'Nettoyage'],
  ['fournitures', 'Fournitures'],
];
const num = (v) => parseFloat(String(v ?? '').replace(',', '.')) || 0;

// Comparaison de deux jeux de tarifs (A / B) sur une sélection de prestations,
// puis application de l'un des deux en une fois (avec confirmation).
export default function BulkTarifs({ entries, chantiers, settings, preselectIds, onApply, onClose }) {
  const actuels = snapshotTarifs(settings);

  // ---- Sélection des prestations ----
  const [filtreChantier, setFiltreChantier] = useState('tous');
  const [du, setDu] = useState('');
  const [au, setAu] = useState('');
  const [seulAnciens, setSeulAnciens] = useState(false);
  const [sel, setSel] = useState(() => new Set(preselectIds?.length ? preselectIds : entries.map((e) => e.id)));

  const visibles = useMemo(
    () =>
      sortByDate(entries).filter((e) => {
        if (filtreChantier !== 'tous' && (e.chantierId || '__libre') !== filtreChantier) return false;
        if (du && e.date < du) return false;
        if (au && e.date > au) return false;
        if (seulAnciens && !anciensTarifs(e, settings)) return false;
        return true;
      }),
    [entries, filtreChantier, du, au, seulAnciens, settings]
  );
  const cible = visibles.filter((e) => sel.has(e.id));
  const toutCoche = visibles.length > 0 && visibles.every((e) => sel.has(e.id));
  const toggle = (id) =>
    setSel((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const toutBasculer = () =>
    setSel((p) => {
      const n = new Set(p);
      visibles.forEach((e) => (toutCoche ? n.delete(e.id) : n.add(e.id)));
      return n;
    });

  // ---- Les deux tarifs comparés ----
  const [srcA, setSrcA] = useState('enregistres');
  const [srcB, setSrcB] = useState('perso');
  const [persoA, setPersoA] = useState(() => ({ ...actuels }));
  const [persoB, setPersoB] = useState(() => ({ ...actuels }));

  const tarifsDe = (src, perso, e) => (src === 'enregistres' ? e.tarifs || {} : src === 'actuels' ? actuels : perso);

  const totaux = (src, perso) => {
    const acc = { travail: 0, courses: 0, deplacement: 0, camion: 0, nettoyage: 0, fournitures: 0, total: 0 };
    for (const e of cible) {
      const c = computeEntry({ ...e, tarifs: tarifsDe(src, perso, e) });
      for (const k of Object.keys(acc)) acc[k] += c[k];
    }
    return acc;
  };
  const tA = totaux(srcA, persoA);
  const tB = totaux(srcB, persoB);
  const ecart = tB.total - tA.total;

  // valeur affichée d'un tarif pour la colonne (variable si les prestations n'ont pas toutes le même)
  const valeurColonne = (src, perso, k) => {
    if (src === 'actuels') return eur(actuels[k]);
    if (src === 'perso') return null;
    const set = new Set(cible.map((e) => num(e.tarifs?.[k])));
    if (set.size === 0) return '—';
    return set.size === 1 ? eur([...set][0]) : 'variable';
  };

  // ---- Application ----
  const [confirmer, setConfirmer] = useState(null); // 'A' | 'B'
  const appliquer = (cote) => {
    const src = cote === 'A' ? srcA : srcB;
    const perso = cote === 'A' ? persoA : persoB;
    const nouvelles = cible.map((e) => ({ ...e, tarifs: { ...(src === 'actuels' ? actuels : perso) } }));
    onApply(nouvelles);
  };

  const sources = [
    { value: 'enregistres', label: 'Enregistrés' },
    { value: 'actuels', label: 'Actuels' },
    { value: 'perso', label: 'Perso' },
  ];

  return (
    <Modal
      title="Comparer et changer les tarifs"
      onClose={onClose}
      footer={
        <div className="space-y-2">
          <div className="grid grid-cols-3 items-center gap-2 text-center">
            <div>
              <div className="text-xs text-stone-500">Tarif A</div>
              <div className="font-bold tabular-nums" data-testid="total-A">
                {eur(tA.total)}
              </div>
            </div>
            <div>
              <div className="text-xs text-stone-500">Écart B − A</div>
              <div className={`font-bold tabular-nums ${ecart > 0 ? 'text-emerald-600' : ecart < 0 ? 'text-red-600' : ''}`} data-testid="ecart">
                {ecart > 0 ? '+' : ''}
                {eur(ecart)}
              </div>
            </div>
            <div>
              <div className="text-xs text-stone-500">Tarif B</div>
              <div className="font-bold tabular-nums text-orange-700 dark:text-orange-400" data-testid="total-B">
                {eur(tB.total)}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1 py-2 text-sm" disabled={!cible.length || srcA === 'enregistres'} onClick={() => setConfirmer('A')} data-testid="appliquer-A">
              Appliquer A
            </Button>
            <Button className="flex-1 py-2 text-sm" disabled={!cible.length || srcB === 'enregistres'} onClick={() => setConfirmer('B')} data-testid="appliquer-B">
              Appliquer B
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* 1. Prestations */}
        <section className="space-y-2">
          <h3 className="font-semibold">1. Prestations concernées</h3>
          <select className={inputCls} value={filtreChantier} onChange={(e) => setFiltreChantier(e.target.value)} data-testid="filtre-chantier">
            <option value="tous">Tous les chantiers</option>
            {chantiers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
            <option value="__libre">Chantiers en saisie libre</option>
          </select>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-1 block text-xs text-stone-500">Du</span>
              <input type="date" className={inputCls} value={du} onChange={(e) => setDu(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-stone-500">Au</span>
              <input type="date" className={inputCls} value={au} onChange={(e) => setAu(e.target.value)} />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 accent-orange-600" checked={seulAnciens} onChange={(e) => setSeulAnciens(e.target.checked)} />
            Seulement celles aux anciens tarifs
          </label>
          <div className="flex items-center justify-between text-sm">
            <span className="text-stone-500" data-testid="nb-cible">
              {cible.length} / {visibles.length} cochée{cible.length > 1 ? 's' : ''}
            </span>
            <button type="button" onClick={toutBasculer} className="flex items-center gap-1 font-medium text-orange-700 dark:text-orange-400">
              {toutCoche ? <CheckSquare size={16} /> : <Square size={16} />} {toutCoche ? 'Tout décocher' : 'Tout cocher'}
            </button>
          </div>
          <div className="max-h-56 divide-y divide-stone-100 overflow-y-auto rounded-xl border border-stone-200 dark:divide-stone-700 dark:border-stone-700">
            {visibles.length === 0 && <p className="p-3 text-center text-sm text-stone-500">Aucune prestation avec ces filtres.</p>}
            {visibles.map((e) => {
              const a = computeEntry({ ...e, tarifs: tarifsDe(srcA, persoA, e) }).total;
              const b = computeEntry({ ...e, tarifs: tarifsDe(srcB, persoB, e) }).total;
              return (
                <label key={e.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                  <input type="checkbox" className="h-4 w-4 shrink-0 accent-orange-600" checked={sel.has(e.id)} onChange={() => toggle(e.id)} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{e.chantierNom}</span>
                    <span className="text-xs text-stone-500">{shortDate(e.date)}</span>
                  </span>
                  <span className="flex items-center gap-1 text-xs tabular-nums">
                    <span className="text-stone-500">{eur(a)}</span>
                    <ArrowRight size={11} />
                    <span className="font-semibold">{eur(b)}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </section>

        {/* 2. Face à face */}
        <section className="space-y-2">
          <h3 className="flex items-center gap-2 font-semibold">
            <Scale size={18} className="text-orange-600" /> 2. Tarifs face à face
          </h3>
          <div className="grid grid-cols-[1fr_1fr_1fr] gap-2 text-sm">
            <div />
            <div className="text-center font-bold">A</div>
            <div className="text-center font-bold text-orange-700 dark:text-orange-400">B</div>

            <div className="self-center text-xs text-stone-500">Source</div>
            <select className={`${inputCls} px-2 py-1.5 text-xs`} value={srcA} onChange={(e) => setSrcA(e.target.value)} data-testid="source-A">
              {sources.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <select className={`${inputCls} px-2 py-1.5 text-xs`} value={srcB} onChange={(e) => setSrcB(e.target.value)} data-testid="source-B">
              {sources.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            {CHAMPS.map(([k, l, u]) => (
              <Ligne
                key={k}
                k={k}
                label={l}
                unite={u}
                a={valeurColonne(srcA, persoA, k)}
                b={valeurColonne(srcB, persoB, k)}
                persoA={srcA === 'perso' ? persoA[k] : null}
                persoB={srcB === 'perso' ? persoB[k] : null}
                setA={(v) => setPersoA((p) => ({ ...p, [k]: v }))}
                setB={(v) => setPersoB((p) => ({ ...p, [k]: v }))}
              />
            ))}
          </div>
          <p className="text-xs text-stone-500">
            Enregistrés = tarifs de chaque prestation · Actuels = vos réglages · Perso = valeurs à tester
          </p>
        </section>

        {/* 3. Résultat */}
        <section className="space-y-2">
          <h3 className="font-semibold">3. Résultat sur {cible.length} prestation{cible.length > 1 ? 's' : ''}</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-xs text-stone-500 dark:border-stone-700">
                <th className="py-1 text-left font-medium">Poste</th>
                <th className="py-1 text-right font-medium">A</th>
                <th className="py-1 text-right font-medium">B</th>
                <th className="py-1 text-right font-medium">Écart</th>
              </tr>
            </thead>
            <tbody>
              {POSTES.filter(([k]) => tA[k] || tB[k]).map(([k, l]) => (
                <tr key={k} className="border-b border-stone-100 dark:border-stone-800">
                  <td className="py-1.5">{l}</td>
                  <td className="py-1.5 text-right tabular-nums">{eur(tA[k])}</td>
                  <td className="py-1.5 text-right tabular-nums">{eur(tB[k])}</td>
                  <td className="py-1.5 text-right tabular-nums text-stone-500">{fmtEcart(tB[k] - tA[k])}</td>
                </tr>
              ))}
              <tr className="font-bold">
                <td className="py-2">Coût total</td>
                <td className="py-2 text-right tabular-nums">{eur(tA.total)}</td>
                <td className="py-2 text-right tabular-nums text-orange-700 dark:text-orange-400">{eur(tB.total)}</td>
                <td className="py-2 text-right tabular-nums">{fmtEcart(ecart)}</td>
              </tr>
            </tbody>
          </table>
          {tA.total > 0 && <p className="text-xs text-stone-500">Soit {((ecart / tA.total) * 100).toLocaleString('fr-FR', { maximumFractionDigits: 1, signDisplay: 'always' })} % entre A et B.</p>}
          <Recap cible={cible} />
        </section>
      </div>

      {confirmer && (
        <Modal
          title={`Appliquer le tarif ${confirmer} ?`}
          onClose={() => setConfirmer(null)}
          footer={
            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => setConfirmer(null)}>
                Annuler
              </Button>
              <Button
                className="flex-1"
                data-testid="confirmer-application"
                onClick={() => {
                  appliquer(confirmer);
                  setConfirmer(null);
                }}
              >
                Confirmer
              </Button>
            </div>
          }
        >
          <p className="text-sm text-stone-600 dark:text-stone-300">
            Les tarifs <b>{confirmer}</b> vont remplacer ceux de <b>{cible.length}</b> prestation{cible.length > 1 ? 's' : ''}.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-stone-100 p-2 dark:bg-stone-900">
              <div className="text-xs text-stone-500">Coût total actuel</div>
              <div className="font-bold tabular-nums">{eur(totaux('enregistres', null).total)}</div>
            </div>
            <div className="rounded-xl bg-orange-100 p-2 dark:bg-orange-950/50">
              <div className="text-xs text-stone-500">Après application</div>
              <div className="font-bold tabular-nums text-orange-700 dark:text-orange-300">{eur(confirmer === 'A' ? tA.total : tB.total)}</div>
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  );
}

function fmtEcart(v) {
  if (Math.abs(v) < 0.005) return '—';
  return `${v > 0 ? '+' : ''}${eur(v)}`;
}

function Ligne({ k, label, unite, a, b, persoA, persoB, setA, setB }) {
  const cell = (val, perso, set, side) =>
    perso !== null ? (
      <input
        type="number"
        inputMode="decimal"
        step="0.01"
        min="0"
        className={`${inputCls} px-2 py-1.5 text-right text-sm tabular-nums`}
        value={perso}
        onChange={(e) => set(e.target.value)}
        data-testid={`${side}-${k}`}
      />
    ) : (
      <div className="self-center text-right tabular-nums text-stone-700 dark:text-stone-300">{val}</div>
    );
  return (
    <>
      <div className="self-center leading-tight">
        {label}
        <span className="block text-[10px] text-stone-400">{unite}</span>
      </div>
      {cell(a, persoA, setA, 'A')}
      {cell(b, persoB, setB, 'B')}
    </>
  );
}

function Recap({ cible }) {
  let hT = 0;
  let hC = 0;
  let km = 0;
  for (const e of cible) {
    const c = computeEntry(e);
    hT += c.hT;
    hC += c.hC;
    km += c.km;
  }
  return (
    <p className="text-xs text-stone-500">
      Quantités : {hm(hT)} de travail · {hm(hC)} de courses · {km1(km)}
    </p>
  );
}
