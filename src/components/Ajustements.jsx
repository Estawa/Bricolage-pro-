import { Plus, Minus, Trash2 } from 'lucide-react';
import { eur, uid } from '../utils/calc';
import { totauxAjustements } from '../utils/ajustements';
import { inputCls } from './ui';

// Éditeur de lignes libres « À ajouter » / « À déduire » (montant + observation)
// value = [{ id, type: 'ajout' | 'deduction', montant, libelle }]
export default function Ajustements({ value = [], onChange, titre = 'Ajouts / déductions', aide, testid = 'ajust', compact = false }) {
  const add = (type) =>
    onChange([...value, { id: uid(), type, montant: '', libelle: '', dateSaisie: new Date().toISOString().slice(0, 10) }]);
  const maj = (id, patch) => onChange(value.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  const del = (id) => onChange(value.filter((a) => a.id !== id));
  const t = totauxAjustements(value);

  return (
    <div className={`space-y-2 ${compact ? '' : 'rounded-2xl bg-stone-50 p-3 dark:bg-stone-900/60'}`} data-testid={testid}>
      <div>
        <h3 className="font-semibold">{titre}</h3>
        {aide && <p className="text-xs text-stone-500">{aide}</p>}
      </div>

      {value.map((a) => {
        const plus = a.type !== 'deduction';
        return (
          <div key={a.id} className="flex items-center gap-2" data-testid={`${testid}-ligne`}>
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white ${plus ? 'bg-orange-600' : 'bg-emerald-600'}`}
              title={plus ? 'À ajouter' : 'À déduire'}
            >
              {plus ? <Plus size={16} /> : <Minus size={16} />}
            </span>
            <input
              className={`${inputCls} min-w-0 flex-1 py-1.5 text-sm`}
              placeholder={plus ? 'Observation (ex. location bétonnière)' : 'Observation (ex. repas offert)'}
              value={a.libelle}
              onChange={(e) => maj(a.id, { libelle: e.target.value })}
              data-testid={`${testid}-libelle`}
            />
            <div className="relative w-24 shrink-0">
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                className={`${inputCls} py-1.5 pr-6 text-right text-sm`}
                placeholder="0"
                value={a.montant}
                onChange={(e) => maj(a.id, { montant: e.target.value })}
                data-testid={`${testid}-montant`}
              />
              <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-stone-400">€</span>
            </div>
            <button type="button" onClick={() => del(a.id)} className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40" aria-label="Supprimer la ligne">
              <Trash2 size={16} />
            </button>
          </div>
        );
      })}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => add('ajout')}
          className="flex items-center justify-center gap-1 rounded-xl border border-orange-300 bg-white px-3 py-2 text-sm font-semibold text-orange-700 dark:border-orange-800 dark:bg-stone-800 dark:text-orange-300"
          data-testid={`${testid}-ajouter`}
        >
          <Plus size={16} /> À ajouter
        </button>
        <button
          type="button"
          onClick={() => add('deduction')}
          className="flex items-center justify-center gap-1 rounded-xl border border-emerald-300 bg-white px-3 py-2 text-sm font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-stone-800 dark:text-emerald-300"
          data-testid={`${testid}-deduire`}
        >
          <Minus size={16} /> À déduire
        </button>
      </div>

      {(t.ajouts > 0 || t.deductions > 0) && (
        <p className="text-xs text-stone-600 dark:text-stone-300">
          {t.ajouts > 0 && <>+ {eur(t.ajouts)} </>}
          {t.deductions > 0 && <>− {eur(t.deductions)} </>}→ <b>{t.net >= 0 ? '+' : '−'} {eur(Math.abs(t.net))}</b> sur le coût total
        </p>
      )}
    </div>
  );
}
