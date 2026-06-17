import { useEffect, useRef, useState } from 'react';

interface StatCounterProps {
  value: number;
  suffix?: string;
  label: string;
}

export default function StatCounter({ value, suffix = '', label }: StatCounterProps) {
  const [count, setCount] = useState(0);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.4 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const duration = 1800;
    const step = 16;
    const increment = value / (duration / step);
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) { setCount(value); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, step);
    return () => clearInterval(timer);
  }, [visible, value]);

  return (
    <div
      ref={ref}
      className="glass-card rounded-2xl p-6 text-center transition-all duration-700"
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)' }}
    >
      <p className="font-display text-5xl font-bold text-primary leading-none mb-2">
        {count}{suffix}
      </p>
      <p className="text-muted-foreground text-sm font-medium">{label}</p>
    </div>
  );
}
