const LOGO_URL = 'https://cdn.poehali.dev/projects/a4014f0d-2686-48db-be64-812eb2af31a9/files/e5a6448a-22cb-4b61-b4a0-28eb7c461a6c.jpg';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'icon';
  light?: boolean;
  className?: string;
}

const sizes = {
  sm: { img: 42, text: 'text-xl', sub: 'text-[11px]' },
  md: { img: 52, text: 'text-2xl', sub: 'text-xs' },
  lg: { img: 72, text: 'text-4xl', sub: 'text-sm' },
};

export default function Logo({ size = 'md', variant = 'full', light = false, className = '' }: LogoProps) {
  const s = sizes[size];
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src={LOGO_URL}
        alt="AquaScale логотип"
        width={s.img}
        height={s.img}
        className="rounded-full object-cover ring-2 shadow-md"
        style={{ width: s.img, height: s.img, minWidth: s.img, boxShadow: light ? '0 0 0 2px rgba(255,255,255,0.4)' : undefined }}
      />
      {variant === 'full' && (
        <div className="leading-none">
          <span className={`font-display font-bold drop-shadow-sm ${s.text} ${light ? 'text-white' : 'text-primary'}`}>
            AquaScale
          </span>
          <span className={`block font-semibold tracking-widest uppercase mt-1 drop-shadow-sm ${s.sub} ${light ? 'text-white/90' : 'text-muted-foreground'}`}>
            АкваТерра Студия
          </span>
        </div>
      )}
    </div>
  );
}