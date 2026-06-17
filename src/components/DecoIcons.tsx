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
          0%,100% { transform: translateY(0) rotate(0deg); opacity: 0.18; }
          33%      { transform: translateY(-14px) rotate(7deg); opacity: 0.24; }
          66%      { transform: translateY(-7px) rotate(-5deg); opacity: 0.20; }
        }
        @keyframes deco-swim {
          0%,100% { transform: translateX(0) scaleX(1) rotate(-4deg); opacity: 0.22; }
          45%     { transform: translateX(20px) scaleX(1) rotate(3deg); opacity: 0.28; }
          50%     { transform: translateX(20px) scaleX(-1) rotate(-3deg); opacity: 0.28; }
          95%     { transform: translateX(0) scaleX(-1) rotate(4deg); opacity: 0.22; }
        }
      `}</style>
      {items.map((item, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            top: item.top,
            bottom: item.bottom,
            left: item.left,
            right: item.right,
            fontSize: item.size,
            lineHeight: 1,
            animation: item.swim
              ? `deco-swim ${item.dur}s ${item.delay}s ease-in-out infinite`
              : `deco-float ${item.dur}s ${item.delay}s ease-in-out infinite`,
          }}
        >
          {item.emoji}
        </span>
      ))}
    </div>
  );
}