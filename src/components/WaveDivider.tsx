interface WaveDividerProps {
  fill?: string;
  flip?: boolean;
  className?: string;
}

export default function WaveDivider({ fill = 'hsl(var(--background))', flip = false, className = '' }: WaveDividerProps) {
  const path = flip
    ? 'M0,40 C180,0 360,80 540,40 C720,0 900,80 1080,40 C1260,0 1380,60 1440,40 L1440,0 L0,0 Z'
    : 'M0,40 C180,80 360,0 540,40 C720,80 900,0 1080,40 C1260,80 1380,20 1440,40 L1440,80 L0,80 Z';
  const viewBox = flip ? '0 0 1440 80' : '0 0 1440 80';

  return (
    <div className={`w-full overflow-hidden leading-none ${className}`} style={{ marginBottom: flip ? 0 : -2, marginTop: flip ? -2 : 0 }}>
      <svg viewBox={viewBox} xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-14 md:h-20 block">
        <path d={path} fill={fill} />
      </svg>
    </div>
  );
}