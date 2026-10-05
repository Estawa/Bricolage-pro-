import { useState } from 'react';
import { Plus, Pencil, Trash2, MapPin, Wand2, Loader2, Home, School, ChevronRight } from 'lucide-react';
import { sumEntries, eur, km1, uid } from '../utils/calc';
import { distancesDepuisBases } from '../utils/distance';
import { Card, Modal, Label, NumberField, Button, inputCls } from './ui';

export default function Chantiers({ chantiers, saveChantier: save, deleteChantier, entries, settings, setSettings, onOpen }) {
  const [edit, setEdit] = useState(null);

  const saveChantier = (c) => {
    save(c);
    setEdit(null);
  };

  const remove = (c) => {
    const nb = entries.filter((e) => e.chantierId === c.id).length;
    const msg = nb
      ? `Supprimer « ${c.nom} » ? Ses ${nb} prestation(s) déjà saisies sont conservées (avec leur nom et leurs km).`
      : `Supprimer « ${c.nom} » ?`;
    if (confirm(msg)) deleteChantier(c.id);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Chantiers & clients</h2>
          <p className="text-sm text-stone-500">Distances enregistrées une fois pour toutes</p>
        </div>
        <Button onClick={() => setEdit({ id: uid(), nom: '', adresse: '', kmMaison: '', kmTravail: '', note: '' })} data-testid="nouveau-chantier">
          <Plus size={18} /> Nouveau
        </Button>
      </div>

      {chantiers.length === 0 && (
        <Card>
          <p className="text-sm text-stone-500">
            Ajoutez vos clients avec leur adresse : l’appli calcule les kilomètres depuis {settings.bases.maison.label.toLowerCase()} et depuis
            le {settings.bases.travail.label.toLowerCase()}, puis les remplit automatiquement à chaque prestation.
          </p>
        </Card>
      )}

      {chantiers.map((c) => {
        const s = sumEntries(entries.filter((e) => e.chantierId === c.id));
        return (
          <Card key={c.id}>
            <div className="flex items-start justify-between gap-2">
              <button type="button" className="min-w-0 flex-1 text-left" onClick={() => onOpen(c)} data-testid="ouvrir-chantier">
                <div className="font-semibold">{c.nom}</div>
                {c.adresse && (
                  <div className="flex items-center gap-1 text-xs text-stone-500">
                    <MapPin size={12} /> {c.adresse}
                  </div>
                )}
              </button>
              <div className="flex">
                <button type="button" className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-700" onClick={() => setEdit(c)} aria-label="Modifier">
                  <Pencil size={16} />
                </button>
                <button type="button" className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40" onClick={() => remove(c)} aria-label="Supprimer">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-1 rounded-lg bg-stone-50 px-2 py-1 dark:bg-stone-900">
                <Home size={14} className="text-orange-600" /> {c.kmMaison !== '' ? km1(+c.kmMaison) : '—'}
              </div>
              <div className="flex items-center gap-1 rounded-lg bg-stone-50 px-2 py-1 dark:bg-stone-900">
                <School size={14} className="text-orange-600" /> {c.kmTravail !== '' ? km1(+c.kmTravail) : '—'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpen(c)}
              className="mt-2 flex w-full items-center justify-between rounded-xl bg-orange-50 px-3 py-2 text-sm font-medium text-orange-800 dark:bg-orange-950/40 dark:text-orange-200"
            >
              <span>
                {s.nb ? `${s.nb} prestation${s.nb > 1 ? 's' : ''} · coût total ${eur(s.total)}` : 'Aucune prestation — ouvrir la fiche'}
              </span>
              <ChevronRight size={16} />
            </button>
          </Card>
        );
      })}

      {edit && (
        <ChantierForm
          initial={edit}
          settings={settings}
          setSettings={setSettings}
          onSave={saveChantier}
          onClose={() => setEdit(null)}
        />
      )}
    </div>
  );
}

function ChantierForm({ initial, settings, setSettings, onSave, onClose }) {
  const [c, setC] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const set = (p) => setC((x) => ({ ...x, ...p }));

  const calcAuto = async () => {
    if (!c.adresse.trim()) {
      setMsg('Indiquez d’abord l’adresse du chantier.');
      return;
    }
    setBusy(true);
    setMsg('Calcul de l’itinéraire en cours…');
    try {
      const r = await distancesDepuisBases(c.adresse, settings.bases);
      set({ kmMaison: r.kmMaison, kmTravail: r.kmTravail });
      // On garde en mémoire la position des bases pour aller plus vite la prochaine fois
      setSettings((s) => ({
        ...s,
        bases: {
          maison: { ...s.bases.maison, ...r.basesCoords.maison },
          travail: { ...s.bases.travail, ...r.basesCoords.travail },
        },
      }));
      setMsg('Distances routières calculées (aller simple). Vous pouvez les ajuster.');
    } catch (e) {
      setMsg(`${e.message}. Saisissez les kilomètres à la main.`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={initial.nom ? 'Modifier le chantier' : 'Nouveau chantier'}
      onClose={onClose}
      footer={
        <Button className="w-full" disabled={!c.nom.trim()} onClick={() => onSave({ ...c, nom: c.nom.trim() })} data-testid="enregistrer-chantier">
          Enregistrer
        </Button>
      }
    >
      <div className="space-y-4">
        <label className="block">
          <Label>Nom du client / chantier</Label>
          <input id="ch-nom" className={inputCls} value={c.nom} onChange={(e) => set({ nom: e.target.value })} placeholder="Ex. : M. Martin – salle de bain" />
        </label>
        <label className="block">
          <Label>Adresse</Label>
          <input id="ch-adresse" className={inputCls} value={c.adresse} onChange={(e) => set({ adresse: e.target.value })} placeholder="Ex. : 12 rue des Lilas, Mennecy" />
        </label>
        <Button variant="ghost" className="w-full" onClick={calcAuto} disabled={busy}>
          {busy ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />} Calculer les km automatiquement
        </Button>
        {msg && <p className="text-xs text-stone-500">{msg}</p>}
        <div className="grid grid-cols-2 gap-3">
          <NumberField id="ch-km-maison" label={`Depuis ${settings.bases.maison.label}`} hint="(aller)" value={c.kmMaison} onChange={(v) => set({ kmMaison: v })} suffix="km" step="0.1" />
          <NumberField id="ch-km-travail" label={`Depuis ${settings.bases.travail.label}`} hint="(aller)" value={c.kmTravail} onChange={(v) => set({ kmTravail: v })} suffix="km" step="0.1" />
        </div>
        <label className="block">
          <Label>Notes</Label>
          <textarea rows={2} className={inputCls} value={c.note} onChange={(e) => set({ note: e.target.value })} placeholder="Code portail, téléphone…" />
        </label>
      </div>
    </Modal>
  );
}
