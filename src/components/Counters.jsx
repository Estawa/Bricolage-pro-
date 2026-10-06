import { useEffect, useRef, useState } from 'react';
import { Hammer, ShoppingCart, Route, Euro } from 'lucide-react';
import { sumEntries, eur, hm, km1, MOIS, parseIso } from '../utils/calc';
import { Segmented } from './ui';

function Tile({ icon, label, value, accent, sub }) {
  // Petit effet visuel quand la valeur change
  const [flash, setFlash] = useState(false);
  const prev = useRef(value);
  useEffect(() => {
    if (prev.current !== value) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 600);
      prev.current = value;
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <div
      className={`rounded-2xl p-3 transition-all duration-500 ${accent} ${flash ? 'scale-[1.04] ring-2 ring-orange-400' : ''}`}
    >
      <div className="flex items-center gap-1.5 text-xs font-medium opacity-80">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-xl font-bold tabular-nums leading-tight" data-testid={`compteur-${label}`}>
        {value}
      </div>
      {sub && <div className="mt-0.5 text-[11px] opacity-80">{sub}</div>}
    </div>
  );
}

export default function Counters({ entries, selectedDate, viewMonth }) {
  const [scope, setScope] = useState('jour');

  const d = parseIso(selectedDate);
  const ym = `${viewMonth.year}-${String(viewMonth.month + 1).padStart(2, '0')}`;
  const filtered = entries.filter((e) => {
    if (scope === 'jour') return e.date === selectedDate;
    if (scope === 'mois') return e.date.startsWith(ym);
    return e.date.startsWith(String(viewMonth.year));
  });
  const s = sumEntries(filtered);

  const scopeLabel =
    scope === 'jour'
      ? d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
      : scope === 'mois'
        ? `${MOIS[viewMonth.month]} ${viewMonth.year}`
        : `année ${viewMonth.year}`;

  return (
    <div className="rounded-3xl bg-stone-900 p-3 text-white shadow-lg dark:bg-black/40">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex-1">
          <Segmented
            small
            value={scope}
            onChange={setScope}
            options={[
              { value: 'jour', label: 'Jour' },
              { value: 'mois', label: 'Mois' },
              { value: 'annee', label: 'Année' },
            ]}
          />
        </div>
      </div>
      <div className="mb-2 px-1 text-xs uppercase tracking-wide text-stone-400">
        Compteurs — {scopeLabel} · {s.nb} prestation{s.nb > 1 ? 's' : ''}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Tile icon={<Hammer size={14} />} label="Travail" value={hm(s.hT)} accent="bg-white/10" />
        <Tile icon={<ShoppingCart size={14} />} label="Courses" value={hm(s.hC)} accent="bg-white/10" />
        <Tile icon={<Route size={14} />} label="Kilomètres" value={km1(s.km)} sub={s.hTrajet ? `${hm(s.hTrajet)} de trajet` : null} accent="bg-white/10" />
        <Tile
          icon={<Euro size={14} />}
          label="Facturation"
          value={eur(s.total)}
          sub={s.offert > 0 ? `🎁 offert : ${eur(s.offert)}` : null}
          accent="bg-orange-600"
        />
      </div>
    </div>
  );
}
