import { statusLabel, typeLabel } from './classify.js'

const stamp = () => new Date().toISOString().slice(0, 10)

const slug = (s) =>
  (s || 'devices').trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'devices'

const count = (devices, id) => devices.filter((d) => (d.status || 'unconfirmed') === id).length

export async function exportExcel(devices, site) {
  const XLSX = await import('xlsx')
  const rows = devices.map((d, i) => ({
    '#': i + 1,
    Model: d.model,
    'Serial Number': d.serial,
    'Device Type': typeLabel(d),
    Status: statusLabel(d.status),
    Scanned: new Date(d.scannedAt).toLocaleString(),
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [{ wch: 5 }, { wch: 26 }, { wch: 22 }, { wch: 28 }, { wch: 18 }, { wch: 22 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Devices')
  XLSX.writeFile(wb, `hikvision-${slug(site)}-${stamp()}.xlsx`)
}

export async function exportPdf(devices, site) {
  const [{ jsPDF }, atModule] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  // works whether the bundler exposes the plugin as default, nested default, or a named export
  const autoTable = [atModule.default, atModule.default?.default, atModule.autoTable].find((f) => typeof f === 'function')

  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  doc.setFontSize(16)
  doc.text('Hikvision Device List', 40, 46)
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(
    [site ? `Site: ${site}` : null, `Date: ${stamp()}`, `Total devices: ${devices.length}`].filter(Boolean).join('   |   '),
    40,
    63,
  )
  doc.text(
    `Working: ${count(devices, 'working')}   |   Not working: ${count(devices, 'not_working')}   |   Not confirmed yet: ${count(devices, 'unconfirmed')}`,
    40,
    78,
  )

  const statusColor = { working: [5, 150, 105], not_working: [220, 38, 38], unconfirmed: [217, 119, 6] }

  autoTable(doc, {
    startY: 92,
    head: [['#', 'Model', 'Serial Number', 'Device Type', 'Status', 'Date']],
    body: devices.map((d, i) => [
      i + 1,
      d.model,
      d.serial,
      typeLabel(d),
      statusLabel(d.status),
      new Date(d.scannedAt).toLocaleDateString(),
    ]),
    styles: { fontSize: 9, cellPadding: 5 },
    headStyles: { fillColor: [185, 28, 28] },
    columnStyles: { 0: { cellWidth: 24 }, 5: { cellWidth: 62 } },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 4) {
        const d = devices[data.row.index]
        data.cell.styles.textColor = statusColor[d.status || 'unconfirmed']
        data.cell.styles.fontStyle = 'bold'
      }
    },
  })
  doc.save(`hikvision-${slug(site)}-${stamp()}.pdf`)
}
