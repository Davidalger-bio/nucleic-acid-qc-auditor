import Papa from 'papaparse'
import { detectQubit, parseQubit } from './qubit'
import { detectNanoDrop, parseNanoDrop } from './nanodrop'
import type { ParseResult, DetectedFormat } from './types'

export type { NormalizedSample, ParseResult, DetectedFormat } from './types'

export function detectFormat(csvText: string): DetectedFormat {
  const result = Papa.parse<Record<string, string>>(csvText, { header: true, preview: 1 })
  const headers = result.meta.fields ?? []
  if (detectQubit(headers)) return 'qubit'
  if (detectNanoDrop(headers)) return 'nanodrop'
  return 'unknown'
}

export function parseFile(csvText: string, forcedFormat?: DetectedFormat): ParseResult {
  const format = forcedFormat ?? detectFormat(csvText)

  if (format === 'unknown') {
    return {
      format: 'unknown',
      samples: [],
      fileError: null,
      requiresNATypeModal: false,
    }
  }

  return format === 'qubit' ? parseQubit(csvText) : parseNanoDrop(csvText)
}
