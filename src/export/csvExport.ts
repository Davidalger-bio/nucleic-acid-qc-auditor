import type { NormalizedSample } from '../parsers/types'
import type { QCResult } from '../qc/types'

function esc(val: string | number | null | undefined): string {
  const s = val == null ? '' : String(val)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export function buildQCCsv(samples: NormalizedSample[], results: QCResult[]): string {
  if (samples.length === 0) return ''

  const originalHeaders = Object.keys(samples[0].rawRow)
  const qcHeaders = ['qc_status', 'low_yield', 'ratio_260_280_status', 'ratio_260_230_status', 'qc_notes']
  const allHeaders = [...originalHeaders, ...qcHeaders].map(esc).join(',')

  const rows = samples.map((sample, i) => {
    const r = results[i]
    const orig = originalHeaders.map(h => esc(sample.rawRow[h]))
    const qc = [
      esc(r.status),
      esc(r.isLowYield ? 'YES' : 'NO'),
      esc(r.ratio260_280Status ?? ''),
      esc(r.ratio260_230Status ?? ''),
      esc([...r.errors, ...r.notes].join('; ')),
    ]
    return [...orig, ...qc].join(',')
  })

  return [allHeaders, ...rows].join('\n')
}

export function triggerDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
