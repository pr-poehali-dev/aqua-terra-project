import { useRef, ReactNode } from 'react';

interface MagneticCardProps {
  children: ReactNode;
  className?: string;
  strength?: number;
}

export default function MagneticCard({ children, className = '', strength = 10 }: MagneticCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    el.style.transform = `translate(${dx * strength}px, ${dy * strength * 0.6}px) rotateX(${-dy * 3}deg) rotateY(${dx * 3}deg)`;
    el.style.transition = 'transform 0.1s ease';
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = 'translate(0,0) rotateX(0) rotateY(0)';
    el.style.transition = 'transform 0.4s cubic-bezier(.34,1.56,.64,1)';
  };

  return (
    <div
      ref={ref}
      className={className}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
    >
      {children}
    </div>
  );
}
