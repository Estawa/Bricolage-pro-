import { useEffect, useState } from 'react';
import { CalendarDays, MapPin, BarChart3, Settings as Cog, Moon, Sun, Copy, Loader2, UploadCloud } from 'lucide-react';
import { DEFAULT_SETTINGS, isoDate, longDate, uid } from './utils/calc';
import { usePersistentState } from './utils/storage';
import { useAuth, useCloudStore, useLocalStore } from './utils/store';
import { firebaseEnabled } from './firebase';
import Counters from './components/Counters';
import Calendar from './components/Calendar';
import DayView from './components/DayView';
import EntryForm from './components/EntryForm';
import RecalcModal from './components/RecalcModal';
import Chantiers from './components/Chantiers';
import Bilan from './components/Bilan';
import Settings from './components/Settings';
import { LoginScreen, SyncBadge } from './components/Account';
import { Modal, Button, inputCls, Label } from './components/ui';
import { APP_VERSION, CHANGELOG } from './changelog';

const TABS = [
  { id: 'calendrier', label: 'Calendrier', icon: CalendarDays },
  { id: 'chantiers', label: 'Chantiers', icon: MapPin },
  { id: 'bilan', label: 'Bilan', icon: BarChart3 },
  { id: 'reglages', label: 'Réglages', icon: Cog },
];

export default function App() {
  const { user, ready } = useAuth();
  const local = useLocalStore();
  const cloud = useCloudStore(user);
  const [modeLocal, setModeLocal] = usePersistentState('modeLocal', false);
  const [migrationVue, setMigrationVue] = usePersistentState('migrationVue', {});
  const [dark, setDark] = usePersistentState('dark', false);

  const store = user ? cloud : local;

  const [tab, setTab] = useState('calendrier');
  const now = new Date();
  const [selectedDate, setSelectedDate] = useState(isoDate(now));
  const [viewMonth, setViewMonth] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [form, setForm] = useState(null);
  const [dup, setDup] = useState(null);
  const [recalc, setRecalc] = useState(null);
  const [showLog, setShowLog] = useState(false);
  const [migrating, setMigrating] = useState(false);

  // À chaque connexion / déconnexion, retour au calendrier
  useEffect(() => setTab('calendrier'), [user?.uid]);

  // Sécurité : fusionne avec les réglages par défaut (nouvelles options d'une future version)
  const raw = store.settings || DEFAULT_SETTINGS;
  const s = { ...DEFAULT_SETTINGS, ...raw, bases: { ...DEFAULT_SETTINGS.bases, ...raw.bases } };
  const { entries, chantiers } = store;

  const selectDay = (d) => {
    setSelectedDate(d);
    const [y, m] = d.split('-').map(Number);
    setViewMonth({ year: y, month: m - 1 });
  };

  // ---- Écrans d'entrée ----
  const wrap = (content) => <div className={dark ? 'dark' : ''}>{content}</div>;

  if (!ready) {
    return wrap(
      <div className="flex min-h-screen items-center justify-center bg-orange-50/60 dark:bg-stone-900">
        <Loader2 className="animate-spin text-orange-600" size={32} />
      </div>
    );
  }
  if (firebaseEnabled && !user && !modeLocal) {
    return wrap(<LoginScreen onLocal={() => setModeLocal(true)} />);
  }
  if (user && !cloud.loaded) {
    return wrap(
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-orange-50/60 text-stone-500 dark:bg-stone-900">
        <Loader2 className="animate-spin text-orange-600" size={32} />
        Chargement de vos données…
      </div>
    );
  }

  // Proposition d'envoyer les données du téléphone vers le compte (une seule fois)
  const proposerMigration =
    user &&
    cloud.entries.length === 0 &&
    cloud.chantiers.length === 0 &&
    (local.entries.length > 0 || local.chantiers.length > 0) &&
    !migrationVue[user.uid];

  const migrer = async () => {
    setMigrating(true);
    try {
      await cloud.importAll({ settings: local.settings, chantiers: local.chantiers, entries: local.entries });
      setModeLocal(false);
    } finally {
      setMigrating(false);
      setMigrationVue((m) => ({ ...m, [user.uid]: true }));
    }
  };

  return wrap(
    <div className="min-h-screen bg-orange-50/40 pb-24 text-stone-900 dark:bg-stone-900 dark:text-stone-100">
      {/* En-tête */}
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/90 backdrop-blur dark:border-stone-800 dark:bg-stone-900/90">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
          <img src="/icon.svg" alt="" className="h-9 w-9 rounded-xl" />
          <div className="flex-1 leading-tight">
            <h1 className="font-extrabold">
              Bricolage Pro <span className="font-normal text-stone-400">by C. Guilhem</span>
            </h1>
            <button type="button" onClick={() => setShowLog(true)} className="text-[11px] text-stone-400 underline-offset-2 hover:underline">
              v{APP_VERSION}
            </button>
          </div>
          {firebaseEnabled && (
            <button type="button" onClick={() => setTab('reglages')} className="rounded-full hover:bg-stone-100 dark:hover:bg-stone-800">
              <SyncBadge state={store.syncState} />
            </button>
          )}
          <button type="button" onClick={() => setDark(!dark)} className="rounded-full p-2 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800" aria-label="Mode jour/nuit">
            {dark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-4 px-4 pt-4">
        {tab === 'calendrier' && (
          <>
            <Counters entries={entries} selectedDate={selectedDate} viewMonth={viewMonth} />
            <Calendar entries={entries} viewMonth={viewMonth} setViewMonth={setViewMonth} selectedDate={selectedDate} onSelect={selectDay} />
            <DayView
              date={selectedDate}
              entries={entries}
              settings={s}
              onAdd={() => setForm({})}
              onEdit={(entry) => setForm({ entry })}
              onDelete={(id) => store.deleteEntry(id)}
              onDuplicate={(e) => setDup(e)}
              onRecalc={(e) => setRecalc(e)}
            />
          </>
        )}
        {tab === 'chantiers' && (
          <Chantiers
            chantiers={chantiers}
            saveChantier={store.saveChantier}
            deleteChantier={store.deleteChantier}
            entries={entries}
            settings={s}
            setSettings={store.setSettings}
          />
        )}
        {tab === 'bilan' && <Bilan entries={entries} viewMonth={viewMonth} settings={s} />}
        {tab === 'reglages' && (
          <Settings
            settings={s}
            setSettings={store.setSettings}
            chantiers={chantiers}
            entries={entries}
            onImport={(d) => store.importAll(d)}
            onReset={() => store.resetAll()}
            user={user}
            syncState={store.syncState}
            onLeaveLocal={() => setModeLocal(false)}
          />
        )}
      </main>

      {/* Barre d'onglets */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-stone-800 dark:bg-stone-900/95">
        <div className="mx-auto grid max-w-lg grid-cols-4">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              data-testid={`onglet-${id}`}
              className={`flex flex-col items-center gap-0.5 py-2 text-xs font-medium ${
                tab === id ? 'text-orange-600 dark:text-orange-400' : 'text-stone-400'
              }`}
            >
              <Icon size={22} />
              {label}
            </button>
          ))}
        </div>
      </nav>

      {form && (
        <EntryForm
          date={selectedDate}
          entry={form.entry}
          chantiers={chantiers}
          settings={s}
          onSave={(e) => {
            store.saveEntry(e);
            setForm(null);
          }}
          onClose={() => setForm(null)}
        />
      )}

      {recalc && (
        <RecalcModal
          entry={recalc}
          settings={s}
          onApply={(e) => {
            store.saveEntry(e);
            setRecalc(null);
          }}
          onClose={() => setRecalc(null)}
        />
      )}

      {dup && (
        <DuplicateModal
          entry={dup}
          onClose={() => setDup(null)}
          onConfirm={(date) => {
            store.saveEntry({ ...dup, id: uid(), date });
            setDup(null);
            selectDay(date);
          }}
        />
      )}

      {proposerMigration && (
        <Modal
          title="Envoyer vos données dans votre compte ?"
          onClose={() => setMigrationVue((m) => ({ ...m, [user.uid]: true }))}
          footer={
            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" disabled={migrating} onClick={() => setMigrationVue((m) => ({ ...m, [user.uid]: true }))}>
                Non merci
              </Button>
              <Button className="flex-1" disabled={migrating} onClick={migrer} data-testid="migrer">
                {migrating ? <Loader2 size={18} className="animate-spin" /> : <UploadCloud size={18} />} Envoyer
              </Button>
            </div>
          }
        >
          <p className="text-sm text-stone-600 dark:text-stone-300">
            Ce téléphone contient {local.entries.length} prestation{local.entries.length > 1 ? 's' : ''} et {local.chantiers.length} chantier
            {local.chantiers.length > 1 ? 's' : ''} saisis sans compte, ainsi que vos tarifs. Les envoyer dans votre compte pour les retrouver sur tous vos appareils ?
          </p>
        </Modal>
      )}

      {showLog && (
        <Modal title="Journal des modifications" onClose={() => setShowLog(false)}>
          <div className="space-y-4">
            {CHANGELOG.map((v) => (
              <div key={v.version}>
                <div className="font-semibold">
                  v{v.version} <span className="font-normal text-stone-400">— {v.date}</span>
                </div>
                <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-stone-600 dark:text-stone-300">
                  {v.items.map((it) => (
                    <li key={it}>{it}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

function DuplicateModal({ entry, onClose, onConfirm }) {
  const [date, setDate] = useState(entry.date);
  return (
    <Modal
      title="Dupliquer la prestation"
      onClose={onClose}
      footer={
        <Button className="w-full" onClick={() => onConfirm(date)} disabled={!date}>
          <Copy size={18} /> Dupliquer
        </Button>
      }
    >
      <p className="mb-3 text-sm text-stone-500">
        « {entry.chantierNom} » du {longDate(entry.date)} — copiée à l’identique (trajets, temps, camion…) sur le jour choisi.
      </p>
      <label className="block">
        <Label>Nouveau jour</Label>
        <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
    </Modal>
  );
}
