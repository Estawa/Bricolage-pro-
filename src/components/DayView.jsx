import { Plus, Share2, FileText } from 'lucide-react';
import { sumEntries, eur, longDate } from '../utils/calc';
import { Button } from './ui';
import EntryCard from './EntryCard';

export default function DayView({ date, entries, settings, onAdd, onEdit, onDelete, onDuplicate, onRecalc, onShare, onFiche }) {
  const list = entries.filter((e) => e.date === date);
  const s = sumEntries(list);

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold capitalize" data-testid="jour-titre">
            {longDate(date)}
          </h2>
          <p className="text-sm text-stone-500">
            {list.length ? `${list.length} prestation${list.length > 1 ? 's' : ''} · ${eur(s.total)}` : 'Aucune prestation ce jour'}
          </p>
        </div>
        <Button onClick={onAdd} data-testid="ajouter">
          <Plus size={18} /> Ajouter
        </Button>
      </div>

      {list.length > 0 && (
        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1 py-2 text-sm" onClick={() => onShare(list)} data-testid="partager-jour">
            <Share2 size={16} /> Partager le jour
          </Button>
          <Button variant="ghost" className="flex-1 py-2 text-sm" onClick={() => onFiche(list)}>
            <FileText size={16} /> Fiche récap
          </Button>
        </div>
      )}

      {list.map((e) => (
        <EntryCard
          key={e.id}
          entry={e}
          settings={settings}
          onEdit={onEdit}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onRecalc={onRecalc}
        />
      ))}
    </div>
  );
}
