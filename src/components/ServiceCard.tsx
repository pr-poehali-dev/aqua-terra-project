import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface ServiceCardData {
  id?: number;
  icon: string;
  title: string;
  subtitle?: string;
  description: string;
  price_from: number;
  price_unit: string;
  tags?: string[];
}

interface Props {
  s: ServiceCardData;
  expanded?: boolean;
  onToggle?: () => void;
  onOrder: () => void;
}

export default function ServiceCard({ s, expanded, onToggle, onOrder }: Props) {
  const hasDetails = !!(s.subtitle || (s.description && s.description.length > 80));

  return (
    <div className="glass-card rounded-2xl p-7 flex flex-col hover:shadow-xl transition-all duration-300 h-full">
      <span className="grid place-items-center w-14 h-14 rounded-xl bg-primary/10 text-primary mb-5 shrink-0">
        <Icon name={s.icon} size={28} />
      </span>

      <h3 className="font-display text-xl font-semibold text-primary mb-1">{s.title}</h3>
      {s.subtitle && <p className="text-sm font-medium text-secondary mb-2">{s.subtitle}</p>}

      <p className={`text-muted-foreground text-sm leading-relaxed flex-1 mb-4 ${!expanded && hasDetails ? 'line-clamp-3' : ''}`}>
        {s.description}
      </p>

      {hasDetails && onToggle && (
        <button
          onClick={onToggle}
          className="text-xs text-primary font-medium flex items-center gap-1 mb-4 hover:underline self-start"
        >
          {expanded ? 'Свернуть' : 'Подробнее'}
          <Icon name={expanded ? 'ChevronUp' : 'ChevronDown'} size={13} />
        </button>
      )}

      {(s.tags || []).length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          {(s.tags || []).map((t) => (
            <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
          ))}
        </div>
      )}

      <div className="flex items-end justify-between border-t border-border pt-4 mt-auto">
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">от</p>
          <p className="font-display text-2xl font-bold text-primary leading-none">
            {(s.price_from ?? 0).toLocaleString('ru')} <span className="text-sm font-sans font-normal">₽</span>
          </p>
          {s.price_unit && <p className="text-xs text-muted-foreground mt-0.5">{s.price_unit}</p>}
        </div>
        <Button size="sm" onClick={onOrder}>Заказать</Button>
      </div>
    </div>
  );
}
