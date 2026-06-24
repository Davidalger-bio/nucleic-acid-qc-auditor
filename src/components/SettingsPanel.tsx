import { useState } from 'react'
import type { ThresholdConfig } from '../qc/thresholds'
import { DEFAULT_THRESHOLDS } from '../qc/thresholds'

interface SettingsPanelProps {
  thresholds: ThresholdConfig
  onChange: (t: ThresholdConfig) => void
  onClose: () => void
}

export function SettingsPanel({ thresholds, onChange, onClose }: SettingsPanelProps) {
  const [local, setLocal] = useState<ThresholdConfig>(thresholds)

  function set(path: string, value: string) {
    const n = parseFloat(value)
    if (isNaN(n)) return
    const next = structuredClone(local) as ThresholdConfig
    if (path === 'nd.r280dna') next.nanodrop.ratio260_280DNA = n
    else if (path === 'nd.r280rna') next.nanodrop.ratio260_280RNA = n
    else if (path === 'nd.r230') next.nanodrop.ratio260_230 = n
    else if (path === 'nd.lowYield') next.nanodrop.lowYieldConc = n
    else if (path === 'qb.minConc') next.qubit.minConc = n
    setLocal(next)
    onChange(next)
  }

  function resetDefaults() {
    setLocal(DEFAULT_THRESHOLDS)
    onChange(DEFAULT_THRESHOLDS)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-xl border border-white/10 overflow-hidden"
        style={{ background: '#1a1d27' }}>

        {/* Panel header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div>
            <h2 className="text-body font-semibold">QC Thresholds</h2>
            <p className="text-xs text-muted mt-0.5">Changes apply immediately. Reset on page refresh.</p>
          </div>
          <button onClick={onClose}
            className="text-muted hover:text-body text-xl leading-none transition-colors">
            ✕
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* NanoDrop */}
          <section>
            <h3 className="text-xs font-semibold text-accent uppercase tracking-widest mb-3">NanoDrop</h3>
            <div className="space-y-3">
              <ThresholdField label="A260/280 minimum (DNA)" value={local.nanodrop.ratio260_280DNA}
                onChange={v => set('nd.r280dna', v)} step="0.01" />
              <ThresholdField label="A260/280 minimum (RNA)" value={local.nanodrop.ratio260_280RNA}
                onChange={v => set('nd.r280rna', v)} step="0.01" />
              <ThresholdField label="A260/230 minimum" value={local.nanodrop.ratio260_230}
                onChange={v => set('nd.r230', v)} step="0.01" />
              <ThresholdField label="Low Yield threshold (ng/µL)" value={local.nanodrop.lowYieldConc}
                onChange={v => set('nd.lowYield', v)} step="1" unit="ng/µL" />
            </div>
          </section>

          {/* Qubit */}
          <section>
            <h3 className="text-xs font-semibold text-accent uppercase tracking-widest mb-3">Qubit</h3>
            <ThresholdField label="Minimum concentration (ng/µL)" value={local.qubit.minConc}
              onChange={v => set('qb.minConc', v)} step="0.1" unit="ng/µL" />
          </section>
        </div>

        <div className="px-5 py-3 border-t border-white/5 flex justify-between items-center">
          <button onClick={resetDefaults}
            className="text-xs text-muted hover:text-body underline underline-offset-2 transition-colors">
            Reset to defaults
          </button>
          <button onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg text-bg"
            style={{ background: '#00c896' }}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

function ThresholdField({
  label, value, onChange, step, unit,
}: {
  label: string
  value: number
  onChange: (v: string) => void
  step: string
  unit?: string
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <label className="text-sm text-muted flex-1">{label}</label>
      <div className="flex items-center gap-1.5 shrink-0">
        <input
          type="number"
          defaultValue={value}
          key={value}
          step={step}
          min="0"
          onChange={e => onChange(e.target.value)}
          className="w-20 text-right font-mono text-sm rounded px-2 py-1 border border-white/10 bg-bg text-body focus:outline-none focus:border-accent/50"
        />
        {unit && <span className="text-xs text-muted w-10">{unit}</span>}
      </div>
    </div>
  )
}
