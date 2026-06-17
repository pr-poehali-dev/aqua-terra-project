import { useEffect, useRef } from 'react';

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  r: number;
  opacity: number;
  opacityDir: number;
  pulse: number;
}

export default function Plankton() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const COUNT = 55;
    const particles: Particle[] = [];
    let raf: number;
    let W = 0, H = 0;

    const resize = () => {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.18 - 0.06,
        r: Math.random() * 1.8 + 0.5,
        opacity: Math.random() * 0.5 + 0.15,
        opacityDir: Math.random() > 0.5 ? 1 : -1,
        pulse: Math.random() * Math.PI * 2,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      for (const p of particles) {
        p.pulse += 0.018;
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -5) p.x = W + 5;
        if (p.x > W + 5) p.x = -5;
        if (p.y < -5) p.y = H + 5;
        if (p.y > H + 5) p.y = -5;

        const glow = Math.sin(p.pulse) * 0.2;
        const a = Math.max(0.05, Math.min(0.75, p.opacity + glow));

        // Glow halo
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
        grad.addColorStop(0, `rgba(100, 220, 200, ${a * 0.6})`);
        grad.addColorStop(1, 'rgba(100, 220, 200, 0)');
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(160, 240, 220, ${a})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-[2]"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
