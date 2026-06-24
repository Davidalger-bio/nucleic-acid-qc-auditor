import Papa from 'papaparse'
import type { NormalizedSample, ParseResult } from './types'

const NA_TYPE_COL_CANDIDATES = ['nucleic acid type', 'sample type', 'na type']

function toNum(val: string | undefined): { value: number | null; error: string | null } {
  if (!val || val.trim() === '') return { value: null, error: 'Missing value' }
  const n = parseFloat(val)
  if (isNaN(n)) return { value: null, error: `Non-numeric value: "${val}"` }
  return { value: n, error: null }
}

export function detectNanoDrop(headers: string[]): boolean {
  const lower = headers.map(h => h.toLowerCase().trim())
  return lower.includes('260/280') && lower.includes('260/230')
}

export function parseNanoDrop(csvText: string): ParseResult {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  })

  if (parsed.data.length === 0) {
    const msg = parsed.errors.length > 0
      ? `CSV parse error: ${parsed.errors[0].message}`
      : 'File has no data rows.'
    return { format: 'nanodrop', samples: [], fileError: msg, requiresNATypeModal: false }
  }

  const headers = parsed.meta.fields ?? []
  const lower = (h: string) => h.toLowerCase().trim()

  const find = (key: string) => headers.find(h => lower(h) === key) ?? null

  const sampleIdCol = find('sample id')
  const sampleNameCol = find('sample name')
  const concCol = find('nucleic acid conc. (ng/ul)')
  const r280Col = find('260/280')
  const r230Col = find('260/230')

  const missing = [
    !sampleIdCol && 'Sample ID',
    !concCol && 'Nucleic acid conc. (ng/uL)',
    !r280Col && '260/280',
    !r230Col && '260/230',
  ].filter(Boolean) as string[]

  if (missing.length > 0) {
    return {
      format: 'nanodrop',
      samples: [],
      fileError: `Missing required column${missing.length > 1 ? 's' : ''}: ${missing.map(c => `"${c}"`).join(', ')}. Verify this is a valid NanoDrop export.`,
      requiresNATypeModal: false,
    }
  }

  const naTypeCol = NA_TYPE_COL_CANDIDATES
    .map(c => headers.find(h => lower(h) === c) ?? null)
    .find(Boolean) ?? null

  const idTracker = new Map<string, number[]>()

  const samples: NormalizedSample[] = parsed.data.map((row, i) => {
    const rowIndex = i + 2
    const errors: string[] = []

    const sampleId = (row[sampleIdCol!] ?? '').trim()
    if (!sampleId) errors.push('Missing Sample ID')

    const concResult = toNum(row[concCol!])
    if (concResult.error) errors.push(`Concentration: ${concResult.error}`)

    const r280Result = toNum(row[r280Col!])
    if (r280Result.error) errors.push(`260/280: ${r280Result.error}`)

    const r230Result = toNum(row[r230Col!])
    if (r230Result.error) errors.push(`260/230: ${r230Result.error}`)

    let naType: 'DNA' | 'RNA' | null = null
    if (naTypeCol) {
      const raw = (row[naTypeCol] ?? '').trim().toUpperCase()
      if (raw === 'DNA') naType = 'DNA'
      else if (raw === 'RNA') naType = 'RNA'
      else if (raw) errors.push(`Unrecognized nucleic acid type: "${row[naTypeCol]}"`)
    }

    const id = sampleId || `[row ${rowIndex}]`
    if (sampleId) {
      if (!idTracker.has(sampleId)) idTracker.set(sampleId, [])
      idTracker.get(sampleId)!.push(rowIndex)
    }

    return {
      sampleId: id,
      sampleName: sampleNameCol ? (row[sampleNameCol] ?? '').trim() || null : null,
      concentration: concResult.value,
      ratio260_280: r280Result.value,
      ratio260_230: r230Result.value,
      naType,
      source: 'nanodrop',
      rawRow: row,
      rowIndex,
      errors,
    }
  })

  // Flag duplicate Sample IDs
  for (const [id, rows] of idTracker.entries()) {
    if (rows.length > 1) {
      for (const s of samples) {
        if (s.sampleId === id) {
          const others = rows.filter(r => r !== s.rowIndex)
          s.errors.push(`Duplicate Sample ID — also appears at row${others.length > 1 ? 's' : ''} ${others.join(', ')}`)
        }
      }
    }
  }

  return { format: 'nanodrop', samples, fileError: null, requiresNATypeModal: naTypeCol === null }
}
