import { useRef, useState } from 'react';
import { usePhotoApi } from '../utils/photos';
import { Hammer, ShoppingCart, Car, Truck, Sparkles, Home, School, Download, Upload, Trash2, User, Loader2, Scale } from 'lucide-react';
import { DEFAULT_SETTINGS, isoDate } from '../utils/calc';
import { downloadFile } from '../utils/storage';
import { Card, Label, NumberField, Button, inputCls } from './ui';
import { AccountCard } from './Account';

export default function Settings({ settings, setSettings, chantiers, entries, onImport, onReset, user, syncState, onLeaveLocal, onBulk }) {
  const fileRef = useRef(null);
  const photos = usePhotoApi();
  const [exporting, setExporting] = useState(false);
  const setCoord = (patch) => setSettings((s) => ({ ...s, coordonnees: { ...s.coordonnees, ...patch } }));
  // valeur gardée telle que tapée (évite de perdre la virgule pendant la saisie)
  const set = (k) => (v) => setSettings((s) => ({ ...s, [k]: v }));
  const setBase = (key, patch) =>
    setSettings((s) => ({ ...s, bases: { ...s.bases, [key]: { ...s.bases[key], ...patch } } }));

  const exportJson = async () => {
    setExporting(true);
    try {
      const ph = {};
      for (const e of entries) {
        for (const t of e.tickets || []) {
          const d = await photos.get(t.id);
          if (d) ph[t.id] = d;
        }
      }
      const data = { app: 'bricolage-pro', version: 2, exportLe: new Date().toISOString(), settings, chantiers, entries, photos: ph };
      downloadFile(`bricolage-pro-sauvegarde-${isoDate(new Date())}.json`, JSON.stringify(data));
    } finally {
      setExporting(false);
    }
  };

  const importJson = async (file) => {
    try {
      const data = JSON.parse(await file.text());
      if (data.app !== 'bricolage-pro') throw new Error();
      if (confirm(`Remplacer les données actuelles par la sauvegarde (${data.entries?.length || 0} prestations, ${data.chantiers?.length || 0} chantiers) ?`)) {
        onImport(data);
      }
    } catch {
      alert('Ce fichier n’est pas une sauvegarde Bricolage Pro valide.');
    }
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold">Réglages</h2>

      <AccountCard user={user} syncState={syncState} onLeaveLocal={onLeaveLocal} />

      <Card className="space-y-3">
        <h3 className="flex items-center gap-2 font-semibold">
          <User size={18} className="text-orange-600" /> Mes coordonnées (fiche récap)
        </h3>
        {[
          ['nom', 'Nom', 'Christophe Guilhem'],
          ['adresse', 'Adresse / ville', 'Champcueil'],
          ['telephone', 'Téléphone', '06 …'],
          ['email', 'E-mail', 'vous@exemple.fr'],
        ].map(([k, l, ph]) => (
          <label key={k} className="block">
            <Label>{l}</Label>
            <input className={inputCls} placeholder={ph} value={settings.coordonnees?.[k] || ''} onChange={(e) => setCoord({ [k]: e.target.value })} />
          </label>
        ))}
      </Card>

      <Card className="space-y-3">
        <h3 className="flex items-center gap-2 font-semibold">
          <Hammer size={18} className="text-orange-600" /> Mes tarifs
        </h3>
        <NumberField id="taux-travail" label="Coût horaire de travail" value={settings.tauxTravail} onChange={set('tauxTravail')} suffix="€/h" />
        <NumberField id="taux-courses" label="Coût horaire des courses" value={settings.tauxCourses} onChange={set('tauxCourses')} suffix="€/h" />
        <NumberField id="cout-km" label="Coût kilométrique" value={settings.coutKm} onChange={set('coutKm')} suffix="€/km" step="0.01" />
        <p className="flex items-start gap-1 text-xs text-stone-500">
          <ShoppingCart size={14} className="mt-0.5 shrink-0" />
          Les tarifs sont enregistrés avec chaque prestation : les modifier ici ne change pas les journées déjà saisies.
        </p>
        <Button variant="ghost" className="w-full" onClick={onBulk} data-testid="ouvrir-bulk">
          <Scale size={18} /> Comparer / changer les tarifs de plusieurs prestations
        </Button>
      </Card>

      <Card className="space-y-3">
        <h3 className="flex items-center gap-2 font-semibold">
          <Truck size={18} className="text-orange-600" /> Option camion
        </h3>
        <NumberField id="camion-forfait" label="Forfait utilisation du camion" hint="(par prestation)" value={settings.camionForfait} onChange={set('camionForfait')} suffix="€" />
        <NumberField id="camion-km" label="Supplément kilométrique camion" hint="(en plus du coût km)" value={settings.camionKm} onChange={set('camionKm')} suffix="€/km" />
        <NumberField id="nettoyage" label="Nettoyage complet du camion" value={settings.nettoyageForfait} onChange={set('nettoyageForfait')} suffix="€" />
        <p className="flex items-start gap-1 text-xs text-stone-500">
          <Sparkles size={14} className="mt-0.5 shrink-0" />
          Exemple : gravats, gros outillage, déchetterie. Mettez 0 pour un poste que vous ne facturez pas.
        </p>
      </Card>

      <Card className="space-y-3">
        <h3 className="flex items-center gap-2 font-semibold">
          <Car size={18} className="text-orange-600" /> Points de départ / retour
        </h3>
        {[
          ['maison', <Home key="h" size={16} />],
          ['travail', <School key="s" size={16} />],
        ].map(([key, icon]) => (
          <div key={key} className="space-y-2 rounded-xl bg-stone-50 p-3 dark:bg-stone-900/60">
            <label className="block">
              <Label>
                <span className="inline-flex items-center gap-1">
                  {icon} Nom affiché
                </span>
              </Label>
              <input className={inputCls} value={settings.bases[key].label} onChange={(e) => setBase(key, { label: e.target.value })} />
            </label>
            <label className="block">
              <Label>Adresse (pour le calcul automatique des km)</Label>
              <input
                className={inputCls}
                value={settings.bases[key].adresse}
                onChange={(e) => setBase(key, { adresse: e.target.value, lat: null, lon: null })}
              />
            </label>
          </div>
        ))}
      </Card>

      <Card className="space-y-2">
        <h3 className="font-semibold">Sauvegarde</h3>
        <p className="text-xs text-stone-500">
          {user ? 'Vos données sont synchronisées dans votre compte. Une sauvegarde fichier reste utile en cas de souci.' : 'Les données sont enregistrées dans ce téléphone. Exportez régulièrement une sauvegarde (à garder sur Drive, par mail…).'}
        </p>
        <Button variant="ghost" className="w-full" onClick={exportJson} disabled={exporting}>
          {exporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />} Exporter une sauvegarde (avec photos)
        </Button>
        <Button variant="ghost" className="w-full" onClick={() => fileRef.current?.click()}>
          <Upload size={18} /> Restaurer une sauvegarde
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) importJson(e.target.files[0]);
            e.target.value = '';
          }}
        />
        <Button
          variant="danger"
          className="w-full"
          onClick={() => {
            if (confirm('Effacer toutes les prestations, tous les chantiers et toutes les photos de tickets ? (Les tarifs sont conservés.)')) onReset();
          }}
        >
          <Trash2 size={18} /> Tout effacer
        </Button>
        <button
          type="button"
          className="w-full pt-1 text-xs text-stone-400 underline"
          onClick={() => {
            if (confirm('Remettre les tarifs et adresses par défaut ?')) setSettings(DEFAULT_SETTINGS);
          }}
        >
          Réinitialiser les réglages
        </button>
      </Card>
    </div>
  );
}
