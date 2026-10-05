import { ChevronLeft, ChevronRight, Truck } from 'lucide-react';
import { MOIS, isoDate, sumEntries } from '../utils/calc';

const JOURS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export default function Calendar({ entries, viewMonth, setViewMonth, selectedDate, onSelect }) {
  const { year, month } = viewMonth;
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7; // lundi = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = isoDate(new Date());

  const byDate = {};
  for (const e of entries) (byDate[e.date] ||= []).push(e);

  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(isoDate(new Date(year, month, d)));

  const go = (delta) => {
    const m = month + delta;
    setViewMonth({ year: year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 });
  };

  const goToday = () => {
    const now = new Date();
    setViewMonth({ year: now.getFullYear(), month: now.getMonth() });
    onSelect(today);
  };

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-3 shadow-sm dark:border-stone-700 dark:bg-stone-800">
      <div className="mb-2 flex items-center justify-between">
        <button type="button" onClick={() => go(-1)} className="rounded-full p-2 hover:bg-stone-100 dark:hover:bg-stone-700" aria-label="Mois précédent">
          <ChevronLeft size={20} />
        </button>
        <button type="button" onClick={goToday} className="text-lg font-bold capitalize" title="Revenir à aujourd'hui" data-testid="titre-mois">
          {MOIS[month]} {year}
        </button>
        <button type="button" onClick={() => go(1)} className="rounded-full p-2 hover:bg-stone-100 dark:hover:bg-stone-700" aria-label="Mois suivant">
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-stone-400">
        {JOURS.map((j, i) => (
          <div key={i} className="py-1">
            {j}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <div key={`v${i}`} />;
          const list = byDate[date] || [];
          const has = list.length > 0;
          const total = has ? sumEntries(list).total : 0;
          const camion = list.some((e) => e.camion);
          const isSel = date === selectedDate;
          const isToday = date === today;
          return (
            <button
              key={date}
              type="button"
              data-date={date}
              onClick={() => onSelect(date)}
              className={`relative flex aspect-square flex-col items-center justify-start rounded-xl pt-1 text-sm transition ${
                isSel
                  ? 'bg-orange-600 text-white shadow'
                  : has
                    ? 'bg-orange-50 text-stone-900 hover:bg-orange-100 dark:bg-orange-950/40 dark:text-stone-100'
                    : 'hover:bg-stone-100 dark:hover:bg-stone-700'
              } ${isToday && !isSel ? 'ring-2 ring-orange-400' : ''}`}
            >
              <span className="font-semibold">{Number(date.slice(8))}</span>
              {has && (
                <span className={`mt-auto mb-1 text-[10px] font-semibold leading-none tabular-nums ${isSel ? 'text-orange-100' : 'text-orange-700 dark:text-orange-300'}`}>
                  {Math.round(total)}€
                </span>
              )}
              {camion && (
                <Truck size={10} className={`absolute right-1 top-1 ${isSel ? 'text-white' : 'text-orange-600'}`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
