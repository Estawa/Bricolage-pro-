import { useState } from 'react';
import { Download } from 'lucide-react';
import { computeEntry, sumEntries, eur, hm, km1, MOIS } from '../utils/calc';
import { downloadFile } from '../utils/storage';
import { horairesTravail, horairesCourses } from '../utils/recap';
import { Card, Segmented, Button, inputCls } from './ui';

export default function Bilan({ entries, viewMonth, settings }) {
  const [mode, setMode] = useState('mois');
  const [year, setYear] = useState(viewMonth.year);
  const [month, setMonth] = useState(viewMonth.month);

  const prefix = mode === 'mois' ? `${year}-${String(month + 1).padStart(2, '0')}` : String(year);
  const list = entries.filter((e) => e.date.startsWith(prefix)).sort((a, b) => a.date.localeCompare(b.date));
  const s = sumEntries(list);

  // Regroupement par chantier
  const groups = {};
  for (const e of list) {
    const k = e.chantierId || `libre:${e.chantierNom}`;
    (groups[k] ||= { nom: e.chantierNom || 'Chantier', items: [] }).items.push(e);
  }
  const parChantier = Object.values(groups)
    .map((g) => ({ nom: g.nom, ...sumEntries(g.items) }))
    .sort((a, b) => b.total - a.total);

  const years = [...new Set([viewMonth.year, new Date().getFullYear(), ...entries.map((e) => +e.date.slice(0, 4))])].sort();
  const titre = mode === 'mois' ? `${MOIS[month]} ${year}` : `Année ${year}`;

  const exportCsv = () => {
    const num = (v) => String(Math.round(v * 100) / 100).replace('.', ',');
    const head = [
      'Date', 'Chantier', 'Départ', 'Retour', 'Heures travail', 'Horaires travail', 'Heures courses', 'Horaires courses', 'Heures trajet', 'Trajet facturé', 'Trajet offert €', 'Km',
      'Camion', 'Nettoyage', 'Travail €', 'Courses €', 'Trajet €', 'Déplacement €', 'Camion €',
      'Nettoyage €', 'Fournitures €', 'Total €', 'Tickets', 'Montant tickets €', 'Travaux réalisés',
    ];
    const rows = list.map((e) => {
      const c = computeEntry(e);
      return [
        e.date.split('-').reverse().join('/'),
        e.chantierNom,
        e.sansKm ? 'sans km' : settings.bases[e.depart]?.label,
        e.sansKm ? 'sans km' : settings.bases[e.retour]?.label,
        num(c.hT), horairesTravail(e), num(c.hC), horairesCourses(e), num(c.hTrajet), c.hTrajet ? (e.trajetMode === 'offert' ? 'non' : 'oui') : '', num(c.trajetOffert), num(c.km),
        e.camion ? 'oui' : 'non', e.nettoyage ? 'oui' : 'non',
        num(c.travail), num(c.courses), num(c.trajet), num(c.deplacement), num(c.camion),
        num(c.nettoyage), num(c.fournitures), num(c.total),
        (e.tickets || []).length, num((e.tickets || []).reduce((a, t) => a + (parseFloat(t.montant) || 0), 0)),
        (e.description || '').replace(/\s+/g, ' '),
      ];
    });
    const csv = [head, ...rows].map((r) => r.map((x) => `"${String(x ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');
    downloadFile(`bricolage-${prefix}.csv`, '﻿' + csv, 'text/csv;charset=utf-8');
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold">Bilan</h2>
      <Segmented value={mode} onChange={setMode} options={[{ value: 'mois', label: 'Par mois' }, { value: 'annee', label: 'Par année' }]} />
      <div className="flex gap-2">
        {mode === 'mois' && (
          <select className={inputCls} value={month} onChange={(e) => setMonth(+e.target.value)}>
            {MOIS.map((m, i) => (
              <option key={m} value={i}>
                {m}
              </option>
            ))}
          </select>
        )}
        <select className={inputCls} value={year} onChange={(e) => setYear(+e.target.value)}>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <Card>
        <div className="mb-2 flex items-baseline justify-between">
          <h3 className="font-semibold capitalize">{titre}</h3>
          <span className="text-sm text-stone-500">
            {s.nb} prestation{s.nb > 1 ? 's' : ''}
          </span>
        </div>
        <Line l={`Travail (${hm(s.hT)})`} v={s.travail} />
        <Line l={`Courses (${hm(s.hC)})`} v={s.courses} />
        {s.hTrajet > 0 && <Line l={`Temps de trajet facturé`} v={s.trajet} />}
        <Line l={`Déplacements (${km1(s.km)})`} v={s.deplacement} />
        <Line l="Camion" v={s.camion} />
        <Line l="Nettoyage camion" v={s.nettoyage} />
        <Line l="Fournitures" v={s.fournitures} />
        <div className="mt-2 flex justify-between border-t border-stone-200 pt-2 text-lg font-bold dark:border-stone-700">
          <span>Total</span>
          <span className="tabular-nums text-orange-700 dark:text-orange-400">{eur(s.total)}</span>
        </div>
        {s.trajetOffert > 0 && (
          <div className="mt-2 flex justify-between rounded-lg bg-emerald-50 px-2 py-1.5 text-sm font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            <span>🎁 Trajets offerts (non comptés)</span>
            <span className="tabular-nums">{eur(s.trajetOffert)}</span>
          </div>
        )}
      </Card>

      {parChantier.length > 0 && (
        <Card>
          <h3 className="mb-2 font-semibold">Par chantier</h3>
          <div className="divide-y divide-stone-100 dark:divide-stone-700">
            {parChantier.map((g) => (
              <div key={g.nom} className="flex items-center justify-between gap-2 py-2">
                <div className="min-w-0">
                  <div className="truncate font-medium">{g.nom}</div>
                  <div className="text-xs text-stone-500">
                    {hm(g.hT)} travail · {hm(g.hC)} courses · {km1(g.km)}
                  </div>
                </div>
                <div className="font-semibold tabular-nums">{eur(g.total)}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Button variant="ghost" className="w-full" onClick={exportCsv} disabled={!list.length}>
        <Download size={18} /> Exporter le détail (tableur CSV)
      </Button>
    </div>
  );
}

function Line({ l, v }) {
  return (
    <div className="flex justify-between py-1 text-sm">
      <span className="text-stone-600 dark:text-stone-300">{l}</span>
      <span className="tabular-nums">{eur(v)}</span>
    </div>
  );
}
