import { useMemo, useState } from 'react';
import { Share2, Copy, Mail, MessageCircle, FileText, Check, Loader2 } from 'lucide-react';
import { sumEntries, eur, shortDate } from '../utils/calc';
import { buildRecapText, sortByDate } from '../utils/recap';
import { dataUrlToFile, photoCache, usePhotoApi } from '../utils/photos';
import { Modal, Button, Toggle } from './ui';
import { TicketThumb } from './Tickets';

// Partage d'une sélection de prestations (texte récapitulatif + photos des tickets choisis)
export default function Share({ entries, settings, chantier, onClose, onFiche }) {
  const photos = usePhotoApi();
  const list = useMemo(() => sortByDate(entries), [entries]);
  const tickets = useMemo(() => list.flatMap((e) => (e.tickets || []).map((t) => ({ ...t, date: e.date }))), [list]);
  const [details, setDetails] = useState(true);
  const [avecTickets, setAvecTickets] = useState(tickets.length > 0);
  const [choix, setChoix] = useState(() => new Set(tickets.map((t) => t.id)));
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState('');

  const ticketsChoisis = avecTickets ? tickets.filter((t) => choix.has(t.id)) : [];
  const texte = buildRecapText(list, settings, { details, chantier, nbTickets: ticketsChoisis.length });
  const s = sumEntries(list);
  const titre = chantier ? `Récapitulatif — ${chantier.nom}` : 'Récapitulatif des prestations';

  const fichiers = async () => {
    const out = [];
    for (const t of ticketsChoisis) {
      const data = photoCache.get(t.id) || (await photos.get(t.id));
      if (data) out.push(dataUrlToFile(data, `ticket-${t.date}-${t.id.slice(0, 4)}.jpg`));
    }
    return out;
  };

  const partager = async () => {
    setBusy(true);
    setInfo('');
    try {
      const files = await fichiers();
      if (files.length && navigator.canShare?.({ files })) {
        await navigator.share({ title: titre, text: texte, files });
      } else if (navigator.share) {
        await navigator.share({ title: titre, text: texte });
        if (files.length) setInfo('Cet appareil ne permet pas de joindre les photos : utilisez « Partager les tickets seuls ».');
      } else {
        await navigator.clipboard.writeText(texte);
        setInfo('Partage non disponible ici : le texte a été copié, collez-le dans votre message.');
      }
    } catch (e) {
      if (e?.name !== 'AbortError') setInfo('Le partage a échoué. Essayez « Copier le texte ».');
    } finally {
      setBusy(false);
    }
  };

  const partagerTickets = async () => {
    setBusy(true);
    try {
      const files = await fichiers();
      if (files.length && navigator.canShare?.({ files })) await navigator.share({ files, title: 'Tickets de caisse' });
      else setInfo('Cet appareil ne permet pas de partager des photos.');
    } catch (e) {
      if (e?.name !== 'AbortError') setInfo('Le partage a échoué.');
    } finally {
      setBusy(false);
    }
  };

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(texte);
      setInfo('Texte copié ✔');
    } catch {
      setInfo('Copie impossible sur cet appareil.');
    }
  };

  return (
    <Modal
      title="Partager"
      onClose={onClose}
      footer={
        <div className="space-y-2">
          <Button className="w-full" onClick={partager} disabled={busy} data-testid="partager">
            {busy ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />}
            Partager (WhatsApp, mail…){ticketsChoisis.length ? ` + ${ticketsChoisis.length} photo${ticketsChoisis.length > 1 ? 's' : ''}` : ''}
          </Button>
          {info && <p className="text-center text-xs text-stone-500" data-testid="share-info">{info}</p>}
        </div>
      }
    >
      <div className="space-y-4">
        <div className="rounded-2xl bg-stone-50 p-3 text-sm dark:bg-stone-900/60">
          <div className="font-semibold">{chantier?.nom || `${list.length} prestation${list.length > 1 ? 's' : ''}`}</div>
          <div className="text-stone-500">
            {list.length} prestation{list.length > 1 ? 's' : ''} · coût total <b className="text-stone-800 dark:text-stone-100">{eur(s.total)}</b>
          </div>
        </div>

        <Toggle checked={details} onChange={setDetails} label="Détail des montants" sub="Main-d'œuvre, courses, déplacement, camion…" />
        {tickets.length > 0 && (
          <Toggle checked={avecTickets} onChange={setAvecTickets} label="Joindre les tickets de caisse" sub={`${choix.size} / ${tickets.length} sélectionné${choix.size > 1 ? 's' : ''}`} />
        )}

        {avecTickets && tickets.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {tickets.map((t) => {
              const on = choix.has(t.id);
              return (
                <div key={t.id} className="relative">
                  <TicketThumb
                    id={t.id}
                    className={`aspect-square h-auto w-full ${on ? 'ring-2 ring-orange-500' : 'opacity-40'}`}
                    onClick={() =>
                      setChoix((p) => {
                        const n = new Set(p);
                        n.has(t.id) ? n.delete(t.id) : n.add(t.id);
                        return n;
                      })
                    }
                  />
                  {on && (
                    <span className="pointer-events-none absolute right-1 top-1 rounded-full bg-orange-600 p-0.5 text-white">
                      <Check size={12} />
                    </span>
                  )}
                  <div className="mt-0.5 truncate text-center text-[10px] text-stone-500">{shortDate(t.date)}</div>
                </div>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Button variant="ghost" className="py-2 text-sm" onClick={copier}>
            <Copy size={16} /> Copier le texte
          </Button>
          <Button variant="ghost" className="py-2 text-sm" onClick={() => onFiche(list)}>
            <FileText size={16} /> Fiche récap
          </Button>
          <a
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-700 dark:bg-stone-700 dark:text-stone-200"
            href={`https://wa.me/?text=${encodeURIComponent(texte)}`}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle size={16} /> WhatsApp (texte)
          </a>
          <a
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-700 dark:bg-stone-700 dark:text-stone-200"
            href={`mailto:?subject=${encodeURIComponent(titre)}&body=${encodeURIComponent(texte)}`}
          >
            <Mail size={16} /> Mail (texte)
          </a>
        </div>
        {ticketsChoisis.length > 0 && (
          <Button variant="ghost" className="w-full py-2 text-sm" onClick={partagerTickets} disabled={busy}>
            Partager les tickets seuls ({ticketsChoisis.length})
          </Button>
        )}

        <details className="rounded-xl border border-stone-200 p-3 text-sm dark:border-stone-700">
          <summary className="cursor-pointer font-medium">Aperçu du message</summary>
          <pre className="mt-2 whitespace-pre-wrap font-sans text-xs text-stone-600 dark:text-stone-300" data-testid="apercu-texte">
            {texte}
          </pre>
        </details>
      </div>
    </Modal>
  );
}
