import { useState } from 'react'

interface NATypeModalProps {
  sampleCount: number
  onSelect: (naType: 'DNA' | 'RNA') => void
  onCancel: () => void
}

export function NATypeModal({ sampleCount, onSelect, onCancel }: NATypeModalProps) {
  const [selected, setSelected] = useState<'DNA' | 'RNA' | null>(null)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-sm rounded-xl border border-white/10 p-6"
        style={{ background: '#1a1d27' }}>

        <div className="flex items-center gap-3 mb-1">
          <span className="text-accent text-xl font-mono">N/A</span>
          <h2 className="text-body font-semibold">Select nucleic acid type</h2>
        </div>
        <p className="text-sm text-muted mb-5 ml-10">
          No nucleic acid type column found. Select one type to apply to all {sampleCount} sample{sampleCount !== 1 ? 's' : ''} in this file.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {(['DNA', 'RNA'] as const).map(type => (
            <button
              key={type}
              onClick={() => setSelected(type)}
              className={`py-4 rounded-lg border font-mono font-medium text-lg transition-all ${
                selected === type
                  ? 'border-accent bg-accent/10 text-accent glow-accent'
                  : 'border-white/10 text-muted hover:border-white/20 hover:text-body'
              }`}>
              {type}
            </button>
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
            Apply {selected ?? ''}
          </button>
        </div>
      </div>
    </div>
  )
}
