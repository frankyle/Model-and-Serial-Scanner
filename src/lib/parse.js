// Pulls the model number and serial number out of raw OCR text from a Hikvision sticker.
//
// Typical sticker lines:
//   Model: DS-2CE10DF0T-LPFS   3.6mm
//   SN: AF7903760   08/2023
//   SN: 30122828685                       (routers also carry IMEI + MAC lines)

const MODEL_RE = /\b(i?DS-[A-Z0-9][A-Z0-9\-/.]{3,})/i

function cleanToken(t) {
  return t.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, '')
}

export function parseSticker(rawText) {
  const text = (rawText || '').replace(/\r/g, '')
  const flat = text
    .replace(/[ \t]+/g, ' ')
    .replace(/-\s+(?=[A-Za-z0-9])/g, '-') // "DS- 2CE10" -> "DS-2CE10"
    .replace(/\b[D0O][S5]-(?=[A-Z0-9])/g, 'DS-') // "0S-2CE1" -> "DS-2CE1"

  // ---- Model -----------------------------------------------------------
  let model = ''
  const labelled = flat.match(/Model\s*(?:No\.?|Number)?\s*[:;.\-]?\s*\n?\s*([A-Z0-9][A-Z0-9\-/.]{3,})/i)
  if (labelled) model = cleanToken(labelled[1])
  // A real Hikvision model almost always starts with DS- / iDS-, so prefer that match anywhere
  const dsMatch = flat.match(MODEL_RE)
  if (dsMatch && (!model || !/^i?DS-/i.test(model))) model = cleanToken(dsMatch[1])
  model = model.toUpperCase().replace(/^IDS-/, 'iDS-')

  // ---- Serial ----------------------------------------------------------
  let serial = ''
  const snPatterns = [
    /\b(?:S\s?\/?\s?N|5N)\b\s*[:;.]\s*\n?\s*([A-Z0-9]{6,})/i,
    /\bS\s?\/?\s?N\b\s*[:;.\-]?\s*\n?\s*([A-Z0-9]{6,})/i,
    /\bSerial\s*(?:No\.?|Number)?\s*[:;.\-]?\s*\n?\s*([A-Z0-9]{6,})/i,
  ]
  for (const re of snPatterns) {
    const m = flat.match(re)
    if (m) {
      serial = cleanToken(m[1]).toUpperCase()
      break
    }
  }

  // Some bigger devices print model + date + serial as one long string
  // (e.g. DS-2CD2143G0-I20200101AAWRD12345678). Keep it as read.
  return { model, serial }
}
