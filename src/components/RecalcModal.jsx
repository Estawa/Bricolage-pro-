import { ArrowRight, Check } from 'lucide-react';
import { computeEntry, snapshotTarifs, eur, longDate } from '../utils/calc';
import { Modal, Button } from './ui';

const LIBELLES = {
  tauxTravail: ['Travail', '€/h'],
  tauxCourses: ['Courses', '€/h'],
  coutKm: ['Kilomètre', '€/km'],
  camionForfait: ['Forfait camion', '€'],
  camionKm: ['Supplément km camion', '€/km'],
  nettoyageForfait: ['Nettoyage camion', '€'],
  tauxTrajet: ['Temps de trajet', '€/h'],
};

const num = (v) => parseFloat(String(v ?? '').replace(',', '.')) || 0;

// Confirmation avant d'appliquer les tarifs actuels à une prestation déjà saisie
export default function RecalcModal({ entry, settings, onApply, onClose }) {
  const nouveaux = snapshotTarifs(settings);
  const anciens = entry.tarifs || {};
  const changes = Object.keys(LIBELLES).filter((k) => anciens[k] !== undefined && num(anciens[k]) !== num(nouveaux[k]));

  const avant = computeEntry(entry).total;
  const apres = computeEntry({ ...entry, tarifs: nouveaux }).total;
  const diff = apres - avant;

  if (changes.length === 0) {
    return (
      <Modal title="Tarifs à jour" onClose={onClose} footer={<Button className="w-full" onClick={onClose}>OK</Button>}>
        <p className="flex items-start gap-2 text-sm text-stone-600 dark:text-stone-300" data-testid="recalc-a-jour">
          <Check size={18} className="mt-0.5 shrink-0 text-emerald-600" />
          Cette prestation utilise déjà vos tarifs actuels. Rien à recalculer.
        </p>
      </Modal>
    );
  }

  return (
    <Modal
      title="Appliquer les nouveaux tarifs ?"
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={onClose}>
            Annuler
          </Button>
          <Button className="flex-1" onClick={() => onApply({ ...entry, tarifs: nouveaux })} data-testid="recalc-confirmer">
            Appliquer
          </Button>
        </div>
      }
    >
      <p className="mb-3 text-sm text-stone-500">
        <span className="font-medium text-stone-800 dark:text-stone-100">{entry.chantierNom}</span> —{' '}
        <span className="capitalize">{longDate(entry.date)}</span>
      </p>

      <h3 className="mb-1 text-sm font-semibold">Tarifs modifiés</h3>
      <div className="mb-4 divide-y divide-stone-100 rounded-xl border border-stone-200 text-sm dark:divide-stone-700 dark:border-stone-700">
        {changes.map((k) => (
          <div key={k} className="flex items-center justify-between gap-2 px-3 py-2">
            <span>{LIBELLES[k][0]}</span>
            <span className="flex items-center gap-1 tabular-nums">
              <span className="text-stone-400 line-through">{eur(anciens[k])}</span>
              <ArrowRight size={12} />
              <span className="font-semibold">{eur(nouveaux[k])}</span>
              <span className="text-xs text-stone-400">{LIBELLES[k][1].replace('€', '')}</span>
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-stone-100 p-2 dark:bg-stone-900">
          <div className="text-xs text-stone-500">Avant</div>
          <div className="font-bold tabular-nums">{eur(avant)}</div>
        </div>
        <div className="rounded-xl bg-orange-100 p-2 dark:bg-orange-950/50">
          <div className="text-xs text-stone-500">Après</div>
          <div className="font-bold tabular-nums text-orange-700 dark:text-orange-300" data-testid="recalc-apres">
            {eur(apres)}
          </div>
        </div>
        <div className="rounded-xl bg-stone-100 p-2 dark:bg-stone-900">
          <div className="text-xs text-stone-500">Écart</div>
          <div className={`font-bold tabular-nums ${diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-red-600' : ''}`}>
            {diff > 0 ? '+' : ''}
            {eur(diff)}
          </div>
        </div>
      </div>
    </Modal>
  );
}
