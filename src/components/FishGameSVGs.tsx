export function FishSVG({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 40" fill="none" className={className}>
      <path d="M8 20 C2 10 2 4 8 8 C2 14 2 26 8 32 C2 36 2 30 8 20Z" fill="#0369a1"/>
      <defs><linearGradient id="fbg" x1="12" y1="8" x2="60" y2="32"><stop stopColor="#38bdf8"/><stop offset="1" stopColor="#0284c7"/></linearGradient></defs>
      <ellipse cx="36" cy="20" rx="24" ry="12" fill="url(#fbg)"/>
      <ellipse cx="38" cy="24" rx="18" ry="7" fill="rgba(255,255,255,0.15)"/>
      <path d="M28 8 C30 0 44 0 46 8Z" fill="#0ea5e9" opacity="0.8"/>
      <circle cx="52" cy="16" r="5" fill="white"/>
      <circle cx="53" cy="16" r="3" fill="#1e3a5f"/>
      <circle cx="54" cy="15" r="1" fill="white" opacity="0.9"/>
      <path d="M60 18 Q63 20 60 22" stroke="#0369a1" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

export function TrophySVG({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <rect x="20" y="52" width="24" height="5" rx="2" fill="#b45309"/>
      <rect x="16" y="57" width="32" height="5" rx="2.5" fill="#92400e"/>
      <rect x="28" y="44" width="8" height="10" fill="#ca8a04"/>
      <defs><linearGradient id="tgg" x1="12" y1="8" x2="52" y2="48"><stop stopColor="#fde68a"/><stop offset="1" stopColor="#f59e0b"/></linearGradient></defs>
      <path d="M12 8 H52 V30 C52 42 44 48 32 48 C20 48 12 42 12 30 Z" fill="url(#tgg)"/>
      <path d="M12 12 C4 12 4 28 12 28" stroke="#f59e0b" strokeWidth="6" fill="none" strokeLinecap="round"/>
      <path d="M52 12 C60 12 60 28 52 28" stroke="#f59e0b" strokeWidth="6" fill="none" strokeLinecap="round"/>
      <path d="M24 24 L28 36 L32 28 L36 36 L40 24" stroke="#92400e" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
