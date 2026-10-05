import { Timer, Clock } from 'lucide-react';
import { hm } from '../utils/calc';
import { dureeHoraires } from '../utils/temps';
import { Label, Segmented, DurationField, inputCls } from './ui';

// Saisie d'un temps : soit une durée, soit une heure de début + une heure de fin (+ pause éventuelle)
// value = { mode, debut, fin, pause, heures }
export default function TempsField({ label, idPrefix, value, onChange, avecPause = false }) {
  const { mode = 'duree', debut = '', fin = '', pause = '', heures = 0 } = value;

  const setMode = (m) => {
    try {
      localStorage.setItem(`bricolage-pro:modeTemps:${idPrefix}`, m);
    } catch {
      /* ignore */
    }
    if (m === 'horaires') onChange({ mode: m, heures: dureeHoraires(debut, fin, pause) ?? 0 });
    else onChange({ mode: m });
  };

  const setHoraires = (patch) => {
    const d = patch.debut ?? debut;
    const f = patch.fin ?? fin;
    const p = patch.pause ?? pause;
    onChange({ ...patch, heures: dureeHoraires(d, f, p) ?? 0 });
  };

  const calcule = dureeHoraires(debut, fin, pause);
  const nuit = debut && fin && fin <= debut;

  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-2">
        <Label>{label}</Label>
        <div className="w-48 shrink-0">
          <Segmented
            small
            value={mode}
            onChange={setMode}
            options={[
              { value: 'duree', label: 'Durée', icon: <Timer size={13} /> },
              { value: 'horaires', label: 'Horaires', icon: <Clock size={13} /> },
            ]}
          />
        </div>
      </div>

      {mode === 'duree' ? (
        <DurationField idPrefix={idPrefix} value={heures} onChange={(v) => onChange({ heures: v })} />
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-1 block text-xs text-stone-500">Début</span>
              <input id={`${idPrefix}-debut`} type="time" className={inputCls} value={debut} onChange={(e) => setHoraires({ debut: e.target.value })} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-stone-500">Fin</span>
              <input id={`${idPrefix}-fin`} type="time" className={inputCls} value={fin} onChange={(e) => setHoraires({ fin: e.target.value })} />
            </label>
          </div>
          {avecPause && (
            <label className="flex items-center gap-2 text-sm">
              <span className="text-stone-500">Pause à déduire</span>
              <select id={`${idPrefix}-pause`} className={`${inputCls} w-auto flex-1 py-1.5 text-sm`} value={pause || '0'} onChange={(e) => setHoraires({ pause: e.target.value })}>
                {[0, 15, 30, 45, 60, 75, 90, 120].map((m) => (
                  <option key={m} value={m}>
                    {m === 0 ? 'aucune' : hm(m / 60)}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="rounded-xl bg-orange-50 px-3 py-2 text-sm dark:bg-orange-950/40" data-testid={`${idPrefix}-duree-calculee`}>
            {calcule != null ? (
              <>
                Durée calculée : <b className="tabular-nums">{hm(calcule)}</b>
                {nuit && <span className="ml-1 text-xs text-stone-500">(fin le lendemain)</span>}
              </>
            ) : (
              <span className="text-stone-500">Indiquez l’heure de début et l’heure de fin</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function modeParDefaut(idPrefix) {
  try {
    return localStorage.getItem(`bricolage-pro:modeTemps:${idPrefix}`) || 'duree';
  } catch {
    return 'duree';
  }
}
