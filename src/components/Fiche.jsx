import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, Share2 } from 'lucide-react';
import { computeEntry, sumEntries, eur, hm, km1 } from '../utils/calc';
import { sortByDate, periode, frDate, postes, detailMontants, buildRecapText, horairesTravail, horairesCourses } from '../utils/recap';
import { usePhoto } from '../utils/photos';
import { isoDate } from '../utils/calc';

// Fiche récapitulative « style facturation » — se termine par le COÛT TOTAL (pas de « net à payer »)
// Mise en page noir et blanc, lignes jamais coupées entre deux pages à l'impression.
export default function Fiche({ entries, settings, chantier, onClose }) {
  const list = useMemo(() => sortByDate(entries), [entries]);
  const [detail, setDetail] = useState(true);
  const [annexe, setAnnexe] = useState(true);

  useEffect(() => {
    document.body.classList.add('fiche-ouverte');
    return () => document.body.classList.remove('fiche-ouverte');
  }, []);

  const s = sumEntries(list);
  const noms = [...new Set(list.map((e) => e.chantierNom))];
  const nomChantier = chantier?.nom || (noms.length === 1 ? noms[0] : 'Plusieurs chantiers');
  const co = settings.coordonnees || {};
  const tickets = list.flatMap((e) => (e.tickets || []).map((t) => ({ ...t, date: e.date })));

  const partagerTexte = async () => {
    const texte = buildRecapText(list, settings, { details: detail, chantier });
    try {
      if (navigator.share) await navigator.share({ title: `Récapitulatif — ${nomChantier}`, text: texte });
      else {
        await navigator.clipboard.writeText(texte);
        alert('Texte copié.');
      }
    } catch {
      /* annulé */
    }
  };

  return createPortal(
    <div className="fiche-overlay fixed inset-0 z-[60] overflow-y-auto bg-stone-200" data-testid="fiche">
      {/* Barre d'outils (non imprimée) */}
      <div className="no-print sticky top-0 z-10 border-b border-stone-300 bg-white/95 px-3 py-2 backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2">
          <button type="button" onClick={onClose} className="rounded-full p-2 text-stone-600 hover:bg-stone-100" aria-label="Fermer" data-testid="fermer-fiche">
            <X size={20} />
          </button>
          <span className="flex-1 font-semibold text-stone-800">Fiche récapitulative</span>
          <button type="button" onClick={partagerTexte} className="flex items-center gap-1 rounded-xl bg-stone-100 px-3 py-2 text-sm font-semibold text-stone-700">
            <Share2 size={16} /> Texte
          </button>
          <button type="button" onClick={() => window.print()} className="flex items-center gap-1 rounded-xl bg-orange-600 px-3 py-2 text-sm font-semibold text-white">
            <Printer size={16} /> Imprimer / PDF
          </button>
        </div>
        <div className="mx-auto mt-2 flex max-w-3xl flex-wrap gap-4 text-sm text-stone-700">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="h-4 w-4 accent-orange-600" checked={detail} onChange={(e) => setDetail(e.target.checked)} />
            Détail des montants par jour
          </label>
          {tickets.length > 0 && (
            <label className="flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4 accent-orange-600" checked={annexe} onChange={(e) => setAnnexe(e.target.checked)} />
              Tickets en annexe ({tickets.length})
            </label>
          )}
        </div>
      </div>

      {/* La fiche */}
      <div className="fiche-page mx-auto my-4 max-w-3xl bg-white p-6 text-[13px] leading-snug text-black shadow-lg sm:p-10">
        <header className="no-break mb-6 flex flex-wrap justify-between gap-4 border-b-2 border-black pb-4">
          <div>
            <h1 className="text-xl font-extrabold uppercase tracking-wide">Récapitulatif des prestations</h1>
            <p className="mt-1">Édité le {frDate(isoDate(new Date()))}</p>
            <p>Période : {periode(list)}</p>
          </div>
          <div className="text-right">
            <div className="font-bold">{co.nom}</div>
            {co.adresse && <div>{co.adresse}</div>}
            {co.telephone && <div>Tél. {co.telephone}</div>}
            {co.email && <div>{co.email}</div>}
          </div>
        </header>

        <section className="no-break mb-6 border border-black p-3">
          <div className="text-[11px] uppercase tracking-wide">Chantier / client</div>
          <div className="text-base font-bold">{nomChantier}</div>
          {chantier?.adresse && <div>{chantier.adresse}</div>}
        </section>

        <h2 className="mb-2 text-sm font-bold uppercase">Détail des interventions</h2>
        <table className="mb-6 w-full border-collapse">
          <thead>
            <tr className="border-y-2 border-black text-left text-[11px] uppercase">
              <th className="w-20 py-1.5 pr-2">Date</th>
              <th className="py-1.5 pr-2">Travaux réalisés</th>
              <th className="w-24 py-1.5 text-right">Coût</th>
            </tr>
          </thead>
          <tbody>
            {list.map((e) => {
              const c = computeEntry(e);
              return (
                <tr key={e.id} className="border-b border-stone-400 align-top">
                  <td className="py-2 pr-2 tabular-nums">{frDate(e.date)}</td>
                  <td className="py-2 pr-2">
                    {!chantier && noms.length > 1 && <div className="font-semibold">{e.chantierNom}</div>}
                    {e.description && <div className="whitespace-pre-line">{e.description}</div>}
                    <div className="mt-0.5 text-[12px] text-stone-700">
                      {[
                        c.hT ? `Main-d'œuvre ${hm(c.hT)}${horairesTravail(e) ? ` (${horairesTravail(e)})` : ''}` : null,
                        c.hC ? `Courses ${hm(c.hC)}${horairesCourses(e) ? ` (${horairesCourses(e)})` : ''}` : null,
                        e.sansKm ? null : km1(c.km),
                        e.camion ? 'Camion' : null,
                        e.nettoyage ? 'Nettoyage camion' : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                    {detail && (
                      <div className="mt-0.5 text-[11px] text-stone-600">
                        {detailMontants(e)
                          .map(([l, v]) => `${l} ${eur(v)}`)
                          .join(' · ')}
                      </div>
                    )}
                  </td>
                  <td className="py-2 text-right font-semibold tabular-nums">{eur(c.total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="no-break ml-auto max-w-md">
          <h2 className="mb-2 text-sm font-bold uppercase">Récapitulatif</h2>
          <table className="w-full border-collapse">
            <tbody>
              {postes(list).map((p) => (
                <tr key={p.libelle} className="border-b border-stone-400">
                  <td className="py-1.5 pr-2">{p.libelle}</td>
                  <td className="py-1.5 pr-2 text-right text-[12px] tabular-nums">{p.qte}</td>
                  <td className="py-1.5 pr-2 text-right text-[12px] tabular-nums">{p.pu}</td>
                  <td className="py-1.5 text-right tabular-nums">{eur(p.montant)}</td>
                </tr>
              ))}
              <tr className="border-y-2 border-black text-base font-extrabold">
                <td className="py-2" colSpan={3}>
                  COÛT TOTAL
                </td>
                <td className="py-2 text-right tabular-nums" data-testid="fiche-total">
                  {eur(s.total)}
                </td>
              </tr>
            </tbody>
          </table>
          <p className="mt-2 text-[11px] text-stone-600">
            {s.nb} intervention{s.nb > 1 ? 's' : ''} · {hm(s.hT)} de main-d'œuvre · {hm(s.hC)} de courses · {km1(s.km)}
          </p>
        </div>

        <p className="no-break mt-8 border-t border-stone-400 pt-2 text-[11px] text-stone-600">
          Document récapitulatif du coût des prestations réalisées — ne constitue pas une facture.
        </p>

        {annexe && tickets.length > 0 && (
          <section className="mt-8" style={{ breakBefore: 'page' }}>
            <h2 className="mb-3 text-sm font-bold uppercase">Annexe — tickets de caisse</h2>
            <div className="grid grid-cols-2 gap-4">
              {tickets.map((t) => (
                <AnnexeTicket key={t.id} t={t} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>,
    document.body
  );
}

function AnnexeTicket({ t }) {
  const src = usePhoto(t.id);
  return (
    <figure className="no-break border border-stone-400 p-2">
      {src ? <img src={src} alt="Ticket de caisse" className="mx-auto max-h-[110mm] w-auto" /> : <div className="h-40 bg-stone-100" />}
      <figcaption className="mt-1 text-[11px]">
        {frDate(t.date)}
        {t.libelle ? ` — ${t.libelle}` : ''}
        {t.montant ? ` — ${eur(t.montant)}` : ''}
      </figcaption>
    </figure>
  );
}
