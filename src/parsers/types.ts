export interface NormalizedSample {
  sampleId: string
  sampleName: string | null
  concentration: number | null   // ng/µL
  ratio260_280: number | null    // NanoDrop only
  ratio260_230: number | null    // NanoDrop only
  naType: 'DNA' | 'RNA' | null   // resolved per-row or from batch modal
  source: 'nanodrop' | 'qubit'
  rawRow: Record<string, string>
  rowIndex: number
  errors: string[]
}

export type DetectedFormat = 'nanodrop' | 'qubit' | 'unknown'

export interface ParseResult {
  format: DetectedFormat
  samples: NormalizedSample[]
  fileError: string | null
  requiresNATypeModal: boolean   // true when NanoDrop file has no type column
}
