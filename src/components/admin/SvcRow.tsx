import Icon from '@/components/ui/icon';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface SvcRowData {
  id: number; icon: string; title: string; subtitle?: string;
  price_from: number; price_unit: string; active: boolean;
}

interface Props {
  s: SvcRowData;
  subName?: string;
  onToggle: (s: SvcRowData) => void;
  onEdit: (s: SvcRowData) => void;
  onRemove: (id: number) => void;
}

export default function SvcRow({ s, subName, onToggle, onEdit, onRemove }: Props) {
  return (
    <Card className="p-4 flex items-center gap-4">
      <span className="grid place-items-center w-10 h-10 rounded-lg bg-primary/10 text-primary shrink-0">
        <Icon name={s.icon} size={20} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-primary truncate text-sm">{s.title}</h3>
          {s.subtitle && <span className="text-xs text-secondary truncate">· {s.subtitle}</span>}
          <Badge variant={s.active ? 'default' : 'secondary'} className="text-xs shrink-0">{s.active ? 'Активна' : 'Скрыта'}</Badge>
        </div>
        <p className="text-xs text-secondary font-bold">
          от {s.price_from.toLocaleString('ru')} ₽ <span className="text-muted-foreground font-normal">{s.price_unit}</span>
          {subName && <span className="text-muted-foreground font-normal"> · {subName}</span>}
        </p>
      </div>
      <div className="flex gap-1 shrink-0">
        <Button size="icon" variant="ghost" className="h-8 w-8" title={s.active ? 'Скрыть' : 'Показать'} onClick={() => onToggle(s)}>
          <Icon name={s.active ? 'EyeOff' : 'Eye'} size={15} />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(s)}>
          <Icon name="Pencil" size={15} />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onRemove(s.id)}>
          <Icon name="Trash2" size={15} />
        </Button>
      </div>
    </Card>
  );
}
