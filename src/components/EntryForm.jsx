import { useMemo, useRef, useState } from 'react';
import { Home, School, Truck, Sparkles, RefreshCw, ArrowRight, MapPinOff, Camera, Trash2, Loader2 } from 'lucide-react';
import { computeEntry, snapshotTarifs, eur, hm, km1, uid, totalTickets } from '../utils/calc';
import { compressImage, photoCache, usePhotoApi } from '../utils/photos';
import RecalcModal from './RecalcModal';
import { TicketThumb, PhotoViewer } from './Tickets';
import { Modal, Label, NumberField, Segmented, Toggle, Button, inputCls } from './ui';
import TempsField, { modeParDefaut } from './TempsField';

const LIBRE = '__libre__';

function kmFor(chantier, base) {
  if (!chantier) return '';
  const v = base === 'maison' ? chantier.kmMaison : chantier.kmTravail;
  return v ?? '';
}

export default function EntryForm({ date, entry, initialChantierId, chantiers, settings, onSave, onClose }) {
  const isNew = !entry;
  const photos = usePhotoApi();
  const [recalc, setRecalc] = useState(false);
  const [vue, setVue] = useState(null);
  const [busy, setBusy] = useState(false);
  const [erreurPhoto, setErreurPhoto] = useState('');
  const ajoutees = useRef(new Set()); // photos ajoutées pendant cette saisie
  const retirees = useRef(new Set()); // photos existantes retirées (supprimées à l'enregistrement)
  const fileRef = useRef(null);

  const [f, setF] = useState(() => {
    if (entry) {
      const existe = chantiers.some((c) => c.id === entry.chantierId);
      return { tickets: [], sansKm: false, ...entry, chantierSel: existe ? entry.chantierId : LIBRE };
    }
    const ch = chantiers.find((c) => c.id === initialChantierId) || chantiers[0];
    return {
      id: uid(),
      date,
      chantierSel: ch ? ch.id : LIBRE,
      chantierNom: '',
      depart: 'maison',
      retour: 'maison',
      kmAller: kmFor(ch, 'maison'),
      kmRetour: kmFor(ch, 'maison'),
      sansKm: false,
      heuresTravail: 0,
      travailMode: modeParDefaut('travail'),
      travailDebut: '',
      travailFin: '',
      travailPause: '0',
      heuresCourses: 0,
      coursesMode: modeParDefaut('courses'),
      coursesDebut: '',
      coursesFin: '',
      coursesPause: '0',
      kmCourses: '',
      camion: false,
      nettoyage: false,
      fournitures: '',
      description: '',
      tickets: [],
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
  const totalTk = totalTickets(f);

  const nomAffiche = chantier ? chantier.nom : f.chantierNom || 'Chantier';
  const valid = (f.chantierSel !== LIBRE || f.chantierNom.trim() !== '') && !!f.date && !busy;

  // ---- Tickets de caisse ----
  const ajouterPhotos = async (files) => {
    setBusy(true);
    setErreurPhoto('');
    try {
      for (const file of files) {
        const data = await compressImage(file);
        const id = uid();
        await photos.set(id, data);
        photoCache.set(id, data);
        ajoutees.current.add(id);
        setF((p) => ({ ...p, tickets: [...(p.tickets || []), { id, montant: '', libelle: '' }] }));
      }
    } catch (e) {
      setErreurPhoto(`Photo non ajoutée : ${e.message}`);
    } finally {
      setBusy(false);
    }
  };
  const majTicket = (id, patch) => setF((p) => ({ ...p, tickets: p.tickets.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
  const retirerTicket = (id) => {
    if (!confirm('Retirer ce ticket ?')) return;
    if (ajoutees.current.has(id)) {
      ajoutees.current.delete(id);
      photos.del(id);
    } else retirees.current.add(id);
    setF((p) => ({ ...p, tickets: p.tickets.filter((t) => t.id !== id) }));
  };

  const annuler = () => {
    ajoutees.current.forEach((id) => photos.del(id)); // photos jamais enregistrées
    onClose();
  };

  const submit = () => {
    retirees.current.forEach((id) => photos.del(id));
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
      onClose={annuler}
      footer={
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="text-xs text-stone-500">Coût de la prestation</div>
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
      <div className="space-y-5">
        {/* Date + chantier */}
        <section className="space-y-2">
          <label className="block">
            <Label>Date</Label>
            <input id="date" type="date" className={inputCls} value={f.date} onChange={(e) => set({ date: e.target.value })} />
          </label>
          <label className="block">
            <Label>Chantier / client</Label>
            <select id="chantier" className={inputCls} value={f.chantierSel} onChange={(e) => selectChantier(e.target.value)}>
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
          <Toggle
            icon={<MapPinOff size={20} />}
            checked={f.sansKm}
            onChange={(v) => set({ sansKm: v })}
            label="Aucun kilométrage"
            sub="Ex. : courses faites sur mon trajet habituel, sans détour"
          />
          {!f.sansKm && (
            <>
              <div>
                <Label>Je pars de…</Label>
                <Segmented options={baseOptions} value={f.depart} onChange={setDepart} />
              </div>
              <div>
                <Label>Après le chantier, je rentre à…</Label>
                <Segmented options={baseOptions} value={f.retour} onChange={setRetour} />
              </div>
              <div className="flex items-center gap-1 text-xs text-stone-500">
                {settings.bases[f.depart].label} <ArrowRight size={12} /> {nomAffiche} <ArrowRight size={12} /> {settings.bases[f.retour].label}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <NumberField id="km-aller" label="Km aller" value={f.kmAller} onChange={(v) => set({ kmAller: v })} suffix="km" step="0.1" />
                <NumberField id="km-retour" label="Km retour" value={f.kmRetour} onChange={(v) => set({ kmRetour: v })} suffix="km" step="0.1" />
              </div>
              <NumberField
                id="km-courses"
                label="Km supplémentaires pour les courses"
                hint="(détour magasin)"
                value={f.kmCourses}
                onChange={(v) => set({ kmCourses: v })}
                suffix="km"
                step="0.1"
              />
            </>
          )}
        </section>

        {/* Temps */}
        <section className="space-y-3">
          <TempsField
            idPrefix="travail"
            label="Temps de travail"
            avecPause
            value={{ mode: f.travailMode, debut: f.travailDebut, fin: f.travailFin, pause: f.travailPause, heures: f.heuresTravail }}
            onChange={(p) => set(mapTemps('travail', p))}
          />
          <TempsField
            idPrefix="courses"
            label="Temps de courses (magasin, achats)"
            value={{ mode: f.coursesMode, debut: f.coursesDebut, fin: f.coursesFin, pause: f.coursesPause, heures: f.heuresCourses }}
            onChange={(p) => set(mapTemps('courses', p))}
          />
        </section>

        {/* Tickets de caisse */}
        <section className="space-y-3 rounded-2xl bg-stone-50 p-3 dark:bg-stone-900/60">
          <h3 className="font-semibold">Tickets de caisse</h3>
          {f.tickets.map((t) => (
            <div key={t.id} className="flex items-start gap-3" data-testid="ticket">
              <TicketThumb id={t.id} onClick={() => setVue(t)} />
              <div className="min-w-0 flex-1 space-y-2">
                <input
                  className={`${inputCls} py-1.5 text-sm`}
                  placeholder="Magasin / contenu (ex. Leroy Merlin – joints)"
                  value={t.libelle}
                  onChange={(e) => majTicket(t.id, { libelle: e.target.value })}
                />
                <div className="relative">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    className={`${inputCls} py-1.5 pr-8 text-sm`}
                    placeholder="Montant"
                    value={t.montant}
                    onChange={(e) => majTicket(t.id, { montant: e.target.value })}
                    data-testid="ticket-montant"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-stone-400">€</span>
                </div>
              </div>
              <button type="button" onClick={() => retirerTicket(t.id)} className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40" aria-label="Retirer le ticket">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <Button variant="ghost" className="w-full" onClick={() => fileRef.current?.click()} disabled={busy}>
            {busy ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />} Ajouter un ticket (photo)
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            data-testid="ticket-input"
            onChange={(e) => {
              const files = [...(e.target.files || [])];
              e.target.value = '';
              if (files.length) ajouterPhotos(files);
            }}
          />
          {erreurPhoto && <p className="text-xs text-red-600">{erreurPhoto}</p>}
          {totalTk > 0 && (
            <div className="flex items-center justify-between gap-2 text-sm">
              <span>
                Total des tickets : <b className="tabular-nums">{eur(totalTk)}</b>
              </span>
              <button type="button" className="text-xs font-semibold text-orange-700 underline dark:text-orange-300" onClick={() => set({ fournitures: String(Math.round(totalTk * 100) / 100) })}>
                Reporter en fournitures
              </button>
            </div>
          )}
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
          <Row l={f.sansKm ? 'Déplacement (sans kilométrage)' : `Déplacement ${km1(calc.km)} × ${eur(f.tarifs.coutKm)}/km`} v={calc.deplacement} />
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
      {vue && <PhotoViewer id={vue.id} legende={vue.libelle} onClose={() => setVue(null)} />}
    </Modal>
  );
}

// { mode, debut, fin, pause, heures } -> champs de la prestation (travailMode, travailDebut… / heuresTravail)
function mapTemps(prefix, p) {
  const cap = prefix === 'travail' ? 'Travail' : 'Courses';
  const out = {};
  if ('mode' in p) out[`${prefix}Mode`] = p.mode;
  if ('debut' in p) out[`${prefix}Debut`] = p.debut;
  if ('fin' in p) out[`${prefix}Fin`] = p.fin;
  if ('pause' in p) out[`${prefix}Pause`] = p.pause;
  if ('heures' in p) out[`heures${cap}`] = p.heures;
  return out;
}

function Row({ l, v }) {
  return (
    <div className="flex justify-between gap-2 py-0.5 text-stone-700 dark:text-stone-300">
      <span>{l}</span>
      <span className="tabular-nums">{eur(v)}</span>
    </div>
  );
}
