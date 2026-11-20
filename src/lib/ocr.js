import { createWorker } from 'tesseract.js'
import { parseSticker } from './parse.js'

let workerPromise = null

function getWorker(onStatus) {
  if (!workerPromise) {
    workerPromise = createWorker('eng', 1, {
      logger: (m) => {
        if (m.status && onStatus) onStatus(m.status, m.progress)
      },
    })
  }
  return workerPromise
}

// Sticker text is small. Upscale, convert to grayscale and stretch the contrast
// (1st-99th percentile) so Tesseract sees crisp dark text on a light background.
export function prepareCanvas(source, targetWidth = 2400, maxScale = 3.5) {
  const sw = source.videoWidth || source.naturalWidth || source.width
  const sh = source.videoHeight || source.naturalHeight || source.height
  const scale = Math.min(maxScale, Math.max(1, targetWidth / sw))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(sw * scale)
  canvas.height = Math.round(sh * scale)
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.imageSmoothingQuality = 'high'
  ctx.filter = 'grayscale(1)'
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
  ctx.filter = 'none'

  const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const px = img.data
  const hist = new Uint32Array(256)
  for (let i = 0; i < px.length; i += 4) hist[px[i]]++
  const total = px.length / 4
  let acc = 0
  let lo = 0
  let hi = 255
  for (let v = 0; v < 256; v++) {
    acc += hist[v]
    if (acc >= total * 0.01) {
      lo = v
      break
    }
  }
  acc = 0
  for (let v = 255; v >= 0; v--) {
    acc += hist[v]
    if (acc >= total * 0.01) {
      hi = v
      break
    }
  }
  const range = Math.max(1, hi - lo)
  for (let i = 0; i < px.length; i += 4) {
    const v = Math.max(0, Math.min(255, ((px[i] - lo) * 255) / range))
    px[i] = px[i + 1] = px[i + 2] = v
  }
  ctx.putImageData(img, 0, 0)
  return canvas
}

// Page-segmentation modes tried in order. Mode 6 (one uniform block) reads sticker
// layouts best; 11 (sparse text) and 3 (auto) catch layouts where 6 misses a line.
const PASSES = ['6', '11', '3']

export async function readSticker(canvas, onStatus) {
  const worker = await getWorker(onStatus)
  let model = ''
  let serial = ''
  let text = ''

  for (const psm of PASSES) {
    await worker.setParameters({ tessedit_pageseg_mode: psm })
    const { data } = await worker.recognize(canvas)
    const parsed = parseSticker(data.text)
    text += `\n${data.text}`
    model = model || parsed.model
    serial = serial || parsed.serial
    if (model && serial) break
  }
  return { model, serial, text }
}
