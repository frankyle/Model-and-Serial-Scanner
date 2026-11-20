import { useEffect, useRef, useState } from 'react'
import { prepareCanvas, readSticker } from '../lib/ocr.js'
import { detectBarcodes, pickSerial } from '../lib/barcode.js'

// The guide frame drawn over the camera view (fractions of the preview box)
const GUIDE = { x: 0.04, y: 0.22, w: 0.92, h: 0.56 }

const STATUS_LABEL = {
  'loading tesseract core': 'Loading OCR engine…',
  'initializing tesseract': 'Starting OCR engine…',
  'loading language traineddata': 'Downloading language data (first time only)…',
  'initializing api': 'Starting OCR engine…',
  'recognizing text': 'Reading sticker…',
}

const btnPrimary =
  'rounded-xl bg-red-600 px-4 py-3.5 font-semibold text-white active:bg-red-700 disabled:opacity-50'
const btnSecondary =
  'rounded-xl bg-slate-200 px-4 py-3.5 font-semibold text-slate-700 active:bg-slate-300 disabled:opacity-50'

export default function Scanner({ onResult }) {
  const videoRef = useRef(null)
  const boxRef = useRef(null)
  const streamRef = useRef(null)
  const photoRef = useRef(null)
  const galleryRef = useRef(null)
  const [cameraOn, setCameraOn] = useState(false)
  const [torchAvailable, setTorchAvailable] = useState(false)
  const [torchOn, setTorchOn] = useState(false)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  useEffect(() => () => stopCamera(), [])

  async function startCamera() {
    setError('')
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Live scan needs HTTPS. Open the app from its https:// link, or use "Take photo" below.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 2560 }, height: { ideal: 1440 } },
        audio: false,
      })
      streamRef.current = stream
      setCameraOn(true)

      // Phone extras: keep autofocus running and offer the flash if the camera has one
      const track = stream.getVideoTracks()[0]
      const caps = track.getCapabilities?.() || {}
      setTorchAvailable(!!caps.torch)
      if (caps.focusMode?.includes('continuous')) {
        track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] }).catch(() => {})
      }

      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(() => {})
        }
      })
    } catch (e) {
      setError(`Could not open the camera: ${e.message || e.name}. Allow camera permission for this site and try again.`)
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setCameraOn(false)
    setTorchOn(false)
    setTorchAvailable(false)
  }

  async function toggleTorch() {
    const track = streamRef.current?.getVideoTracks()[0]
    if (!track) return
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn }] })
      setTorchOn(!torchOn)
    } catch {
      setTorchAvailable(false)
    }
  }

  // Cut out the part of the video frame that sits inside the on-screen guide box
  function snapshotGuide() {
    const video = videoRef.current
    const box = boxRef.current
    if (!video || !video.videoWidth) return null
    const cw = box.clientWidth
    const ch = box.clientHeight
    const vw = video.videoWidth
    const vh = video.videoHeight
    const scale = Math.max(cw / vw, ch / vh)
    const offX = (vw * scale - cw) / 2
    const offY = (vh * scale - ch) / 2
    const sx = (cw * GUIDE.x + offX) / scale
    const sy = (ch * GUIDE.y + offY) / scale
    const sw = (cw * GUIDE.w) / scale
    const sh = (ch * GUIDE.h) / scale
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(sw)
    canvas.height = Math.round(sh)
    canvas.getContext('2d').drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)
    return canvas
  }

  async function process(rawCanvas) {
    setBusy(true)
    setError('')
    setStatus('Reading sticker…')
    try {
      const codes = await detectBarcodes(rawCanvas)
      const prepared = prepareCanvas(rawCanvas)
      const ocr = await readSticker(prepared, (s, p) => {
        const label = STATUS_LABEL[s]
        if (label) setStatus(s === 'recognizing text' ? `${label} ${Math.round((p || 0) * 100)}%` : label)
      })
      const { serial, source } = pickSerial(ocr.serial, codes)

      const thumb = document.createElement('canvas')
      const t = Math.min(1, 640 / rawCanvas.width)
      thumb.width = Math.round(rawCanvas.width * t)
      thumb.height = Math.round(rawCanvas.height * t)
      thumb.getContext('2d').drawImage(rawCanvas, 0, 0, thumb.width, thumb.height)

      onResult({
        model: ocr.model,
        serial,
        serialSource: source,
        thumb: thumb.toDataURL('image/jpeg', 0.7),
      })
    } catch (e) {
      setError(`Scan failed: ${e.message || e}. Check your internet connection (needed the first time) and try again.`)
    } finally {
      setBusy(false)
      setStatus('')
    }
  }

  function capture() {
    const canvas = snapshotGuide()
    if (canvas) process(canvas)
  }

  function onFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const maxSide = 3200
      const k = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.naturalWidth * k)
      canvas.height = Math.round(img.naturalHeight * k)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      process(canvas)
    }
    img.onerror = () => setError('Could not open that image.')
    img.src = url
  }

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">1. Scan a sticker</h2>

      {cameraOn ? (
        <div ref={boxRef} className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-black sm:aspect-[4/3]">
          <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
          <div
            className="pointer-events-none absolute rounded-lg border-2 border-red-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]"
            style={{
              left: `${GUIDE.x * 100}%`,
              top: `${GUIDE.y * 100}%`,
              width: `${GUIDE.w * 100}%`,
              height: `${GUIDE.h * 100}%`,
            }}
          />
          <p className="pointer-events-none absolute inset-x-0 top-2 px-2 text-center text-xs font-medium text-white">
            Fill the red frame with the sticker (Model + SN lines), hold steady
          </p>
          {torchAvailable && (
            <button
              onClick={toggleTorch}
              className={`absolute right-2 bottom-2 rounded-full px-3 py-2 text-xs font-semibold ${
                torchOn ? 'bg-yellow-400 text-black' : 'bg-black/60 text-white'
              }`}
            >
              {torchOn ? 'Flash on' : 'Flash'}
            </button>
          )}
          {busy && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 px-4 text-center text-sm font-medium text-white">
              {status}
            </div>
          )}
        </div>
      ) : (
        <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 text-center text-sm text-slate-500">
          {busy ? status : 'Tap "Start live scan" and point the phone at the sticker.'}
        </div>
      )}

      {cameraOn ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button onClick={capture} disabled={busy} className={btnPrimary}>
            {busy ? 'Reading…' : 'Scan sticker'}
          </button>
          <button onClick={stopCamera} className={btnSecondary}>
            Stop camera
          </button>
        </div>
      ) : (
        <button onClick={startCamera} disabled={busy} className={`${btnPrimary} mt-3 w-full`}>
          Start live scan
        </button>
      )}

      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          onClick={() => photoRef.current?.click()}
          disabled={busy}
          className="rounded-xl bg-slate-100 px-3 py-3 text-sm font-medium text-slate-700 active:bg-slate-200 disabled:opacity-50"
        >
          Take photo
        </button>
        <button
          onClick={() => galleryRef.current?.click()}
          disabled={busy}
          className="rounded-xl bg-slate-100 px-3 py-3 text-sm font-medium text-slate-700 active:bg-slate-200 disabled:opacity-50"
        >
          From gallery
        </button>
      </div>
      {/* "Take photo" opens the phone's own camera app; "From gallery" lets you pick an existing picture */}
      <input ref={photoRef} type="file" accept="image/*" capture="environment" onChange={onFile} className="hidden" />
      <input ref={galleryRef} type="file" accept="image/*" onChange={onFile} className="hidden" />

      {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    </section>
  )
}
