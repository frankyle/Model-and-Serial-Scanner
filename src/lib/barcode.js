// Uses the browser's built-in BarcodeDetector (Chrome / Edge / Android) when available.
// The Code128 barcode under "SN:" usually encodes the serial, which is more reliable than OCR.

export const barcodeSupported = typeof window !== 'undefined' && 'BarcodeDetector' in window

export async function detectBarcodes(canvas) {
  if (!barcodeSupported) return []
  try {
    const detector = new window.BarcodeDetector({ formats: ['code_128', 'code_39'] })
    const found = await detector.detect(canvas)
    return found.map((b) => (b.rawValue || '').trim().toUpperCase()).filter(Boolean)
  } catch {
    return []
  }
}

function distance(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
  return dp[a.length][b.length]
}

// Combine OCR serial + barcode values into the best serial guess.
export function pickSerial(ocrSerial, barcodes) {
  const codes = barcodes.filter((c) => /^[A-Z0-9]{6,40}$/.test(c))
  if (!codes.length) return { serial: ocrSerial, source: 'ocr' }
  if (!ocrSerial) return { serial: codes[0], source: 'barcode' }
  if (codes.includes(ocrSerial)) return { serial: ocrSerial, source: 'both' }
  // barcode that contains the OCR serial (long serials) or is a near match (OCR slip like O vs 0)
  const contains = codes.find((c) => c.includes(ocrSerial) || ocrSerial.includes(c))
  if (contains) return { serial: contains, source: 'barcode' }
  const near = codes.map((c) => ({ c, d: distance(c, ocrSerial) })).sort((x, y) => x.d - y.d)[0]
  if (near && near.d <= 2) return { serial: near.c, source: 'barcode' }
  return { serial: ocrSerial, source: 'ocr' }
}
