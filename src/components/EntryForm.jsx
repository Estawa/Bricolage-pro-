import { useMemo, useState } from 'react';
import { Home, School, Truck, Sparkles, RefreshCw, ArrowRight } from 'lucide-react';
import { computeEntry, snapshotTarifs, eur, hm, km1, longDate, uid } from '../utils/calc';
import RecalcModal from './RecalcModal';
import { Modal, Label, NumberField, Segmented, Toggle, DurationField, Button, inputCls } from './ui';

const LIBRE = '__libre__';

function kmFor(chantier, base) {
  if (!chantier) return '';
  const v = base === 'maison' ? chantier.kmMaison : chantier.kmTravail;
  return v ?? '';
}

export default function EntryForm({ date, entry, chantiers, settings, onSave, onClose }) {
  const isNew = !entry;
  const [recalc, setRecalc] = useState(false);
  const [f, setF] = useState(() => {
    if (entry) return { ...entry, chantierSel: entry.chantierId || LIBRE };
    const ch = chantiers[0];
    return {
      id: uid(),
      date,
      chantierSel: ch ? ch.id : LIBRE,
      chantierNom: '',
      depart: 'maison',
      retour: 'maison',
      kmAller: kmFor(ch, 'maison'),
      kmRetour: kmFor(ch, 'maison'),
      heuresTravail: 0,
      heuresCourses: 0,
      kmCourses: '',
      camion: false,
      nettoyage: false,
      fournitures: '',
      description: '',
      tarifs: snapshotTarifs(settings),
    };
  });

  const set = (patch) => setF((p) => ({ ...p, ...patch }));
  const chantier = chantiers.find((c) => c.id === f.chantierSel);

  const selectChantier = (id) => {
    const ch = chantiers.find((c) => c.id === id);
    set({
      chantierSel: id,
      kmAller: ch ? kmFor(ch, f.depart) : f.kmAller,
      kmRetour: ch ? kmFor(ch, f.retour) : f.kmRetour,
    });
  };
  const setDepart = (b) => set({ depart: b, kmAller: chantier ? kmFor(chantier, b) : f.kmAller });
  const setRetour = (b) => set({ retour: b, kmRetour: chantier ? kmFor(chantier, b) : f.kmRetour });

  const calc = useMemo(() => computeEntry(f), [f]);
  const current = snapshotTarifs(settings);
  const tarifsDifferents = JSON.stringify(current) !== JSON.stringify(f.tarifs);

  const nomAffiche = chantier ? chantier.nom : f.chantierNom || 'Chantier';
  const valid = f.chantierSel !== LIBRE || f.chantierNom.trim() !== '';

  const submit = () => {
    const { chantierSel, ...rest } = f;
    onSave({
      ...rest,
      chantierId: chantierSel === LIBRE ? null : chantierSel,
      chantierNom: chantierSel === LIBRE ? f.chantierNom.trim() : chantier.nom,
      nettoyage: f.camion && f.nettoyage,
    });
  };

  const baseOptions = [
    { value: 'maison', label: settings.bases.maison.label, icon: <Home size={15} /> },
    { value: 'travail', label: settings.bases.travail.label, icon: <School size={15} /> },
  ];

  return (
    <Modal
      title={isNew ? 'Nouvelle prestation' : 'Modifier la prestation'}
      onClose={onClose}
      footer={
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="text-xs text-stone-500">Montant de la prestation</div>
            <div className="text-2xl font-bold tabular-nums text-orange-700 dark:text-orange-400" data-testid="apercu-total">
              {eur(calc.total)}
            </div>
          </div>
          <Button onClick={submit} disabled={!valid} data-testid="enregistrer">
            Enregistrer
          </Button>
        </div>
      }
    >
      <p className="mb-4 text-sm capitalize text-stone-500">{longDate(f.date)}</p>

      <div className="space-y-5">
        {/* Chantier */}
        <section className="space-y-2">
          <label className="block">
            <Label>Chantier / client</Label>
            <select
              id="chantier"
              className={inputCls}
              value={f.chantierSel}
              onChange={(e) => selectChantier(e.target.value)}
            >
              {chantiers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
              <option value={LIBRE}>Autre (saisie libre)…</option>
            </select>
          </label>
          {f.chantierSel === LIBRE && (
            <input
              id="chantier-libre"
              className={inputCls}
              placeholder="Nom du client ou du chantier"
              value={f.chantierNom}
              onChange={(e) => set({ chantierNom: e.target.value })}
            />
          )}
          {chantiers.length === 0 && (
            <p className="text-xs text-stone-500">
              Astuce : enregistrez vos clients dans l’onglet « Chantiers » pour que les kilomètres se remplissent tout seuls.
            </p>
          )}
        </section>

        {/* Trajets */}
        <section className="space-y-3 rounded-2xl bg-stone-50 p-3 dark:bg-stone-900/60">
          <h3 className="font-semibold">Trajets</h3>
          <div>
            <Label>Je pars de…</Label>
            <Segmented options={baseOptions} value={f.depart} onChange={setDepart} />
          </div>
          <div>
            <Label>Après le chantier, je rentre à…</Label>
            <Segmented options={baseOptions} value={f.retour} onChange={setRetour} />
          </div>
          <div className="flex items-center gap-1 text-xs text-stone-500">
            {settings.bases[f.depart].label} <ArrowRight size={12} /> {nomAffiche} <ArrowRight size={12} />{' '}
            {settings.bases[f.retour].label}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <NumberField id="km-aller" label="Km aller" value={f.kmAller} onChange={(v) => set({ kmAller: v })} suffix="km" step="0.1" />
            <NumberField id="km-retour" label="Km retour" value={f.kmRetour} onChange={(v) => set({ kmRetour: v })} suffix="km" step="0.1" />
          </div>
        </section>

        {/* Temps */}
        <section className="space-y-3">
          <DurationField idPrefix="travail" label="Temps de travail" value={f.heuresTravail} onChange={(v) => set({ heuresTravail: v })} />
          <DurationField idPrefix="courses" label="Temps de courses (magasin, achats)" value={f.heuresCourses} onChange={(v) => set({ heuresCourses: v })} />
          <NumberField
            id="km-courses"
            label="Km supplémentaires pour les courses"
            hint="(détour magasin)"
            value={f.kmCourses}
            onChange={(v) => set({ kmCourses: v })}
            suffix="km"
            step="0.1"
          />
        </section>

        {/* Camion */}
        <section className="space-y-2">
          <Toggle
            icon={<Truck size={20} />}
            checked={f.camion}
            onChange={(v) => set({ camion: v, nettoyage: v ? f.nettoyage : false })}
            label="Utilisation du camion"
            sub={`${eur(f.tarifs.camionForfait)} + ${eur(f.tarifs.camionKm)}/km`}
          />
          {f.camion && (
            <Toggle
              icon={<Sparkles size={20} />}
              checked={f.nettoyage}
              onChange={(v) => set({ nettoyage: v })}
              label="Nettoyage complet du camion"
              sub={`Gravats, gros outillage… ${eur(f.tarifs.nettoyageForfait)}`}
            />
          )}
        </section>

        {/* Divers */}
        <section className="space-y-3">
          <NumberField id="fournitures" label="Fournitures refacturées" hint="(optionnel)" value={f.fournitures} onChange={(v) => set({ fournitures: v })} suffix="€" />
          <label className="block">
            <Label>Travaux réalisés</Label>
            <textarea
              id="description"
              rows={3}
              className={inputCls}
              placeholder="Ex. : pose de 3 étagères, remplacement du mitigeur…"
              value={f.description}
              onChange={(e) => set({ description: e.target.value })}
            />
          </label>
        </section>

        {/* Détail du calcul */}
        <section className="rounded-2xl border border-orange-200 bg-orange-50/60 p-3 text-sm dark:border-orange-900 dark:bg-orange-950/30">
          <h3 className="mb-2 font-semibold">Détail du calcul</h3>
          <Row l={`Travail ${hm(calc.hT)} × ${eur(f.tarifs.tauxTravail)}/h`} v={calc.travail} />
          <Row l={`Courses ${hm(calc.hC)} × ${eur(f.tarifs.tauxCourses)}/h`} v={calc.courses} />
          <Row l={`Déplacement ${km1(calc.km)} × ${eur(f.tarifs.coutKm)}/km`} v={calc.deplacement} />
          {f.camion && <Row l="Camion (forfait + km)" v={calc.camion} />}
          {calc.nettoyage > 0 && <Row l="Nettoyage camion" v={calc.nettoyage} />}
          {calc.fournitures > 0 && <Row l="Fournitures" v={calc.fournitures} />}
          <div className="mt-2 flex justify-between border-t border-orange-200 pt-2 font-bold dark:border-orange-900">
            <span>Total</span>
            <span className="tabular-nums">{eur(calc.total)}</span>
          </div>
          {!isNew && tarifsDifferents && (
            <button
              type="button"
              onClick={() => setRecalc(true)}
              className="mt-3 flex items-center gap-1 text-xs font-semibold text-orange-700 underline dark:text-orange-300"
            >
              <RefreshCw size={12} /> Recalculer avec mes tarifs actuels
            </button>
          )}
        </section>
      </div>
      {recalc && (
        <RecalcModal
          entry={f}
          settings={settings}
          onApply={(e) => {
            set({ tarifs: e.tarifs });
            setRecalc(false);
          }}
          onClose={() => setRecalc(false)}
        />
      )}
    </Modal>
  );
}

function Row({ l, v }) {
  return (
    <div className="flex justify-between gap-2 py-0.5 text-stone-700 dark:text-stone-300">
      <span>{l}</span>
      <span className="tabular-nums">{eur(v)}</span>
    </div>
  );
}
