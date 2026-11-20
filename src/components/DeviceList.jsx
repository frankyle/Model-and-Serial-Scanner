import { STATUSES } from '../lib/classify.js'
import { TypeSelect, StatusButtons, inputClass } from './Fields.jsx'

export default function DeviceList({ devices, site, onSite, onChange, onDelete, onClear, onExcel, onPdf, onAddManual }) {
  const count = (id) => devices.filter((d) => (d.status || 'unconfirmed') === id).length

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          3. Devices{' '}
          <span className="ml-1 rounded-full bg-red-100 px-2 py-0.5 text-red-700">{devices.length}</span>
        </h2>
        <button onClick={onAddManual} className="py-1 text-sm font-medium text-red-600">
          + Add manually
        </button>
      </div>

      {devices.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5 text-xs font-medium">
          {STATUSES.map((s) => (
            <span key={s.id} className={`rounded-full px-2.5 py-1 ${s.chip}`}>
              {s.label}: {count(s.id)}
            </span>
          ))}
        </div>
      )}

      <label className="mb-4 block">
        <span className="text-xs font-medium text-slate-500">Site / project name (shown on the exported file)</span>
        <input
          value={site}
          onChange={(e) => onSite(e.target.value)}
          placeholder="e.g. Mlimani City – Block A"
          className={`${inputClass} mt-1`}
        />
      </label>

      {devices.length === 0 ? (
        <p className="rounded-lg bg-slate-50 p-6 text-center text-sm text-slate-500">
          Nothing scanned yet. Scanned devices will be listed here.
        </p>
      ) : (
        <ul className="space-y-3">
          {devices.map((d, i) => (
            <li key={d.id} className="rounded-xl border border-slate-200 p-3">
              <div className="mb-2 flex items-start gap-2">
                <span className="mt-2 w-6 shrink-0 text-sm font-semibold text-slate-400">{i + 1}</span>
                <div className="min-w-0 flex-1 space-y-2">
                  <input
                    aria-label="Model"
                    value={d.model}
                    onChange={(e) => onChange(d.id, { model: e.target.value.toUpperCase() })}
                    className={`${inputClass} font-mono font-semibold`}
                  />
                  <input
                    aria-label="Serial number"
                    value={d.serial}
                    onChange={(e) => onChange(d.id, { serial: e.target.value.toUpperCase() })}
                    className={`${inputClass} font-mono`}
                  />
                </div>
                <button
                  onClick={() => window.confirm('Delete this device?') && onDelete(d.id)}
                  aria-label="Delete device"
                  className="-mr-1 px-2 py-1 text-2xl leading-none text-slate-400 active:text-red-600"
                >
                  ×
                </button>
              </div>
              <div className="space-y-2 pl-8">
                <TypeSelect type={d.type} custom={d.typeCustom} onChange={(patch) => onChange(d.id, patch)} />
                <StatusButtons
                  status={d.status || 'unconfirmed'}
                  onChange={(status) => onChange(d.id, { status })}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          onClick={onExcel}
          disabled={!devices.length}
          className="rounded-xl bg-emerald-600 px-4 py-3.5 font-semibold text-white active:bg-emerald-700 disabled:opacity-40"
        >
          Download Excel
        </button>
        <button
          onClick={onPdf}
          disabled={!devices.length}
          className="rounded-xl bg-red-600 px-4 py-3.5 font-semibold text-white active:bg-red-700 disabled:opacity-40"
        >
          Download PDF
        </button>
      </div>
      {devices.length > 0 && (
        <button
          onClick={() => window.confirm('Delete all scanned devices?') && onClear()}
          className="mt-3 w-full py-2 text-sm text-slate-400 active:text-red-600"
        >
          Clear list
        </button>
      )}
    </section>
  )
}
