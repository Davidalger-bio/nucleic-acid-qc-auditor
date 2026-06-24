import Papa from 'papaparse'
import type { NormalizedSample, ParseResult } from './types'

const OUT_OF_RANGE = new Set(['out of range', 'too low', 'too high'])

function parseConc(val: string | undefined): {
  value: number | null
  outOfRange: boolean
  error: string | null
} {
  if (!val || val.trim() === '') return { value: null, outOfRange: false, error: 'Missing value' }
  const lower = val.trim().toLowerCase()
  if (OUT_OF_RANGE.has(lower)) return { value: null, outOfRange: true, error: null }
  const n = parseFloat(val)
  if (isNaN(n)) return { value: null, outOfRange: false, error: `Non-numeric value: "${val}"` }
  return { value: n, outOfRange: false, error: null }
}

export function detectQubit(headers: string[]): boolean {
  const lower = headers.map(h => h.toLowerCase().trim())
  return lower.includes('qubit tube conc.') || lower.includes('original sample conc.')
}

export function parseQubit(csvText: string): ParseResult {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  })

  if (parsed.data.length === 0) {
    const msg = parsed.errors.length > 0
      ? `CSV parse error: ${parsed.errors[0].message}`
      : 'File has no data rows.'
    return { format: 'qubit', samples: [], fileError: msg, requiresNATypeModal: false }
  }

  const headers = parsed.meta.fields ?? []
  const lower = (h: string) => h.toLowerCase().trim()

  const sampleIdCol = headers.find(h => lower(h) === 'sample id') ?? null
  const tubeConcCol = headers.find(h => lower(h) === 'qubit tube conc.') ?? null
  const origConcCol = headers.find(h => lower(h) === 'original sample conc.') ?? null
  const concCol = tubeConcCol ?? origConcCol

  if (!sampleIdCol) {
    return { format: 'qubit', samples: [], fileError: 'Missing required column: "Sample ID".', requiresNATypeModal: false }
  }
  if (!concCol) {
    return { format: 'qubit', samples: [], fileError: 'Missing required concentration column ("Qubit tube conc." or "Original sample conc.").', requiresNATypeModal: false }
  }

  const idTracker = new Map<string, number[]>()

  const samples: NormalizedSample[] = parsed.data.map((row, i) => {
    const rowIndex = i + 2
    const errors: string[] = []

    const sampleId = (row[sampleIdCol] ?? '').trim()
    if (!sampleId) errors.push('Missing Sample ID')

    const concResult = parseConc(row[concCol])
    if (concResult.error) errors.push(`Concentration: ${concResult.error}`)
    if (concResult.outOfRange) errors.push('Concentration is out of instrument range (TOO LOW / TOO HIGH / Out of range) — sample cannot be evaluated')

    const id = sampleId || `[row ${rowIndex}]`
    if (sampleId) {
      if (!idTracker.has(sampleId)) idTracker.set(sampleId, [])
      idTracker.get(sampleId)!.push(rowIndex)
    }

    return {
      sampleId: id,
      sampleName: null,
      concentration: concResult.value,
      ratio260_280: null,
      ratio260_230: null,
      naType: null,
      source: 'qubit',
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

  return { format: 'qubit', samples, fileError: null, requiresNATypeModal: false }
}
