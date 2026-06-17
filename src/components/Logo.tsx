const LOGO_URL = 'https://cdn.poehali.dev/projects/a4014f0d-2686-48db-be64-812eb2af31a9/files/e5a6448a-22cb-4b61-b4a0-28eb7c461a6c.jpg';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'icon';
  className?: string;
}

const sizes = {
  sm: { img: 42, text: 'text-xl', sub: 'text-[11px]' },
  md: { img: 52, text: 'text-2xl', sub: 'text-xs' },
  lg: { img: 72, text: 'text-4xl', sub: 'text-sm' },
};

export default function Logo({ size = 'md', variant = 'full', className = '' }: LogoProps) {
  const s = sizes[size];
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src={LOGO_URL}
        alt="AquaScale логотип"
        width={s.img}
        height={s.img}
        className="rounded-full object-cover ring-2 ring-primary/30 shadow-md"
        style={{ width: s.img, height: s.img, minWidth: s.img }}
      />
      {variant === 'full' && (
        <div className="leading-none">
          <span className={`font-display font-bold text-primary ${s.text}`}>AquaScale</span>
          <span className={`block font-medium tracking-widest text-muted-foreground uppercase mt-1 ${s.sub}`}>АкваТерра Студия</span>
        </div>
      )}
    </div>
  );
}