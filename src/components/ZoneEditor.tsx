import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface Zone {
  id?: number;
  name: string;
  color: string;
  opacity: number;
  zone_type: 'circle' | 'polygon';
  coordinates: [number, number][];
  center_lat: number | null;
  center_lon: number | null;
  radius_km: number | null;
  sort_order: number;
  active: boolean;
}

interface Props {
  zone: Partial<Zone>;
  apiKey: string;
  saving: boolean;
  onChange: (z: Partial<Zone>) => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function ZoneEditor({ zone, apiKey, saving, onChange, onSave, onCancel }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInst = useRef<any>(null);
  const polyRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [pointCount, setPointCount] = useState(zone.coordinates?.length || 0);
  const [mode, setMode] = useState<'draw' | 'move'>('draw');

  // Загрузка Яндекс Карт
  useEffect(() => {
    if (!apiKey) return;
    const init = () => {
      (window as any).ymaps.ready(() => setMapReady(true));
    };
    if ((window as any).ymaps) { init(); return; }
    const existing = document.querySelector('script[src*="api-maps.yandex.ru"]');
    if (existing) { existing.addEventListener('load', init); return; }
    const s = document.createElement('script');
    s.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU`;
    s.async = true;
    s.onload = init;
    document.head.appendChild(s);
  }, [apiKey]);

  // Инициализация карты-редактора
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const ymaps = (window as any).ymaps;

    if (mapInst.current) { mapInst.current.destroy(); }

    const map = new ymaps.Map(mapRef.current, {
      center: [55.73, 36.90],
      zoom: 9,
      controls: ['zoomControl'],
    }, { suppressMapOpenBlock: true });

    mapInst.current = map;

    if (zone.zone_type === 'polygon') {
      const coords = zone.coordinates?.length ? zone.coordinates.map(c => [c[0], c[1]]) : [];
      const poly = new ymaps.Polygon([coords], {}, {
        fillColor: (zone.color || '#22c55e') + '44',
        strokeColor: zone.color || '#22c55e',
        strokeWidth: 2,
        fillOpacity: zone.opacity || 0.22,
        editorMaxPoints: 100,
      });
      map.geoObjects.add(poly);
      polyRef.current = poly;
      setPointCount(coords.length);

      if (coords.length > 0) {
        poly.editor.startEditing();
      }

      // Клик по карте — добавляем точку
      map.events.add('click', (e: any) => {
        const coords2 = e.get('coords');
        const cur = poly.geometry.getCoordinates()[0] || [];
        // Убираем автозамыкание если есть
        const pts = cur.filter((_: any, i: number) => i < cur.length - 1 || cur.length === 0);
        const next = [...pts, coords2];
        poly.geometry.setCoordinates([next]);
        setPointCount(next.length);
        onChange({ ...zone, coordinates: next.map((c: number[]) => [c[0], c[1]]) as [number,number][] });
      });

      // Обновление при редактировании точек
      poly.geometry.events.add('change', () => {
        const pts = poly.geometry.getCoordinates()[0] || [];
        const clean = pts.filter((_: any, i: number) => i < pts.length - 1 || pts.length <= 1);
        setPointCount(clean.length);
        onChange({ ...zone, coordinates: clean.map((c: number[]) => [c[0], c[1]]) as [number,number][] });
      });
    }

    if (zone.zone_type === 'circle') {
      const lat = zone.center_lat || 55.73;
      const lon = zone.center_lon || 36.85;
      const r = (zone.radius_km || 10) * 1000;
      const circle = new ymaps.Circle([[lat, lon], r], {}, {
        fillColor: (zone.color || '#22c55e') + '44',
        strokeColor: zone.color || '#22c55e',
        strokeWidth: 2,
        fillOpacity: zone.opacity || 0.22,
        draggable: true,
      });
      map.geoObjects.add(circle);
      circle.editor.startEditing();
      circleRef.current = circle;

      const update = () => {
        const c = circle.geometry.getCoordinates();
        const r2 = circle.geometry.getRadius();
        onChange({ ...zone, center_lat: c[0], center_lon: c[1], radius_km: Math.round(r2 / 100) / 10 });
      };
      circle.geometry.events.add('change', update);
      circle.events.add('dragend', update);
    }

    return () => {
      if (mapInst.current) { mapInst.current.destroy(); mapInst.current = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, zone.zone_type]);

  const undoLastPoint = () => {
    if (!polyRef.current) return;
    const pts = polyRef.current.geometry.getCoordinates()[0] || [];
    const next = pts.slice(0, -1);
    polyRef.current.geometry.setCoordinates([next]);
    setPointCount(next.length);
    onChange({ ...zone, coordinates: next.map((c: number[]) => [c[0], c[1]]) as [number,number][] });
  };

  const clearAll = () => {
    if (!polyRef.current) return;
    polyRef.current.geometry.setCoordinates([[]]);
    setPointCount(0);
    onChange({ ...zone, coordinates: [] });
  };

  return (
    <div className="mt-4 p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
      <p className="text-sm font-semibold text-primary">{zone.id ? 'Редактировать зону' : 'Новая зона'}</p>

      {/* Настройки */}
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <label className="text-xs text-muted-foreground mb-1 block">Название зоны</label>
          <input className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm"
            value={zone.name || ''} placeholder="Зона выезда"
            onChange={e => onChange({ ...zone, name: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Тип</label>
          <select className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm"
            value={zone.zone_type || 'polygon'}
            onChange={e => onChange({ ...zone, zone_type: e.target.value as 'circle' | 'polygon', coordinates: [], center_lat: null, center_lon: null })}>
            <option value="polygon">Полигон</option>
            <option value="circle">Круг</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Цвет заливки</label>
          <div className="flex items-center gap-2">
            <input type="color" className="h-9 w-12 rounded-lg border border-input cursor-pointer"
              value={zone.color || '#22c55e'} onChange={e => onChange({ ...zone, color: e.target.value })} />
            <span className="text-xs text-muted-foreground">{zone.color}</span>
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Прозрачность: {Math.round((zone.opacity || 0.22) * 100)}%</label>
          <input type="range" min="5" max="60" step="5"
            value={Math.round((zone.opacity || 0.22) * 100)}
            onChange={e => onChange({ ...zone, opacity: parseInt(e.target.value) / 100 })}
            className="w-full" />
        </div>
      </div>

      {/* Карта-редактор */}
      {!apiKey ? (
        <div className="rounded-xl bg-muted p-6 text-center text-sm text-muted-foreground">
          Сначала сохраните ключ Яндекс Карт выше
        </div>
      ) : (
        <>
          {zone.zone_type === 'polygon' && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium">
                <Icon name="MousePointerClick" size={13} />
                Кликай по карте — добавляй точки границы
              </div>
              <span className="text-xs text-muted-foreground">{pointCount} точек</span>
              <div className="flex gap-1 ml-auto">
                <Button size="sm" variant="outline" onClick={undoLastPoint} disabled={pointCount === 0}>
                  <Icon name="Undo2" size={13} className="mr-1" />Отменить
                </Button>
                <Button size="sm" variant="outline" onClick={clearAll} disabled={pointCount === 0}>
                  <Icon name="Trash2" size={13} className="mr-1" />Очистить
                </Button>
              </div>
            </div>
          )}
          {zone.zone_type === 'circle' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium">
              <Icon name="Move" size={13} />
              Тяни круг чтобы переместить, тяни край чтобы изменить радиус
              {zone.radius_km && <span className="ml-2 opacity-70">— {zone.radius_km} км</span>}
            </div>
          )}
          <div ref={mapRef} className="w-full rounded-xl overflow-hidden border border-border" style={{ height: 380 }} />
        </>
      )}

      <div className="flex gap-2">
        <Button disabled={saving || !zone.name} onClick={onSave}>
          <Icon name="Check" size={14} className="mr-1.5" />
          {saving ? 'Сохраняем...' : zone.id ? 'Сохранить' : 'Добавить зону'}
        </Button>
        <Button variant="outline" onClick={onCancel}>Отмена</Button>
      </div>
    </div>
  );
}
