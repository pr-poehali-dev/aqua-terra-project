import { useEffect, useRef, useState } from 'react';

export default function WaterCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const [click, setClick] = useState(false);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
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
        <svg
          width="20"
          height="24"
          viewBox="0 0 20 24"
          fill="none"
          style={{
            display: 'block',
            transform: `scale(${click ? 0.86 : hover ? 1.1 : 1})`,
            transition: 'transform 0.12s ease, filter 0.15s ease',
            filter: hover
              ? 'drop-shadow(0 2px 8px hsl(var(--secondary) / 0.6))'
              : 'drop-shadow(0 1px 4px rgba(0,0,0,0.4))',
          }}
        >
          <path
            d="M2 1.5L2 18.5L7 13.5L10 20.5L12.5 19.5L9.5 12.5L16.5 12.5L2 1.5Z"
            fill={hover ? 'hsl(var(--secondary))' : 'hsl(var(--foreground))'}
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
