import React from 'react';

const SVGS: Record<string, React.FC<{ size: number; color: string }>> = {
  '🐠': ({ size, color }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 24 C6 14 14 8 24 8 C34 8 42 14 42 24 C42 34 34 40 24 40 C14 40 6 34 6 24Z" />
      <path d="M6 24 C2 18 2 14 6 10 L6 24Z" />
      <path d="M6 24 C2 30 2 34 6 38 L6 24Z" />
      <circle cx="34" cy="18" r="2" fill={color} stroke="none" />
      <path d="M18 22 Q22 20 26 22 Q22 26 18 24Z" />
      <path d="M24 8 Q28 4 32 8" />
      <path d="M24 40 Q28 44 32 40" />
    </svg>
  ),
  '🦎': ({ size, color }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 28 Q14 22 22 22 Q30 22 36 18 Q40 15 42 12" />
      <ellipse cx="20" cy="26" rx="8" ry="5" />
      <path d="M12 30 Q10 36 8 40" />
      <path d="M14 31 Q12 37 11 42" />
      <path d="M26 30 Q28 36 28 40" />
      <path d="M24 30 Q27 37 26 42" />
      <circle cx="14" cy="23" r="1.5" fill={color} stroke="none" />
      <path d="M36 18 Q39 14 42 12 M36 18 Q40 18 42 12" />
    </svg>
  ),
  '🐢': ({ size, color }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="24" cy="26" rx="14" ry="10" />
      <path d="M14 22 Q10 16 12 12 Q16 14 16 20" />
      <path d="M34 22 Q38 16 36 12 Q32 14 32 20" />
      <path d="M14 32 Q10 36 12 40 Q16 38 16 34" />
      <path d="M34 32 Q38 36 36 40 Q32 38 32 34" />
      <ellipse cx="24" cy="22" rx="6" ry="4" />
      <circle cx="20" cy="14" r="4" />
      <circle cx="18" cy="13" r="1" fill={color} stroke="none" />
      <path d="M24 18 L24 22" />
      <path d="M20 26 L24 24 L28 26" />
    </svg>
  ),
  '🌿': ({ size, color }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M24 40 Q24 24 24 16" />
      <path d="M24 30 Q16 26 12 18 Q18 16 24 22" />
      <path d="M24 24 Q32 20 36 12 Q30 10 24 18" />
      <path d="M24 36 Q18 34 14 28 Q20 26 24 32" />
    </svg>
  ),
  '🦋': ({ size, color }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M24 12 Q24 28 24 36" />
      <path d="M24 18 Q18 10 10 12 Q8 20 14 26 Q18 30 24 28" />
      <path d="M24 18 Q30 10 38 12 Q40 20 34 26 Q30 30 24 28" />
      <path d="M24 28 Q18 32 16 38 Q20 38 24 34" />
      <path d="M24 28 Q30 32 32 38 Q28 38 24 34" />
      <path d="M22 11 Q20 8 18 10" />
      <path d="M26 11 Q28 8 30 10" />
    </svg>
  ),
  '🐍': ({ size, color }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 36 Q12 28 20 30 Q28 32 30 24 Q32 16 40 18 Q44 20 42 26 Q40 30 36 28" />
      <ellipse cx="40" cy="17" rx="5" ry="3.5" transform="rotate(-20 40 17)" />
      <circle cx="38" cy="15" r="1" fill={color} stroke="none" />
      <path d="M44 16 Q46 14 46 12 M44 16 Q46 16 47 14" />
    </svg>
  ),
};

const FALLBACK: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round">
    <circle cx="24" cy="24" r="16" />
  </svg>
);

interface DecoItem {
  emoji: string;
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  size: number;
  dur: number;
  delay: number;
  swim?: boolean;
}

interface DecoIconsProps {
  items: DecoItem[];
}

export default function DecoIcons({ items }: DecoIconsProps) {
  return (
    <div className="absolute inset-0 pointer-events-none select-none" aria-hidden>
      <style>{`
        @keyframes deco-float {
          0%,100% { transform: translateY(0) rotate(0deg); opacity: 0.13; }
          33%      { transform: translateY(-12px) rotate(5deg); opacity: 0.18; }
          66%      { transform: translateY(-6px) rotate(-4deg); opacity: 0.15; }
        }
        @keyframes deco-swim {
          0%,100% { transform: translateX(0) scaleX(1) rotate(-3deg); opacity: 0.15; }
          45%     { transform: translateX(18px) scaleX(1) rotate(2deg); opacity: 0.2; }
          50%     { transform: translateX(18px) scaleX(-1) rotate(-2deg); opacity: 0.2; }
          95%     { transform: translateX(0) scaleX(-1) rotate(3deg); opacity: 0.15; }
        }
      `}</style>
      {items.map((item, i) => {
        const SvgComp = SVGS[item.emoji] ?? FALLBACK;
        return (
          <span
            key={i}
            style={{
              position: 'absolute',
              top: item.top,
              bottom: item.bottom,
              left: item.left,
              right: item.right,
              lineHeight: 1,
              animation: item.swim
                ? `deco-swim ${item.dur}s ${item.delay}s ease-in-out infinite`
                : `deco-float ${item.dur}s ${item.delay}s ease-in-out infinite`,
            }}
          >
            <SvgComp size={item.size * 1.6} color="hsl(var(--primary))" />
          </span>
        );
      })}
    </div>
  );
}
