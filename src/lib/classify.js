// Works out what kind of device a Hikvision model number is, from its prefix.
// Anything not recognised comes back as '' so the user can pick the type by hand.

export const DEVICE_TYPES = [
  'IP Camera',
  'Analog (HD-TVI) Camera',
  'PTZ Camera',
  'Thermal Camera',
  'NVR',
  'DVR',
  'NVR / DVR',
  'Encoder / Decoder',
  'Access Control Terminal',
  'Card Reader',
  'Access Controller',
  'Turnstile / Barrier',
  'Intercom Indoor Station',
  'Intercom Door Station',
  'Alarm Panel',
  'Alarm Detector / Sensor',
  'Alarm Accessory',
  'Router',
  'Network Switch',
  'Wi-Fi Access Point / Bridge',
  'Monitor / Display',
  'Storage',
  'Accessory',
  'Other',
]

const RULES = [
  [/^DS-2(DE|DF|SE|PT|AE|DY)/, 'PTZ Camera'],
  [/^DS-2(TD|TP|TE)/, 'Thermal Camera'],
  [/^DS-2(CE|CC)/, 'Analog (HD-TVI) Camera'],
  [/^DS-2(CD|CV|XE|XS|CS|CT|DP|XM)/, 'IP Camera'],
  [/^DS-6\d{3}/, 'Encoder / Decoder'],
  [/^DS-[789]P?\d{2,4}N/, 'NVR'],
  [/^DS-[789]P?\d{2,4}[A-Z]?H/, 'DVR'],
  [/^DS-[789]/, 'NVR / DVR'],
  [/^DS-K1[TA]/, 'Access Control Terminal'],
  [/^DS-K1/, 'Card Reader'],
  [/^DS-K2/, 'Access Controller'],
  [/^DS-K3/, 'Turnstile / Barrier'],
  [/^DS-KH/, 'Intercom Indoor Station'],
  [/^DS-K[VDB]/, 'Intercom Door Station'],
  [/^DS-3WR/, 'Router'],
  [/^DS-3W(AP|F|B)/, 'Wi-Fi Access Point / Bridge'],
  [/^DS-3[ET]/, 'Network Switch'],
  [/^DS-PWA?/, 'Alarm Panel'],
  [/^DS-P[DMT]/, 'Alarm Detector / Sensor'],
  [/^DS-P[KSRE]/, 'Alarm Accessory'],
  [/^DS-D/, 'Monitor / Display'],
  [/^DS-A\d/, 'Storage'],
  [/^DS-1/, 'Accessory'],
  // HiLook range
  [/^IPC-/, 'IP Camera'],
  [/^THC-/, 'Analog (HD-TVI) Camera'],
  [/^NVR-/, 'NVR'],
  [/^DVR-/, 'DVR'],
]

export function classifyModel(model) {
  const m = (model || '').toUpperCase().replace(/^IDS-/, 'DS-').trim()
  if (!m) return ''
  for (const [re, type] of RULES) if (re.test(m)) return type
  return ''
}

export const STATUSES = [
  { id: 'working', label: 'Working', on: 'bg-emerald-600 text-white', chip: 'bg-emerald-100 text-emerald-700' },
  { id: 'not_working', label: 'Not working', on: 'bg-red-600 text-white', chip: 'bg-red-100 text-red-700' },
  { id: 'unconfirmed', label: 'Not confirmed yet', on: 'bg-amber-500 text-white', chip: 'bg-amber-100 text-amber-700' },
]

export const statusLabel = (id) => (STATUSES.find((s) => s.id === id) || STATUSES[2]).label

// What to show / export for a device's type (handles the free-text "Other")
export const typeLabel = (d) => (d.type === 'Other' ? d.typeCustom?.trim() || 'Other' : d.type || '')
