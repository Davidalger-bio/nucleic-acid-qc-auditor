export interface AuditEntry {
  timestamp: string
  filename: string
  detectedFormat: string
  totalRows: number
  parsedRows: number
  qcFailRows: number
  lowYieldRows: number
  errorRows: number
  fileError: string | null
}

const entries: AuditEntry[] = []

export function appendEntry(entry: AuditEntry): void {
  entries.push(entry)
}

export function getEntries(): readonly AuditEntry[] {
  return entries
}

export function exportAsCSV(): string {
  const headers = [
    'timestamp', 'filename', 'detected_format',
    'total_rows', 'parsed_rows', 'qc_fail_rows',
    'low_yield_rows', 'error_rows', 'file_error',
  ]
  const q = (v: string | number | null) => {
    const s = v == null ? '' : String(v)
    return `"${s.replace(/"/g, '""')}"`
  }
  const rows = entries.map(e => [
    q(e.timestamp), q(e.filename), q(e.detectedFormat),
    e.totalRows, e.parsedRows, e.qcFailRows,
    e.lowYieldRows, e.errorRows, q(e.fileError),
  ].join(','))
  return [headers.join(','), ...rows].join('\n')
}
