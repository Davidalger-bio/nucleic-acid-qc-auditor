import type { NormalizedSample } from '../parsers/types'
import type { QCResult } from '../qc/types'
import type { DetectedFormat } from '../parsers/types'
import { buildQCCsv, triggerDownload } from '../export/csvExport'
import { downloadPDF } from '../export/pdfExport'

interface ResultsTableProps {
  samples: NormalizedSample[]
  results: QCResult[]
  format: DetectedFormat
  filename: string
  onReset: () => void
}

export function ResultsTable({ samples, results, format, filename, onReset }: ResultsTableProps) {
  const isNanoDrop = format === 'nanodrop'
  const base = filename.replace(/\.csv$/i, '')

  function handleCSV() {
    const csv = buildQCCsv(samples, results)
    triggerDownload(csv, `${base}-qc-results.csv`, 'text/csv;charset=utf-8;')
  }

  function handlePDF() {
    downloadPDF(samples, results, filename)
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-2.5 border-b border-white/5 shrink-0"
        style={{ background: '#1a1d27' }}>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted font-mono">
            {filename}
          </span>
          <span className="text-xs px-1.5 py-0.5 rounded font-mono"
            style={{
              background: format === 'nanodrop' ? 'rgba(0,200,150,0.1)' : 'rgba(82,196,122,0.1)',
              color: format === 'nanodrop' ? '#00c896' : '#52c47a',
              border: `1px solid ${format === 'nanodrop' ? 'rgba(0,200,150,0.2)' : 'rgba(82,196,122,0.2)'}`,
            }}>
            {format === 'nanodrop' ? 'NanoDrop' : 'Qubit'}
          </span>
        </div>
        <div className="flex gap-2">
          <ExportBtn onClick={onReset} label="New file" icon="↑" />
          <ExportBtn onClick={handleCSV} label="CSV" icon="↓" accent />
          <ExportBtn onClick={handlePDF} label="PDF" icon="↓" accent />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="sticky top-0 z-10" style={{ background: '#1a1d27' }}>
              <Th>#</Th>
              <Th>Sample ID</Th>
              <Th>Name</Th>
              {isNanoDrop && <Th>Type</Th>}
              <Th>Conc. (ng/µL)</Th>
              {isNanoDrop && <><Th>260/280</Th><Th>260/230</Th></>}
              <Th>Status</Th>
              <Th>Low Yield</Th>
              <Th>Notes</Th>
            </tr>
          </thead>
          <tbody>
            {samples.map((s, i) => (
              <Row key={i} sample={s} result={results[i]} isNanoDrop={isNanoDrop} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Row({ sample, result, isNanoDrop }: {
  sample: NormalizedSample
  result: QCResult
  isNanoDrop: boolean
}) {
  return (
    <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
      <Td mono muted>{sample.rowIndex}</Td>
      <Td mono>{sample.sampleId}</Td>
      <Td muted>{sample.sampleName ?? ''}</Td>
      {isNanoDrop && <Td>{sample.naType ?? <span className="text-muted">—</span>}</Td>}
      <Td mono>{sample.concentration != null ? sample.concentration.toFixed(2) : <span className="text-muted">—</span>}</Td>
      {isNanoDrop && (
        <>
          <Td mono>
            <RatioCell value={sample.ratio260_280} status={result.ratio260_280Status} />
          </Td>
          <Td mono>
            <RatioCell value={sample.ratio260_230} status={result.ratio260_230Status} />
          </Td>
        </>
      )}
      <Td>
        <StatusBadge result={result} />
      </Td>
      <Td>
        {result.isLowYield && (
          <span className="text-xs font-semibold text-warn font-mono">LOW</span>
        )}
      </Td>
      <Td muted>
        {result.errors.length > 0 && (
          <span className="text-xs text-muted/60 font-mono truncate max-w-[180px] block"
            title={result.errors.join('\n')}>
            {result.errors[0]}{result.errors.length > 1 ? ` (+${result.errors.length - 1})` : ''}
          </span>
        )}
        {result.notes.length > 0 && (
          <span className="text-xs text-muted/50 font-mono block" title={result.notes.join('\n')}>
            {result.notes[0]}
          </span>
        )}
      </Td>
    </tr>
  )
}

function RatioCell({ value, status }: { value: number | null; status: 'PASS' | 'FAIL' | null }) {
  if (value == null) return <span className="text-muted">—</span>
  const color = status === 'FAIL' ? '#e05252' : status === 'PASS' ? '#52c47a' : '#e2e8f0'
  return <span style={{ color }}>{value.toFixed(3)}</span>
}

function StatusBadge({ result }: { result: QCResult }) {
  if (result.status === 'ERROR') {
    return (
      <div className="tooltip-container inline-block">
        <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded"
          style={{ background: 'rgba(224,160,82,0.12)', color: '#e0a052', border: '1px solid rgba(224,160,82,0.3)' }}>
          ERROR
        </span>
        {result.errors.length > 0 && (
          <div className="tooltip-box">{result.errors.join('\n')}</div>
        )}
      </div>
    )
  }

  const cfg = result.status === 'PASS'
    ? { bg: 'rgba(82,196,122,0.1)', color: '#52c47a', border: 'rgba(82,196,122,0.3)' }
    : { bg: 'rgba(224,82,82,0.1)', color: '#e05252', border: 'rgba(224,82,82,0.3)' }

  return (
    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
      {result.status}
    </span>
  )
}

function Th({ children }: { children?: React.ReactNode }) {
  return (
    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider border-b border-white/10 whitespace-nowrap"
      style={{ color: '#00c896' }}>
      {children}
    </th>
  )
}

function Td({ children, mono, muted }: { children?: React.ReactNode; mono?: boolean; muted?: boolean }) {
  return (
    <td className={`px-3 py-2 ${mono ? 'font-mono' : ''} ${muted ? 'text-muted' : 'text-body'} text-sm`}>
      {children}
    </td>
  )
}

function ExportBtn({ onClick, label, icon, accent }: {
  onClick: () => void
  label: string
  icon: string
  accent?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded border transition-colors ${
        accent
          ? 'border-accent/30 text-accent hover:bg-accent/10'
          : 'border-white/10 text-muted hover:text-body hover:border-white/20'
      }`}>
      <span className="font-mono">{icon}</span>
      {label}
    </button>
  )
}
