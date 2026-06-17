import { useEffect, useRef, useState } from 'react';

export default function WaterCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'idle' | 'hover' | 'click'>('idle');
  const pos = useRef({ x: -200, y: -200 });
  const trail = useRef({ x: -200, y: -200 });
  const raf = useRef<number>(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const isHover = !!el?.closest('button, a, [role=button], input, textarea, select, label');
      setState(prev => prev === 'click' ? 'click' : isHover ? 'hover' : 'idle');
    };
    const onDown = () => setState('click');
    const onUp = (e: MouseEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      setState(el?.closest('button, a, [role=button]') ? 'hover' : 'idle');
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('mouseup', onUp);

    const animate = () => {
      trail.current.x += (pos.current.x - trail.current.x) * 0.1;
      trail.current.y += (pos.current.y - trail.current.y) * 0.1;

      if (cursorRef.current) {
        cursorRef.current.style.transform =
          `translate(${pos.current.x}px, ${pos.current.y}px) translate(-50%, -50%)`;
      }
      if (trailRef.current) {
        trailRef.current.style.transform =
          `translate(${trail.current.x}px, ${trail.current.y}px) translate(-50%, -50%)`;
      }
      raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('mouseup', onUp);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <>
      <style>{`
        * { cursor: none !important; }
        @keyframes cursor-pulse {
          0%, 100% { opacity: 0.5; transform: translate(var(--tx), var(--ty)) translate(-50%, -50%) scale(1); }
          50% { opacity: 0.8; transform: translate(var(--tx), var(--ty)) translate(-50%, -50%) scale(1.15); }
        }
      `}</style>

      {/* Trailing glow ring */}
      <div
        ref={trailRef}
        className="pointer-events-none fixed top-0 left-0 z-[9998] rounded-full"
        style={{
          width: state === 'hover' ? 56 : state === 'click' ? 28 : 44,
          height: state === 'hover' ? 56 : state === 'click' ? 28 : 44,
          background: state === 'hover'
            ? 'radial-gradient(circle, hsl(152 45% 48% / 0.18) 0%, transparent 70%)'
            : 'radial-gradient(circle, hsl(192 70% 45% / 0.15) 0%, transparent 70%)',
          border: `1.5px solid ${state === 'hover' ? 'hsl(152 45% 48% / 0.5)' : state === 'click' ? 'hsl(192 70% 62% / 0.9)' : 'hsl(200 70% 24% / 0.35)'}`,
          boxShadow: state === 'hover'
            ? '0 0 16px 2px hsl(152 45% 48% / 0.2)'
            : state === 'click'
            ? '0 0 20px 4px hsl(192 70% 62% / 0.35)'
            : 'none',
          transition: 'width 0.25s cubic-bezier(.34,1.56,.64,1), height 0.25s cubic-bezier(.34,1.56,.64,1), border-color 0.2s, box-shadow 0.2s, background 0.2s',
        }}
      />

      {/* Main cursor — sleek crosshair dot */}
      <div
        ref={cursorRef}
        className="pointer-events-none fixed top-0 left-0 z-[9999]"
        style={{ width: 0, height: 0 }}
      >
        {/* Center dot */}
        <div style={{
          position: 'absolute',
          width: state === 'click' ? 4 : state === 'hover' ? 6 : 5,
          height: state === 'click' ? 4 : state === 'hover' ? 6 : 5,
          borderRadius: '50%',
          background: state === 'hover' ? 'hsl(152 45% 48%)' : 'hsl(200 70% 24%)',
          transform: 'translate(-50%, -50%)',
          transition: 'width 0.15s, height 0.15s, background 0.2s',
          boxShadow: state === 'hover' ? '0 0 8px hsl(152 45% 48% / 0.8)' : '0 0 6px hsl(200 70% 24% / 0.5)',
        }} />
        {/* Cross lines */}
        {(['top','right','bottom','left'] as const).map((dir) => {
          const isVert = dir === 'top' || dir === 'bottom';
          const gap = state === 'hover' ? 9 : state === 'click' ? 6 : 7;
          const len = state === 'hover' ? 7 : state === 'click' ? 4 : 6;
          const posStyle: React.CSSProperties = {
            position: 'absolute',
            borderRadius: 2,
            background: state === 'hover' ? 'hsl(152 45% 48%)' : 'hsl(200 70% 24%)',
            opacity: state === 'click' ? 0.7 : 0.9,
            transition: 'all 0.2s cubic-bezier(.34,1.56,.64,1)',
            ...(isVert ? { width: 1.5, height: len } : { width: len, height: 1.5 }),
            ...(dir === 'top' ? { top: -(gap + len), left: -0.75 } : {}),
            ...(dir === 'bottom' ? { top: gap, left: -0.75 } : {}),
            ...(dir === 'left' ? { left: -(gap + len), top: -0.75 } : {}),
            ...(dir === 'right' ? { left: gap, top: -0.75 } : {}),
          };
          return <div key={dir} style={posStyle} />;
        })}
      </div>
    </>
  );
}
