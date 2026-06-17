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
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>
      {items.map((item, i) => (
        <span
          key={i}
          className={item.swim ? 'deco-swim absolute' : 'deco-float absolute'}
          style={{
            top: item.top,
            bottom: item.bottom,
            left: item.left,
            right: item.right,
            fontSize: item.size,
            animationDuration: `${item.dur}s`,
            animationDelay: `${item.delay}s`,
            filter: 'opacity(0.22)',
          }}
        >
          {item.emoji}
        </span>
      ))}
    </div>
  );
}