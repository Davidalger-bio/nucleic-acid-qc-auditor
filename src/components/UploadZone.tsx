import { useRef, useState, useCallback } from 'react'

interface UploadZoneProps {
  onFile: (file: File) => void
}

export function UploadZone({ onFile }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  function validate(file: File): boolean {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setLocalError(`"${file.name}" is not a CSV file. Please upload a file with a .csv extension.`)
      return false
    }
    setLocalError(null)
    return true
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && validate(file)) onFile(file)
  }, [onFile])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file && validate(file)) onFile(file)
    e.target.value = ''
  }

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-16">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`
          w-full max-w-lg border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
          transition-all duration-200 select-none
          ${dragging
            ? 'border-accent bg-accent/5 glow-accent'
            : 'border-white/10 hover:border-accent/40 hover:bg-white/[0.02]'}
        `}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,200,150,0.08)', border: '1px solid rgba(0,200,150,0.2)' }}>
            <UploadIcon />
          </div>
          <div>
            <p className="text-body font-medium mb-1">
              Drop a CSV file here, or{' '}
              <span className="text-accent underline underline-offset-2">click to browse</span>
            </p>
            <p className="text-xs text-muted">
              Accepts NanoDrop 1000/2000 and Qubit 4 CSV exports
            </p>
          </div>
        </div>
      </div>

      {localError && (
        <div className="mt-4 max-w-lg w-full rounded-lg border border-fail/30 px-4 py-3 text-sm text-fail"
          style={{ background: 'rgba(224,82,82,0.08)' }}>
          {localError}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleChange}
      />

      <div className="mt-8 text-xs text-muted max-w-md text-center leading-relaxed">
        <p>Format is auto-detected from column headers.</p>
        <p className="mt-1">All processing runs locally in your browser — no data is uploaded anywhere.</p>
      </div>
    </div>
  )
}

function UploadIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00c896" strokeWidth="1.5">
      <path d="M12 15V3m0 0-4 4m4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2 17v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2" strokeLinecap="round"/>
    </svg>
  )
}
