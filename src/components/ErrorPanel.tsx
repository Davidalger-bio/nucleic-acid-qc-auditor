interface ErrorPanelProps {
  error: string
  filename: string
  onReset: () => void
}

export function ErrorPanel({ error, filename, onReset }: ErrorPanelProps) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-16">
      <div className="w-full max-w-lg">
        <div className="rounded-xl border border-fail/30 overflow-hidden"
          style={{ background: 'rgba(224,82,82,0.05)' }}>
          <div className="flex items-center gap-3 px-5 py-4 border-b border-fail/20"
            style={{ background: 'rgba(224,82,82,0.08)' }}>
            <span className="text-fail text-xl">✕</span>
            <div>
              <p className="text-fail font-semibold text-sm">File could not be processed</p>
              <p className="text-fail/60 text-xs mt-0.5 font-mono">{filename}</p>
            </div>
          </div>
          <div className="px-5 py-4">
            <p className="text-body/80 text-sm leading-relaxed">{error}</p>
          </div>
        </div>

        <div className="mt-5 flex gap-3 justify-center">
          <button
            onClick={onReset}
            className="px-5 py-2.5 text-sm font-medium rounded-lg border border-white/10 hover:border-accent/30 text-body hover:text-accent transition-colors">
            ← Try a different file
          </button>
        </div>
      </div>
    </div>
  )
}
