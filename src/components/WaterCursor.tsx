import { useEffect, useRef, useState } from 'react';

export default function WaterCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const [click, setClick] = useState(false);

  useEffect(() => {
    let rafId: number;

    const move = (e: MouseEvent) => {
      // Мгновенно — без rAF и без задержки
      if (cursorRef.current) {
        cursorRef.current.style.transform =
          `translate(${e.clientX}px, ${e.clientY}px)`;
      }
      const el = document.elementFromPoint(e.clientX, e.clientY);
      setHover(!!el?.closest('button, a, [role=button], input, textarea, select, label'));
    };

    const down = () => setClick(true);
    const up   = () => setClick(false);

    document.addEventListener('mousemove', move, { passive: true });
    document.addEventListener('mousedown', down);
    document.addEventListener('mouseup', up);

    return () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mousedown', down);
      document.removeEventListener('mouseup', up);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      <style>{`* { cursor: none !important; }`}</style>
      <div
        ref={cursorRef}
        className="pointer-events-none fixed top-0 left-0 z-[9999]"
        style={{ willChange: 'transform' }}
      >
        {/* Внешнее кольцо — CSS transition, мгновенный scale */}
        <div style={{
          position: 'absolute',
          width: hover ? 36 : 32,
          height: hover ? 36 : 32,
          borderRadius: '50%',
          border: `1px solid ${hover ? 'hsl(var(--secondary))' : 'hsl(var(--primary) / 0.5)'}`,
          transform: `translate(-50%, -50%) scale(${click ? 0.7 : 1})`,
          transition: 'width 0.15s ease, height 0.15s ease, border-color 0.15s ease, transform 0.1s ease',
          boxShadow: hover ? '0 0 0 1px hsl(var(--secondary) / 0.15)' : 'none',
        }} />
        {/* Центральная точка */}
        <div style={{
          position: 'absolute',
          width: hover ? 5 : 4,
          height: hover ? 5 : 4,
          borderRadius: '50%',
          background: hover ? 'hsl(var(--secondary))' : 'hsl(var(--primary))',
          transform: `translate(-50%, -50%) scale(${click ? 1.6 : 1})`,
          transition: 'background 0.15s ease, transform 0.1s ease, width 0.15s ease, height 0.15s ease',
        }} />
      </div>
    </>
  );
}
