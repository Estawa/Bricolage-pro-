import { X } from 'lucide-react';

export function Card({ children, className = '' }) {
  return (
    <div
      className={`rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-700 dark:bg-stone-800 ${className}`}
    >
      {children}
    </div>
  );
}

export function Label({ children, hint }) {
  return (
    <span className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
      {children}
      {hint && <span className="ml-1 font-normal text-stone-400">{hint}</span>}
    </span>
  );
}

export const inputCls =
  'w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-base text-stone-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100 dark:focus:ring-orange-900';

export function NumberField({ label, hint, value, onChange, suffix, step = '0.01', min = '0', id }) {
  return (
    <label className="block">
      <Label hint={hint}>{label}</Label>
      <div className="relative">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          step={step}
          min={min}
          className={`${inputCls} ${suffix ? 'pr-14' : ''}`}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-stone-400">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

export function Segmented({ options, value, onChange, small = false }) {
  return (
    <div className="flex rounded-xl bg-stone-100 p-1 dark:bg-stone-900">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex flex-1 items-center justify-center gap-1 rounded-lg ${
            small ? 'px-2 py-1 text-sm' : 'px-3 py-2 text-sm'
          } font-medium transition ${
            value === o.value
              ? 'bg-white text-orange-700 shadow dark:bg-stone-700 dark:text-orange-300'
              : 'text-stone-500 dark:text-stone-400'
          }`}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label, sub, icon }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
        checked
          ? 'border-orange-400 bg-orange-50 dark:border-orange-600 dark:bg-orange-950/40'
          : 'border-stone-200 dark:border-stone-700'
      }`}
    >
      {icon && <span className="text-orange-600 dark:text-orange-400">{icon}</span>}
      <span className="flex-1">
        <span className="block font-medium text-stone-800 dark:text-stone-100">{label}</span>
        {sub && <span className="block text-xs text-stone-500 dark:text-stone-400">{sub}</span>}
      </span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked ? 'bg-orange-500' : 'bg-stone-300 dark:bg-stone-600'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            checked ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </span>
    </button>
  );
}

// Saisie d'une durée en heures + minutes (stockée en heures décimales)
export function DurationField({ label, value, onChange, idPrefix }) {
  const total = Math.round((parseFloat(value) || 0) * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  const set = (hh, mm) => onChange((hh * 60 + mm) / 60);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            id={idPrefix ? `${idPrefix}-h` : undefined}
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            className={`${inputCls} pr-8`}
            value={h}
            onChange={(e) => set(Math.max(0, parseInt(e.target.value || '0', 10)), m)}
          />
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-stone-400">
            h
          </span>
        </div>
        <select
          id={idPrefix ? `${idPrefix}-m` : undefined}
          className={`${inputCls} flex-1`}
          value={minutes.includes(m) ? m : m}
          onChange={(e) => set(h, parseInt(e.target.value, 10))}
        >
          {!minutes.includes(m) && <option value={m}>{m} min</option>}
          {minutes.map((x) => (
            <option key={x} value={x}>
              {String(x).padStart(2, '0')} min
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function Modal({ title, onClose, children, footer }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div
        className="flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-3xl bg-white dark:bg-stone-800 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3 dark:border-stone-700">
          <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-700" aria-label="Fermer">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
        {footer && <div className="border-t border-stone-200 px-4 py-3 dark:border-stone-700">{footer}</div>}
      </div>
    </div>
  );
}

export function Button({ children, variant = 'primary', className = '', ...props }) {
  const styles = {
    primary: 'bg-orange-600 text-white hover:bg-orange-700 active:bg-orange-800',
    ghost: 'bg-stone-100 text-stone-700 hover:bg-stone-200 dark:bg-stone-700 dark:text-stone-200 dark:hover:bg-stone-600',
    danger: 'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/50 dark:text-red-300',
  };
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-semibold transition disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
