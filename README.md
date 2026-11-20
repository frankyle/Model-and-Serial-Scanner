# Hikvision Sticker Scanner

React + Vite + Tailwind app. Point the camera at a Hikvision sticker (or upload a photo),
it reads the **Model** and **SN**, guesses the **device type** from the model (you can change it),
lets you mark each device **Working / Not working / Not confirmed yet**, and exports the list as **Excel** or **PDF**.

## Run

    yarn
    yarn dev        # open the Local URL (camera works on localhost)
    yarn build      # production build in dist/

## Use on a phone

Live camera needs HTTPS. Deploy `dist/` (Vercel / Netlify) and open the https link on the phone.
Without HTTPS, "Take / upload photo" still works.

## Notes

- OCR is Tesseract.js (in the browser). First scan downloads ~10 MB language data, then it is cached.
- Always glance at the confirm card: OCR can swap 0/O or 5/S. If the browser supports BarcodeDetector
  (Chrome / Edge / Android) the serial barcode is cross-checked automatically.
- List is saved in the browser (localStorage), so a refresh will not lose it.
