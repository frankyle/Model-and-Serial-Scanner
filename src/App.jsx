import { useEffect, useState } from 'react'
import Scanner from './components/Scanner.jsx'
import ReviewCard from './components/ReviewCard.jsx'
import DeviceList from './components/DeviceList.jsx'
import { exportExcel, exportPdf } from './lib/export.js'

const KEY = 'hik-sticker-scanner:v1'

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || { devices: [], site: '' }
  } catch {
    return { devices: [], site: '' }
  }
}

export default function App() {
  const [{ devices, site }, setData] = useState(load)
  const [pending, setPending] = useState(null)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ devices, site }))
    } catch {
      /* storage full or blocked – list still works for this session */
    }
  }, [devices, site])

  const setDevices = (fn) => setData((s) => ({ ...s, devices: fn(s.devices) }))

  function save(entry) {
    setDevices((list) => [
      ...list,
      { id: crypto.randomUUID?.() || String(Date.now()), ...entry, scannedAt: new Date().toISOString() },
    ])
    setPending(null)
  }

  return (
    <div className="mx-auto min-h-screen max-w-xl px-3 pb-12">
      <header className="sticky top-0 z-10 -mx-3 mb-4 bg-red-700 px-4 py-3 text-white shadow">
        <h1 className="text-lg font-bold leading-tight">Hikvision Sticker Scanner</h1>
        <p className="text-xs text-red-100">Scan model &amp; serial, set type and status, export to Excel or PDF</p>
      </header>

      <div className="space-y-4">
        <Scanner onResult={setPending} />

        {pending && (
          <ReviewCard
            key={pending.thumb || pending.manualId}
            pending={pending}
            devices={devices}
            onSave={save}
            onDiscard={() => setPending(null)}
          />
        )}

        <DeviceList
          devices={devices}
          site={site}
          onSite={(v) => setData((s) => ({ ...s, site: v }))}
          onChange={(id, patch) => setDevices((l) => l.map((d) => (d.id === id ? { ...d, ...patch } : d)))}
          onDelete={(id) => setDevices((l) => l.filter((d) => d.id !== id))}
          onClear={() => setDevices(() => [])}
          onExcel={() => exportExcel(devices, site)}
          onPdf={() => exportPdf(devices, site)}
          onAddManual={() => setPending({ model: '', serial: '', manualId: Date.now() })}
        />
      </div>
    </div>
  )
}
