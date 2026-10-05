import { useState } from 'react';
import { Receipt, X, Loader2 } from 'lucide-react';
import { usePhoto } from '../utils/photos';

export function TicketThumb({ id, onClick, className = 'h-16 w-16' }) {
  const src = usePhoto(id);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative shrink-0 overflow-hidden rounded-lg border border-stone-200 bg-stone-100 dark:border-stone-700 dark:bg-stone-900 ${className}`}
      aria-label="Voir le ticket"
    >
      {src ? (
        <img src={src} alt="Ticket de caisse" className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-stone-400">
          <Receipt size={18} />
        </span>
      )}
    </button>
  );
}

export function PhotoViewer({ id, legende, onClose }) {
  const src = usePhoto(id);
  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-black/95" onClick={onClose}>
      <div className="flex items-center justify-between p-3 text-white">
        <span className="text-sm">{legende || 'Ticket de caisse'}</span>
        <button type="button" className="rounded-full p-2 hover:bg-white/10" onClick={onClose} aria-label="Fermer">
          <X size={22} />
        </button>
      </div>
      <div className="flex flex-1 items-center justify-center overflow-auto p-2">
        {src ? (
          <img src={src} alt="Ticket de caisse" className="max-h-full max-w-full object-contain" onClick={(e) => e.stopPropagation()} />
        ) : (
          <Loader2 className="animate-spin text-white" />
        )}
      </div>
    </div>
  );
}

// Rangée de miniatures (lecture seule) avec visionneuse
export function TicketStrip({ tickets }) {
  const [vue, setVue] = useState(null);
  if (!tickets?.length) return null;
  return (
    <>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
        {tickets.map((t) => (
          <TicketThumb key={t.id} id={t.id} onClick={() => setVue(t)} className="h-14 w-14" />
        ))}
      </div>
      {vue && (
        <PhotoViewer
          id={vue.id}
          legende={[vue.libelle, vue.montant && `${vue.montant} €`].filter(Boolean).join(' — ')}
          onClose={() => setVue(null)}
        />
      )}
    </>
  );
}
