import type { NormalizedSample } from '../parsers/types'
import type { ThresholdConfig } from './thresholds'
import type { QCResult } from './types'

export function evaluateSample(sample: NormalizedSample, thresholds: ThresholdConfig): QCResult {
  if (sample.errors.length > 0) {
    return {
      sampleId: sample.sampleId,
      rowIndex: sample.rowIndex,
      status: 'ERROR',
      isLowYield: false,
      ratio260_280Status: null,
      ratio260_230Status: null,
      errors: sample.errors,
      notes: [],
    }
  }

  if (sample.source === 'nanodrop') {
    const t = thresholds.nanodrop
    const minR280 = sample.naType === 'RNA' ? t.ratio260_280RNA : t.ratio260_280DNA

    const r280Status = sample.ratio260_280 !== null
      ? (sample.ratio260_280 >= minR280 ? 'PASS' : 'FAIL')
      : null

    const r230Status = sample.ratio260_230 !== null
      ? (sample.ratio260_230 >= t.ratio260_230 ? 'PASS' : 'FAIL')
      : null

    const isLowYield = sample.concentration !== null && sample.concentration < t.lowYieldConc

    const status: QCResult['status'] =
      r280Status === 'FAIL' || r230Status === 'FAIL' ? 'FAIL' : 'PASS'

    return {
      sampleId: sample.sampleId,
      rowIndex: sample.rowIndex,
      status,
      isLowYield,
      ratio260_280Status: r280Status as 'PASS' | 'FAIL' | null,
      ratio260_230Status: r230Status as 'PASS' | 'FAIL' | null,
      errors: [],
      notes: [],
    }
  }

  // Qubit
  const pass = sample.concentration !== null && sample.concentration >= thresholds.qubit.minConc
  const qubitNotes = !pass && sample.concentration !== null
    ? ['Below reliable detection floor']
    : []
  return {
    sampleId: sample.sampleId,
    rowIndex: sample.rowIndex,
    status: pass ? 'PASS' : 'FAIL',
    isLowYield: false,
    ratio260_280Status: null,
    ratio260_230Status: null,
    errors: [],
    notes: qubitNotes,
  }
}

export function evaluateAll(samples: NormalizedSample[], thresholds: ThresholdConfig): QCResult[] {
  return samples.map(s => evaluateSample(s, thresholds))
}
