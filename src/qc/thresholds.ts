export interface ThresholdConfig {
  nanodrop: {
    ratio260_280DNA: number
    ratio260_280RNA: number
    ratio260_230: number
    lowYieldConc: number
  }
  qubit: {
    minConc: number
  }
}

export const DEFAULT_THRESHOLDS: ThresholdConfig = {
  nanodrop: {
    ratio260_280DNA: 1.7,
    ratio260_280RNA: 1.9,
    ratio260_230: 1.5,
    lowYieldConc: 10,
  },
  qubit: {
    minConc: 1,
  },
}
