const LOGO_URL = 'https://cdn.poehali.dev/projects/a4014f0d-2686-48db-be64-812eb2af31a9/files/e5a6448a-22cb-4b61-b4a0-28eb7c461a6c.jpg';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'icon';
  className?: string;
}

const sizes = {
  sm: { img: 28, text: 'text-lg' },
  md: { img: 36, text: 'text-2xl' },
  lg: { img: 52, text: 'text-3xl' },
};

export default function Logo({ size = 'md', variant = 'full', className = '' }: LogoProps) {
  const s = sizes[size];
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src={LOGO_URL}
        alt="AquaScale логотип"
        width={s.img}
        height={s.img}
        className="rounded-full object-cover ring-2 ring-primary/20"
        style={{ width: s.img, height: s.img }}
      />
      {variant === 'full' && (
        <div className="leading-none">
          <span className={`font-display font-bold text-primary ${s.text}`}>AquaScale</span>
          <span className="block text-[10px] font-medium tracking-widest text-muted-foreground uppercase mt-0.5">АкваТерра Студия</span>
        </div>
      )}
    </div>
  );
}