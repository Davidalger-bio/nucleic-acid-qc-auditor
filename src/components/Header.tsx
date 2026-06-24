import { getEntries, exportAsCSV } from '../audit/log'
import { triggerDownload } from '../export/csvExport'

interface HeaderProps {
  onSettings: () => void
  showResults: boolean
}

export function Header({ onSettings, showResults }: HeaderProps) {
  function handleDownloadLog() {
    const entries = getEntries()
    if (entries.length === 0) {
      alert('No files have been processed in this session yet.')
      return
    }
    triggerDownload(exportAsCSV(), 'qc-audit-log.csv', 'text/csv;charset=utf-8;')
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-6 border-b border-white/5"
      style={{ background: '#1a1d27' }}>
      <div className="flex items-center gap-3">
        <span className="text-lg font-semibold tracking-tight text-body">
          NA{' '}
          <span className="text-accent font-mono">QC</span>{' '}
          Auditor
        </span>
        <span className="hidden sm:inline text-xs text-muted border border-white/10 rounded px-2 py-0.5">
          Research Use Only
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleDownloadLog}
          className="flex items-center gap-1.5 text-xs text-muted hover:text-body border border-white/10 hover:border-white/20 rounded px-3 py-1.5 transition-colors"
          title="Download session audit log as CSV"
        >
          <DownloadIcon />
          Audit Log
        </button>

        {showResults && (
          <button
            onClick={onSettings}
            className="flex items-center gap-1.5 text-xs text-muted hover:text-accent border border-white/10 hover:border-accent/30 rounded px-3 py-1.5 transition-colors"
            title="Configure QC thresholds"
          >
            <SettingsIcon />
            Thresholds
          </button>
        )}
      </div>
    </header>
  )
}

function DownloadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 2v8m0 0-3-3m3 3 3-3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2 12v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-1" strokeLinecap="round"/>
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="2.5"/>
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.22 3.22l1.42 1.42M11.36 11.36l1.42 1.42M3.22 12.78l1.42-1.42M11.36 4.64l1.42-1.42" strokeLinecap="round"/>
    </svg>
  )
}
