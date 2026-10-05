import { Plus, Pencil, Trash2, Copy, Truck, Sparkles, ArrowRight, RefreshCw } from 'lucide-react';
import { computeEntry, sumEntries, snapshotTarifs, eur, hm, km1, longDate } from '../utils/calc';
import { Button } from './ui';

export default function DayView({ date, entries, settings, onAdd, onEdit, onDelete, onDuplicate, onRecalc }) {
  const actuels = snapshotTarifs(settings);
  const num = (v) => parseFloat(String(v ?? '').replace(',', '.')) || 0;
  const anciensTarifs = (e) => Object.keys(actuels).some((k) => num(e.tarifs?.[k]) !== num(actuels[k]));
  const list = entries.filter((e) => e.date === date);
  const s = sumEntries(list);
  const base = (b) => settings.bases[b]?.label || b;

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold capitalize" data-testid="jour-titre">{longDate(date)}</h2>
          <p className="text-sm text-stone-500">
            {list.length ? `${list.length} prestation${list.length > 1 ? 's' : ''} · ${eur(s.total)}` : 'Aucune prestation ce jour'}
          </p>
        </div>
        <Button onClick={onAdd} data-testid="ajouter">
          <Plus size={18} /> Ajouter
        </Button>
      </div>

      {list.map((e) => {
        const c = computeEntry(e);
        return (
          <div key={e.id} className="rounded-2xl border border-stone-200 bg-white p-3 shadow-sm dark:border-stone-700 dark:bg-stone-800" data-testid="prestation">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate font-semibold">{e.chantierNom || 'Chantier'}</div>
                <div className="flex items-center gap-1 text-xs text-stone-500">
                  {base(e.depart)} <ArrowRight size={11} /> chantier <ArrowRight size={11} /> {base(e.retour)}
                </div>
              </div>
              <div className="text-right text-lg font-bold tabular-nums text-orange-700 dark:text-orange-400">{eur(c.total)}</div>
            </div>

            <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
              <Chip>🔨 {hm(c.hT)}</Chip>
              {c.hC > 0 && <Chip>🛒 {hm(c.hC)}</Chip>}
              <Chip>🚗 {km1(c.km)}</Chip>
              {e.camion && (
                <Chip>
                  <Truck size={12} /> Camion
                </Chip>
              )}
              {e.nettoyage && (
                <Chip>
                  <Sparkles size={12} /> Nettoyage
                </Chip>
              )}
              {c.fournitures > 0 && <Chip>📦 {eur(c.fournitures)}</Chip>}
              {anciensTarifs(e) && <Chip warn>Anciens tarifs</Chip>}
            </div>

            {e.description && <p className="mt-2 whitespace-pre-line text-sm text-stone-600 dark:text-stone-300">{e.description}</p>}

            <div className="mt-2 flex justify-end gap-1">
              <IconBtn onClick={() => onRecalc(e)} label="Recalculer avec les tarifs actuels" testid="recalc">
                <RefreshCw size={16} />
              </IconBtn>
              <IconBtn onClick={() => onDuplicate(e)} label="Dupliquer sur un autre jour">
                <Copy size={16} />
              </IconBtn>
              <IconBtn onClick={() => onEdit(e)} label="Modifier">
                <Pencil size={16} />
              </IconBtn>
              <IconBtn
                onClick={() => {
                  if (confirm('Supprimer cette prestation ?')) onDelete(e.id);
                }}
                label="Supprimer"
                danger
              >
                <Trash2 size={16} />
              </IconBtn>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Chip({ children, warn }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${
        warn
          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200'
          : 'bg-stone-100 text-stone-700 dark:bg-stone-700 dark:text-stone-200'
      }`}
    >
      {children}
    </span>
  );
}

function IconBtn({ children, onClick, label, danger, testid }) {
  return (
    <button
      type="button"
      data-testid={testid}
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`rounded-lg p-2 ${danger ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40' : 'text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-700'}`}
    >
      {children}
    </button>
  );
}
