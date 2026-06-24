export type SampleStatus = 'PASS' | 'FAIL' | 'ERROR'

export interface QCResult {
  sampleId: string
  rowIndex: number
  status: SampleStatus
  isLowYield: boolean
  ratio260_280Status: 'PASS' | 'FAIL' | null
  ratio260_230Status: 'PASS' | 'FAIL' | null
  errors: string[]   // parse-time problems → routes to ERROR status
  notes: string[]    // QC-time informational messages → shown in Notes column
}
