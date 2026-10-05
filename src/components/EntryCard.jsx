import { Pencil, Trash2, Copy, Truck, Sparkles, ArrowRight, RefreshCw, Receipt } from 'lucide-react';
import { computeEntry, snapshotTarifs, eur, hm, km1, shortDate, totalTickets } from '../utils/calc';
import { TicketStrip } from './Tickets';

const num = (v) => parseFloat(String(v ?? '').replace(',', '.')) || 0;

export function anciensTarifs(e, settings) {
  const actuels = snapshotTarifs(settings);
  return Object.keys(actuels).some((k) => num(e.tarifs?.[k]) !== num(actuels[k]));
}

// Carte d'une prestation (utilisée dans la vue du jour et dans la fiche chantier)
export default function EntryCard({ entry: e, settings, showDate, showChantier = true, selectable, selected, onToggle, onEdit, onDelete, onDuplicate, onRecalc }) {
  const c = computeEntry(e);
  const base = (b) => settings.bases[b]?.label || b;
  const tk = totalTickets(e);

  return (
    <div
      className={`rounded-2xl border bg-white p-3 shadow-sm transition dark:bg-stone-800 ${
        selected ? 'border-orange-500 ring-2 ring-orange-200 dark:ring-orange-900' : 'border-stone-200 dark:border-stone-700'
      }`}
      data-testid="prestation"
    >
      <div className="flex items-start gap-2">
        {selectable && (
          <input
            type="checkbox"
            checked={!!selected}
            onChange={onToggle}
            className="mt-1 h-5 w-5 shrink-0 accent-orange-600"
            aria-label="Sélectionner"
            data-testid="selection"
          />
        )}
        <div className="min-w-0 flex-1">
          {showDate && <div className="text-xs font-semibold uppercase tracking-wide text-orange-700 dark:text-orange-400">{shortDate(e.date)}</div>}
          {showChantier && <div className="truncate font-semibold">{e.chantierNom || 'Chantier'}</div>}
          <div className="flex items-center gap-1 text-xs text-stone-500">
            {e.sansKm ? (
              'Sans kilométrage'
            ) : (
              <>
                {base(e.depart)} <ArrowRight size={11} /> chantier <ArrowRight size={11} /> {base(e.retour)}
              </>
            )}
          </div>
        </div>
        <div className="text-right text-lg font-bold tabular-nums text-orange-700 dark:text-orange-400">{eur(c.total)}</div>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
        {c.hT > 0 && <Chip>🔨 {hm(c.hT)}</Chip>}
        {c.hC > 0 && <Chip>🛒 {hm(c.hC)}</Chip>}
        <Chip>🚗 {e.sansKm ? '0 km' : km1(c.km)}</Chip>
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
        {e.tickets?.length > 0 && (
          <Chip>
            <Receipt size={12} /> {e.tickets.length}
            {tk > 0 && ` · ${eur(tk)}`}
          </Chip>
        )}
        {anciensTarifs(e, settings) && <Chip warn>Anciens tarifs</Chip>}
      </div>

      {e.description && <p className="mt-2 whitespace-pre-line text-sm text-stone-600 dark:text-stone-300">{e.description}</p>}
      <TicketStrip tickets={e.tickets} />

      <div className="mt-1 flex justify-end gap-1">
        <IconBtn onClick={() => onRecalc(e)} label="Recalculer avec les tarifs actuels" testid="recalc">
          <RefreshCw size={16} />
        </IconBtn>
        {onDuplicate && (
          <IconBtn onClick={() => onDuplicate(e)} label="Dupliquer sur un autre jour">
            <Copy size={16} />
          </IconBtn>
        )}
        <IconBtn onClick={() => onEdit(e)} label="Modifier" testid="modifier">
          <Pencil size={16} />
        </IconBtn>
        <IconBtn
          onClick={() => {
            if (confirm('Supprimer cette prestation (et ses photos de tickets) ?')) onDelete(e);
          }}
          label="Supprimer"
          danger
        >
          <Trash2 size={16} />
        </IconBtn>
      </div>
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
