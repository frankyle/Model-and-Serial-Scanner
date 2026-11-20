import { DEVICE_TYPES, STATUSES } from '../lib/classify.js'

const input =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200'

// Dropdown of device types; choosing "Other" reveals a box to type your own
export function TypeSelect({ type, custom, onChange, autoBadge }) {
  return (
    <div>
      <span className="flex items-center justify-between text-xs font-medium text-slate-500">
        Device type
        {autoBadge && <span className="text-emerald-600">auto-detected</span>}
      </span>
      <select value={type || ''} onChange={(e) => onChange({ type: e.target.value })} className={`${input} mt-1`}>
        <option value="">— Select type —</option>
        {DEVICE_TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      {type === 'Other' && (
        <input
          value={custom || ''}
          onChange={(e) => onChange({ typeCustom: e.target.value })}
          placeholder="Type the device name"
          className={`${input} mt-2`}
        />
      )}
    </div>
  )
}

// Three big tap buttons: Working / Not working / Not confirmed yet
export function StatusButtons({ status, onChange }) {
  return (
    <div>
      <span className="text-xs font-medium text-slate-500">Status</span>
      <div className="mt-1 grid grid-cols-3 gap-1.5">
        {STATUSES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onChange(s.id)}
            className={`rounded-lg px-1 py-2.5 text-xs font-semibold leading-tight transition ${
              status === s.id ? s.on : 'bg-slate-100 text-slate-500 active:bg-slate-200'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export const inputClass = input
