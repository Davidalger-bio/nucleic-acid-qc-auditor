interface DisclaimerBannerProps {
  onDismiss: () => void
}

export function DisclaimerBanner({ onDismiss }: DisclaimerBannerProps) {
  return (
    <div className="flex items-start gap-3 px-6 py-2.5 text-sm border-b border-warn/20"
      style={{ background: 'rgba(224,160,82,0.07)' }}>
      <span className="text-warn mt-0.5 shrink-0">⚠</span>
      <p className="text-warn/80 flex-1 leading-relaxed">
        <strong className="text-warn">Research use only.</strong>{' '}
        This tool is not a clinical or compliance-certified device.
        All outputs must be independently verified by qualified personnel before use in any regulated context.
      </p>
      <button
        onClick={onDismiss}
        className="text-warn/50 hover:text-warn shrink-0 ml-2 transition-colors text-base leading-none"
        aria-label="Dismiss disclaimer"
      >
        ✕
      </button>
    </div>
  )
}
