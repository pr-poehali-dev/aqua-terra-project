import { useEffect, useRef, useState } from 'react';

export default function WaterCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [clicking, setClicking] = useState(false);
  const [hovering, setHovering] = useState(false);
  const pos = useRef({ x: -100, y: -100 });
  const ring = useRef({ x: -100, y: -100 });
  const raf = useRef<number>(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
      const el = document.elementFromPoint(e.clientX, e.clientY);
      setHovering(!!el?.closest('button, a, [role=button], input, textarea, select, label, [data-cursor-pointer]'));
    };
    const onDown = () => setClicking(true);
    const onUp = () => setClicking(false);

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('mouseup', onUp);

    const animate = () => {
      ring.current.x += (pos.current.x - ring.current.x) * 0.12;
      ring.current.y += (pos.current.y - ring.current.y) * 0.12;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px) translate(-50%, -50%)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ring.current.x}px, ${ring.current.y}px) translate(-50%, -50%)`;
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
      {/* Trailing ring */}
      <div
        ref={ringRef}
        className="pointer-events-none fixed top-0 left-0 z-[9999] rounded-full border-2 transition-[width,height,border-color,opacity] duration-200"
        style={{
          width: hovering ? 44 : clicking ? 20 : 36,
          height: hovering ? 44 : clicking ? 20 : 36,
          borderColor: hovering ? 'hsl(var(--secondary))' : 'hsl(var(--primary) / 0.6)',
          opacity: 0.8,
        }}
      />
      {/* Dot — water drop */}
      <div
        ref={dotRef}
        className="pointer-events-none fixed top-0 left-0 z-[9999] transition-[width,height,border-radius,background] duration-150"
        style={{
          width: clicking ? 6 : hovering ? 8 : 8,
          height: clicking ? 10 : hovering ? 12 : 8,
          borderRadius: clicking || hovering ? '50% 50% 50% 50% / 60% 60% 40% 40%' : '50%',
          background: hovering ? 'hsl(var(--secondary))' : 'hsl(var(--primary))',
        }}
      />
      <style>{`* { cursor: none !important; }`}</style>
    </>
  );
}
