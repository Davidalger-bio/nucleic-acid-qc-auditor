import { useState } from 'react'
import type { DetectedFormat } from '../parsers/types'

interface FormatSelectorProps {
  onSelect: (format: 'nanodrop' | 'qubit') => void
  onCancel: () => void
}

export function FormatSelector({ onSelect, onCancel }: FormatSelectorProps) {
  const [selected, setSelected] = useState<'nanodrop' | 'qubit' | null>(null)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-xl border border-white/10 p-6"
        style={{ background: '#1a1d27' }}>

        <div className="flex items-center gap-3 mb-1">
          <span className="text-warn text-xl">?</span>
          <h2 className="text-body font-semibold">Format not detected</h2>
        </div>
        <p className="text-sm text-muted mb-5 ml-8">
          Column headers don't match a known instrument format. Select the correct format to continue.
        </p>

        <div className="space-y-2 mb-6">
          {(['nanodrop', 'qubit'] as const).map(fmt => (
            <label key={fmt}
              className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                selected === fmt
                  ? 'border-accent bg-accent/5'
                  : 'border-white/10 hover:border-white/20'
              }`}>
              <input
                type="radio"
                name="format"
                value={fmt}
                checked={selected === fmt}
                onChange={() => setSelected(fmt)}
                className="mt-0.5 accent-[#00c896]"
              />
              <div>
                <div className="text-body text-sm font-medium">
                  {fmt === 'nanodrop' ? 'NanoDrop (1000/2000)' : 'Qubit 4'}
                </div>
                <div className="text-xs text-muted mt-0.5">
                  {fmt === 'nanodrop'
                    ? 'Expects: Sample ID, Nucleic acid conc., 260/280, 260/230'
                    : 'Expects: Sample ID, Qubit tube conc. or Original sample conc.'}
                </div>
              </div>
            </label>
          ))}
        </div>

        <div className="flex gap-2 justify-end">
          <button onClick={onCancel}
            className="px-4 py-2 text-sm text-muted hover:text-body border border-white/10 hover:border-white/20 rounded-lg transition-colors">
            Cancel
          </button>
          <button
            onClick={() => selected && onSelect(selected)}
            disabled={!selected}
            className="px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: selected ? '#00c896' : undefined, color: selected ? '#0f1117' : '#64748b' }}>
            Parse as {selected === 'nanodrop' ? 'NanoDrop' : selected === 'qubit' ? 'Qubit' : '…'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Keep the export type alias for any imports that use it
export type { DetectedFormat }
