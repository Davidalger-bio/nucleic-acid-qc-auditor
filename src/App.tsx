import { useState, useMemo, useCallback, useEffect } from 'react'
import { parseFile, detectFormat } from './parsers'
import type { NormalizedSample, ParseResult, DetectedFormat } from './parsers'
import { evaluateAll } from './qc/evaluate'
import { DEFAULT_THRESHOLDS } from './qc/thresholds'
import type { ThresholdConfig } from './qc/thresholds'
import type { QCResult } from './qc/types'
import { appendEntry } from './audit/log'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { DisclaimerBanner } from './components/DisclaimerBanner'
import { UploadZone } from './components/UploadZone'
import { FormatSelector } from './components/FormatSelector'
import { NATypeModal } from './components/NATypeModal'
import { SettingsPanel } from './components/SettingsPanel'
import { SummaryStatsBar } from './components/SummaryStatsBar'
import { ResultsTable } from './components/ResultsTable'
import { ErrorPanel } from './components/ErrorPanel'

// ── State machine ─────────────────────────────────────────────────────────────

type AppState =
  | { phase: 'idle' }
  | { phase: 'awaiting_format'; file: File; csvText: string }
  | { phase: 'awaiting_na_type'; file: File; parseResult: ParseResult }
  | { phase: 'results'; filename: string; samples: NormalizedSample[]; format: DetectedFormat }
  | { phase: 'file_error'; error: string; filename: string }

// ── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [appState, setAppState] = useState<AppState>({ phase: 'idle' })
  const [thresholds, setThresholds] = useState<ThresholdConfig>(DEFAULT_THRESHOLDS)
  const [showDisclaimer, setShowDisclaimer] = useState(true)
  const [showSettings, setShowSettings] = useState(false)

  // QC results are derived from samples + thresholds — auto-updates on threshold change
  const qcResults = useMemo<QCResult[]>(() => {
    if (appState.phase !== 'results') return []
    return evaluateAll(appState.samples, thresholds)
  }, [appState, thresholds])

  // Audit log: record when entering results or file_error
  useEffect(() => {
    if (appState.phase === 'results') {
      const results = evaluateAll(appState.samples, thresholds)
      appendEntry({
        timestamp: new Date().toISOString(),
        filename: appState.filename,
        detectedFormat: appState.format,
        totalRows: appState.samples.length,
        parsedRows: appState.samples.filter(s => s.errors.length === 0).length,
        qcFailRows: results.filter(r => r.status === 'FAIL').length,
        lowYieldRows: results.filter(r => r.isLowYield).length,
        errorRows: results.filter(r => r.status === 'ERROR').length,
        fileError: null,
      })
    } else if (appState.phase === 'file_error') {
      appendEntry({
        timestamp: new Date().toISOString(),
        filename: appState.filename,
        detectedFormat: 'unknown',
        totalRows: 0,
        parsedRows: 0,
        qcFailRows: 0,
        lowYieldRows: 0,
        errorRows: 0,
        fileError: appState.error,
      })
    }
  // We intentionally only log on phase transitions, not on threshold changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appState.phase])

  // ── File handling ───────────────────────────────────────────────────────────

  const handleFile = useCallback(async (file: File) => {
    const csvText = await file.text()
    const format = detectFormat(csvText)

    if (format === 'unknown') {
      setAppState({ phase: 'awaiting_format', file, csvText })
      return
    }

    processCSV(csvText, file, format)
  }, [])

  function processCSV(csvText: string, file: File, forcedFormat?: DetectedFormat) {
    const result = parseFile(csvText, forcedFormat)

    if (result.fileError) {
      setAppState({ phase: 'file_error', error: result.fileError, filename: file.name })
      return
    }

    if (result.requiresNATypeModal) {
      setAppState({ phase: 'awaiting_na_type', file, parseResult: result })
      return
    }

    setAppState({
      phase: 'results',
      filename: file.name,
      samples: result.samples,
      format: result.format,
    })
  }

  function handleFormatSelected(format: 'nanodrop' | 'qubit') {
    if (appState.phase !== 'awaiting_format') return
    processCSV(appState.csvText, appState.file, format)
  }

  function handleNATypeSelected(naType: 'DNA' | 'RNA') {
    if (appState.phase !== 'awaiting_na_type') return
    const { file, parseResult } = appState
    const samples = parseResult.samples.map(s => ({ ...s, naType }))
    setAppState({
      phase: 'results',
      filename: file.name,
      samples,
      format: parseResult.format,
    })
  }

  function handleReset() {
    setAppState({ phase: 'idle' })
    setShowSettings(false)
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const showResults = appState.phase === 'results'

  return (
    <div className="flex flex-col min-h-screen bg-bg">
      <Header onSettings={() => setShowSettings(true)} showResults={showResults} />

      {/* Push content below fixed header */}
      <div className="flex flex-col flex-1 pt-14">
        {showDisclaimer && (
          <DisclaimerBanner onDismiss={() => setShowDisclaimer(false)} />
        )}

        <main className="flex flex-col flex-1">
          {appState.phase === 'idle' && (
            <UploadZone onFile={handleFile} />
          )}

          {appState.phase === 'awaiting_format' && (
            // Show upload zone behind the modal
            <UploadZone onFile={handleFile} />
          )}

          {appState.phase === 'awaiting_na_type' && (
            <UploadZone onFile={handleFile} />
          )}

          {appState.phase === 'file_error' && (
            <ErrorPanel
              error={appState.error}
              filename={appState.filename}
              onReset={handleReset}
            />
          )}

          {appState.phase === 'results' && (
            <>
              <SummaryStatsBar results={qcResults} />
              <ResultsTable
                samples={appState.samples}
                results={qcResults}
                format={appState.format}
                filename={appState.filename}
                onReset={handleReset}
              />
            </>
          )}
        </main>

        <Footer />
      </div>

      {/* Modals */}
      {appState.phase === 'awaiting_format' && (
        <FormatSelector
          onSelect={handleFormatSelected}
          onCancel={handleReset}
        />
      )}

      {appState.phase === 'awaiting_na_type' && (
        <NATypeModal
          sampleCount={appState.parseResult.samples.length}
          onSelect={handleNATypeSelected}
          onCancel={handleReset}
        />
      )}

      {showSettings && appState.phase === 'results' && (
        <SettingsPanel
          thresholds={thresholds}
          onChange={setThresholds}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}
