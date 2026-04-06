interface LogoProps {
  size?: number;
  showText?: boolean;
}

export function Logo({ size = 32, showText = true }: LogoProps) {
  return (
    <div className="flex items-center gap-3">
      <svg
        width={size}
        height={size}
        viewBox="0 0 72 72"
        fill="none"
        role="img"
        aria-label="EdgeStat logo"
      >
        <rect width="72" height="72" rx="16" fill="#0A2540" />
        <polygon
          points="36,12 60,25 60,49 36,60 12,49 12,25"
          fill="none"
          stroke="#00D4AA"
          strokeWidth="1.5"
        />
        <line
          x1="36"
          y1="24"
          x2="36"
          y2="47"
          stroke="#00FFD1"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <line
          x1="26"
          y1="31"
          x2="26"
          y2="47"
          stroke="#00D4AA"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <line
          x1="46"
          y1="37"
          x2="46"
          y2="47"
          stroke="#00D4AA"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <line
          x1="18"
          y1="47"
          x2="54"
          y2="47"
          stroke="#1E4D44"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      {showText && (
        <div>
          <span className="font-mono text-lg font-bold text-edge-400 tracking-tight">edge</span>
          <span className="font-mono text-lg font-light text-edge-700 tracking-tight">stat</span>
        </div>
      )}
    </div>
  );
}
