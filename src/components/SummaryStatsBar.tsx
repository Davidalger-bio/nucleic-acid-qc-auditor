import type { QCResult } from '../qc/types'

interface SummaryStatsBarProps {
  results: QCResult[]
}

export function SummaryStatsBar({ results }: SummaryStatsBarProps) {
  const total = results.length
  const pass = results.filter(r => r.status === 'PASS').length
  const fail = results.filter(r => r.status === 'FAIL').length
  const lowYield = results.filter(r => r.isLowYield).length
  const errors = results.filter(r => r.status === 'ERROR').length

  const errorRows = results.filter(r => r.status === 'ERROR')

  return (
    <div className="border-b border-white/5" style={{ background: '#1a1d27' }}>
      <div className="px-6 py-3 flex flex-wrap gap-6 items-center">
        <Stat label="Total" value={total} color="#e2e8f0" />
        <Stat label="Passed" value={pass} color="#52c47a" />
        <Stat label="Failed" value={fail} color="#e05252" />
        <Stat label="Low Yield" value={lowYield} color="#e0a052" />
        <Stat label="Errors" value={errors} color="#64748b" />
      </div>

      {errors > 0 && (
        <div className="px-6 pb-3">
          <p className="text-xs text-warn/80">
            {errors} row{errors !== 1 ? 's' : ''} could not be evaluated and {errors !== 1 ? 'are' : 'is'} shown with ERROR status below.
            {errorRows.length > 0 && (
              <> Hover the <span className="font-mono">ERROR</span> badge for details.</>
            )}
          </p>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-widest text-muted">{label}</span>
      <span className="text-2xl font-mono font-bold" style={{ color }}>{value}</span>
    </div>
  )
}
