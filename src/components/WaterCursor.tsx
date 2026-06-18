import { useEffect, useRef, useState, useCallback } from 'react';

interface Ripple { id: number; x: number; y: number; }

function isTouchDevice() {
  return window.matchMedia('(pointer: coarse)').matches;
}

export default function WaterCursor() {
  const cursorRef  = useRef<HTMLDivElement>(null);
  const ambientRef = useRef<HTMLDivElement>(null);
  const [hover, setHover]     = useState(false);
  const [click, setClick]     = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [isTouch, setIsTouch] = useState(false);
  const nextId = useRef(0);

  useEffect(() => {
    setIsTouch(isTouchDevice());
  }, []);

  const addRipple = useCallback((x: number, y: number) => {
    const id = nextId.current++;
    setRipples(r => [...r, { id, x, y }]);
    setTimeout(() => setRipples(r => r.filter(p => p.id !== id)), 700);
  }, []);

  useEffect(() => {
    if (isTouch) return;
    const move = (e: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      }
      if (ambientRef.current) {
        ambientRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      }
      const el = document.elementFromPoint(e.clientX, e.clientY);
      setHover(!!el?.closest('button, a, [role=button], input, textarea, select, label'));
    };
    const down = (e: MouseEvent) => { setClick(true); addRipple(e.clientX, e.clientY); };
    const up   = () => setClick(false);

    document.addEventListener('mousemove', move, { passive: true });
    document.addEventListener('mousedown', down);
    document.addEventListener('mouseup', up);
    return () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mousedown', down);
      document.removeEventListener('mouseup', up);
    };
  }, [addRipple, isTouch]);

  if (isTouch) return null;

  return (
    <>
      <style>{`
        * { cursor: none !important; }
        @keyframes ripple-out {
          0%   { transform: translate(-50%,-50%) scale(0); opacity: 0.5; }
          100% { transform: translate(-50%,-50%) scale(1); opacity: 0; }
        }
      `}</style>

      {/* Ambient glow — мягкое световое пятно без задержки */}
      <div
        ref={ambientRef}
        className="pointer-events-none fixed top-0 left-0 z-[9990]"
        style={{
          width: 320, height: 320,
          marginLeft: -160, marginTop: -160,
          borderRadius: '50%',
          background: hover
            ? 'radial-gradient(circle, hsl(152 50% 45% / 0.07) 0%, transparent 70%)'
            : 'radial-gradient(circle, hsl(188 75% 55% / 0.06) 0%, transparent 70%)',
          transition: 'background 0.4s ease',
          willChange: 'transform',
          pointerEvents: 'none',
        }}
      />

      {/* Ripples */}
      {ripples.map(r => (
        <div
          key={r.id}
          className="pointer-events-none fixed top-0 left-0 z-[9995] rounded-full border"
          style={{
            width: 80, height: 80,
            left: r.x, top: r.y,
            borderColor: 'hsl(188 75% 55% / 0.5)',
            animation: 'ripple-out 0.7s ease-out forwards',
          }}
        />
      ))}

      {/* Cursor arrow */}
      <div
        ref={cursorRef}
        className="pointer-events-none fixed top-0 left-0 z-[9999]"
        style={{ willChange: 'transform' }}
      >
        <svg
          width="20" height="24" viewBox="0 0 20 24" fill="none"
          style={{
            display: 'block',
            transform: `scale(${click ? 0.86 : hover ? 1.1 : 1})`,
            transition: 'transform 0.12s ease, filter 0.15s ease',
            filter: hover
              ? 'drop-shadow(0 2px 8px hsl(152 50% 45% / 0.7))'
              : 'drop-shadow(0 1px 4px rgba(0,0,0,0.4))',
          }}
        >
          <path
            d="M2 1.5L2 18.5L7 13.5L10 20.5L12.5 19.5L9.5 12.5L16.5 12.5L2 1.5Z"
            fill={hover ? 'hsl(152 50% 45%)' : 'hsl(var(--foreground))'}
            stroke="hsl(var(--background))"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            style={{ transition: 'fill 0.15s ease' }}
          />
        </svg>
      </div>
    </>
  );
}