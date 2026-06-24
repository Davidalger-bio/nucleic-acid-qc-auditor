import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { NormalizedSample } from '../parsers/types'
import type { QCResult } from '../qc/types'

const DISCLAIMER =
  'This tool is for research support only. It is not a clinical or compliance-certified device. ' +
  'All outputs must be independently verified by qualified personnel before use in any regulated context.'

const C = {
  bg: [15, 17, 23] as [number, number, number],
  surface: [26, 29, 39] as [number, number, number],
  accent: [0, 200, 150] as [number, number, number],
  text: [226, 232, 240] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  pass: [82, 196, 122] as [number, number, number],
  fail: [224, 82, 82] as [number, number, number],
  warn: [224, 160, 82] as [number, number, number],
}

export function downloadPDF(
  samples: NormalizedSample[],
  results: QCResult[],
  originalFilename: string,
): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()

  const pass = results.filter(r => r.status === 'PASS').length
  const fail = results.filter(r => r.status === 'FAIL').length
  const lowYield = results.filter(r => r.isLowYield).length
  const errors = results.filter(r => r.status === 'ERROR').length

  // Background
  doc.setFillColor(...C.bg)
  doc.rect(0, 0, W, H, 'F')

  // Header bar
  doc.setFillColor(...C.surface)
  doc.rect(0, 0, W, 42, 'F')

  // App name
  doc.setTextColor(...C.accent)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('Nucleic Acid QC Auditor', 10, 11)

  // File + timestamp
  doc.setTextColor(...C.muted)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(`File: ${originalFilename}`, 10, 18)
  doc.text(`Generated: ${new Date().toLocaleString()}`, 10, 23)

  // Stats row
  const sy = 35
  const stats: [string, number, [number, number, number]][] = [
    [`Total: ${results.length}`, 10, C.text],
    [`Passed: ${pass}`, 55, C.pass],
    [`Failed: ${fail}`, 100, C.fail],
    [`Low Yield: ${lowYield}`, 148, C.warn],
    [`Errors: ${errors}`, 205, C.muted],
  ]
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  for (const [label, x, color] of stats) {
    doc.setTextColor(...color)
    doc.text(label, x, sy)
  }

  // Results table
  const body = samples.map((s, i) => {
    const r = results[i]
    return [
      s.sampleId,
      s.sampleName ?? '',
      s.source === 'nanodrop' ? 'NanoDrop' : 'Qubit',
      s.naType ?? '',
      s.concentration != null ? s.concentration.toFixed(2) : '',
      s.ratio260_280 != null ? s.ratio260_280.toFixed(3) : '',
      s.ratio260_230 != null ? s.ratio260_230.toFixed(3) : '',
      r.status,
      r.isLowYield ? 'YES' : '',
      r.errors.join('; '),
    ]
  })

  autoTable(doc, {
    startY: 46,
    head: [['Sample ID', 'Name', 'Source', 'Type', 'Conc.', '260/280', '260/230', 'Status', 'Low Yield', 'Notes']],
    body,
    theme: 'plain',
    styles: {
      fontSize: 7,
      textColor: C.text,
      fillColor: C.bg,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: C.surface,
      textColor: C.accent,
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: [18, 20, 28] as [number, number, number] },
    didParseCell(data) {
      if (data.section === 'body' && data.column.index === 7) {
        const v = String(data.cell.raw)
        if (v === 'PASS') data.cell.styles.textColor = C.pass
        else if (v === 'FAIL') data.cell.styles.textColor = C.fail
        else if (v === 'ERROR') data.cell.styles.textColor = C.warn
      }
    },
    margin: { left: 10, right: 10 },
  })

  // Footer on every page
  const pageCount = doc.getNumberOfPages()
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p)
    doc.setFillColor(...C.surface)
    doc.rect(0, H - 10, W, 10, 'F')
    doc.setTextColor(...C.muted)
    doc.setFontSize(5.5)
    doc.setFont('helvetica', 'normal')
    doc.text(DISCLAIMER, 10, H - 3.5)
    doc.text(`Page ${p} of ${pageCount}`, W - 20, H - 3.5)
  }

  const base = originalFilename.replace(/\.csv$/i, '')
  doc.save(`${base}-qc-report.pdf`)
}
