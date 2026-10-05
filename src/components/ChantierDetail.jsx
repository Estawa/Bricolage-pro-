import { useMemo, useState } from 'react';
import { ArrowLeft, MapPin, Plus, Share2, FileText, CheckSquare, Square } from 'lucide-react';
import { sumEntries, eur, hm, km1, MOIS, parseIso } from '../utils/calc';
import { sortByDate } from '../utils/recap';
import { Card, Button } from './ui';
import EntryCard from './EntryCard';

// Toutes les prestations d'un chantier, modifiables, avec sélection pour partage / fiche
export default function ChantierDetail({ chantier, entries, settings, onBack, onAdd, onEdit, onDelete, onDuplicate, onRecalc, onShare, onFiche }) {
  const list = useMemo(() => sortByDate(entries.filter((e) => e.chantierId === chantier.id)), [entries, chantier.id]);
  const [sel, setSel] = useState(() => new Set());
  const s = sumEntries(list);
  const nbTickets = list.reduce((a, e) => a + (e.tickets?.length || 0), 0);

  const selection = list.filter((e) => sel.has(e.id));
  const cible = selection.length ? selection : list;
  const libelleCible = selection.length ? `${selection.length} sélectionnée${selection.length > 1 ? 's' : ''}` : 'tout le chantier';

  const toggle = (id) =>
    setSel((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  // Regroupement par mois
  const groupes = [];
  for (const e of list) {
    const d = parseIso(e.date);
    const key = `${MOIS[d.getMonth()]} ${d.getFullYear()}`;
    if (!groupes.length || groupes[groupes.length - 1].key !== key) groupes.push({ key, items: [] });
    groupes[groupes.length - 1].items.push(e);
  }

  return (
    <div className="space-y-3 pb-32">
      <button type="button" onClick={onBack} className="flex items-center gap-1 text-sm font-medium text-orange-700 dark:text-orange-400" data-testid="retour-chantiers">
        <ArrowLeft size={16} /> Tous les chantiers
      </button>

      <div>
        <h2 className="text-xl font-bold" data-testid="chantier-titre">
          {chantier.nom}
        </h2>
        {chantier.adresse && (
          <p className="flex items-center gap-1 text-sm text-stone-500">
            <MapPin size={14} /> {chantier.adresse}
          </p>
        )}
        {chantier.note && <p className="mt-1 text-sm text-stone-500">{chantier.note}</p>}
      </div>

      <Card className="grid grid-cols-2 gap-3 text-sm">
        <Stat l="Prestations" v={s.nb} />
        <Stat l="Coût total" v={eur(s.total)} strong />
        <Stat l="Travail" v={hm(s.hT)} />
        <Stat l="Courses" v={hm(s.hC)} />
        <Stat l="Kilomètres" v={km1(s.km)} />
        <Stat l="Tickets" v={nbTickets} />
      </Card>

      <Button className="w-full" onClick={onAdd} data-testid="ajouter-chantier">
        <Plus size={18} /> Ajouter une prestation sur ce chantier
      </Button>

      {list.length > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-stone-500">Sélection pour partager / fiche :</span>
          <button
            type="button"
            className="flex items-center gap-1 font-medium text-orange-700 dark:text-orange-400"
            onClick={() => setSel(sel.size === list.length ? new Set() : new Set(list.map((e) => e.id)))}
            data-testid="tout-selectionner"
          >
            {sel.size === list.length ? <CheckSquare size={16} /> : <Square size={16} />}
            {sel.size === list.length ? 'Tout désélectionner' : 'Tout sélectionner'}
          </button>
        </div>
      )}

      {list.length === 0 && <p className="py-6 text-center text-sm text-stone-500">Aucune prestation enregistrée sur ce chantier.</p>}

      {groupes.map((g) => (
        <div key={g.key} className="space-y-2">
          <h3 className="pt-2 text-sm font-bold uppercase tracking-wide text-stone-400">{g.key}</h3>
          {g.items.map((e) => (
            <EntryCard
              key={e.id}
              entry={e}
              settings={settings}
              showDate
              showChantier={false}
              selectable
              selected={sel.has(e.id)}
              onToggle={() => toggle(e.id)}
              onEdit={onEdit}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onRecalc={onRecalc}
            />
          ))}
        </div>
      ))}

      {list.length > 0 && (
        <div className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-30 px-4">
          <div className="mx-auto flex max-w-lg gap-2 rounded-2xl bg-stone-900 p-2 shadow-xl dark:bg-black">
            <Button variant="ghost" className="flex-1 py-2 text-sm" onClick={() => onFiche(cible)} data-testid="fiche-chantier">
              <FileText size={16} /> Fiche
            </Button>
            <Button className="flex-[2] py-2 text-sm" onClick={() => onShare(cible)} data-testid="partager-chantier">
              <Share2 size={16} /> Partager ({libelleCible})
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ l, v, strong }) {
  return (
    <div>
      <div className="text-xs text-stone-500">{l}</div>
      <div className={`tabular-nums ${strong ? 'text-lg font-bold text-orange-700 dark:text-orange-400' : 'font-semibold'}`}>{v}</div>
    </div>
  );
}
