import { useEffect, useRef, useState } from 'react'
import { classifyModel } from '../lib/classify.js'
import { TypeSelect, StatusButtons, inputClass } from './Fields.jsx'

export default function ReviewCard({ pending, devices, onSave, onDiscard }) {
  const [model, setModel] = useState(pending.model || '')
  const [serial, setSerial] = useState(pending.serial || '')
  const [type, setType] = useState(classifyModel(pending.model))
  const [typeCustom, setTypeCustom] = useState('')
  const [typeTouched, setTypeTouched] = useState(false)
  const [status, setStatus] = useState('unconfirmed')
  const modelRef = useRef(null)
  const ref = useRef(null)

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    if (!pending.model || !pending.serial) modelRef.current?.focus()
  }, [])

  // Re-detect the type while the model is edited, until the user picks a type by hand
  function changeModel(v) {
    const m = v.toUpperCase()
    setModel(m)
    if (!typeTouched) setType(classifyModel(m))
  }

  const duplicate = serial && devices.some((d) => d.serial === serial.trim().toUpperCase())
  const canSave = model.trim() && serial.trim()
  const autoDetected = !typeTouched && type && type === classifyModel(model)

  function submit(e) {
    e.preventDefault()
    if (!canSave) return
    onSave({
      model: model.trim().toUpperCase(),
      serial: serial.trim().toUpperCase(),
      type,
      typeCustom,
      status,
    })
  }

  const missing = [!pending.model && 'model', !pending.serial && 'serial number'].filter(Boolean)

  return (
    <section ref={ref} className="scroll-mt-16 rounded-2xl bg-white p-4 shadow-sm ring-2 ring-red-500">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">2. Check and save</h2>

      {pending.thumb && (
        <img src={pending.thumb} alt="Scanned sticker" className="mb-3 max-h-44 w-full rounded-lg bg-slate-100 object-contain" />
      )}

      {missing.length > 0 && pending.thumb && (
        <p className="mb-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          Couldn't read the {missing.join(' or ')}. Type it in from the photo, or retake closer to the sticker.
        </p>
      )}

      <form onSubmit={submit} className="space-y-3">
        <label className="block">
          <span className="text-xs font-medium text-slate-500">Model</span>
          <input
            ref={modelRef}
            value={model}
            onChange={(e) => changeModel(e.target.value)}
            className={`${inputClass} mt-1 font-mono`}
            placeholder="DS-2CE10DF0T-LPFS"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
          />
        </label>

        <label className="block">
          <span className="flex items-center justify-between text-xs font-medium text-slate-500">
            Serial number
            {pending.serialSource === 'barcode' && <span className="text-emerald-600">from barcode</span>}
            {pending.serialSource === 'both' && <span className="text-emerald-600">OCR + barcode match ✓</span>}
          </span>
          <input
            value={serial}
            onChange={(e) => setSerial(e.target.value.toUpperCase())}
            className={`${inputClass} mt-1 font-mono`}
            placeholder="AF7903760"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
          />
        </label>

        <TypeSelect
          type={type}
          custom={typeCustom}
          autoBadge={autoDetected}
          onChange={(patch) => {
            if ('type' in patch) {
              setType(patch.type)
              setTypeTouched(true)
            }
            if ('typeCustom' in patch) setTypeCustom(patch.typeCustom)
          }}
        />

        <StatusButtons status={status} onChange={setStatus} />

        {duplicate && (
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">This serial number is already in the list.</p>
        )}

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="submit"
            disabled={!canSave}
            className="rounded-xl bg-emerald-600 px-4 py-3.5 font-semibold text-white active:bg-emerald-700 disabled:opacity-40"
          >
            Add to list
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className="rounded-xl bg-slate-200 px-4 py-3.5 font-semibold text-slate-700 active:bg-slate-300"
          >
            Discard
          </button>
        </div>
      </form>
    </section>
  )
}
