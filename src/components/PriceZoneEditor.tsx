import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface PricePoint { lat: number; lon: number; radius: number; address: string; }
export interface PriceZoneItem { radius: number; factor: number; label: string; points: PricePoint[]; }
export interface PriceZoneConfig { center_lat: number; center_lon: number; zones: PriceZoneItem[]; active: boolean; }

interface Props {
  config: PriceZoneConfig;
  apiKey: string;
  saving: boolean;
  onChange: (c: PriceZoneConfig) => void;
  onSave: () => void;
}

const ZONE_COLORS = [
  { fill: '#22c55e', stroke: '#16a34a', bg: 'bg-green-500/10 border-green-500/30',   dot: 'bg-green-500' },
  { fill: '#eab308', stroke: '#ca8a04', bg: 'bg-yellow-500/10 border-yellow-500/30', dot: 'bg-yellow-500' },
  { fill: '#f97316', stroke: '#ea580c', bg: 'bg-orange-500/10 border-orange-500/30', dot: 'bg-orange-500' },
  { fill: '#ef4444', stroke: '#dc2626', bg: 'bg-red-500/10 border-red-500/30',       dot: 'bg-red-500' },
];

export default function PriceZoneEditor({ config, apiKey, saving, onChange, onSave }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInst = useRef<any>(null);
  const circlesRef = useRef<any[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [geocoding, setGeocoding] = useState<number | null>(null); // индекс зоны, для которой идёт геокодинг
  const [addressInputs, setAddressInputs] = useState<string[]>(['', '', '', '']);
  const [clickMode, setClickMode] = useState<number | null>(null); // индекс зоны, ожидающей клика

  // Загрузка ymaps
  useEffect(() => {
    if (!apiKey) return;
    const init = () => (window as any).ymaps.ready(() => setMapReady(true));
    if ((window as any).ymaps) { init(); return; }
    const existing = document.querySelector('script[src*="api-maps.yandex.ru"]');
    if (existing) { existing.addEventListener('load', init); return; }
    const s = document.createElement('script');
    s.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU`;
    s.async = true; s.onload = init;
    document.head.appendChild(s);
  }, [apiKey]);

  // Перерисовка кругов при изменении конфига
  const redrawCircles = useCallback(() => {
    if (!mapInst.current) return;
    const ymaps = (window as any).ymaps;
    circlesRef.current.forEach(c => mapInst.current.geoObjects.remove(c));
    circlesRef.current = [];

    // Рисуем от большего радиуса к меньшему — чтобы маленькие были поверх
    const allCircles: { zoneIdx: number; pointIdx: number; lat: number; lon: number; radius: number }[] = [];
    config.zones.forEach((zone, zi) => {
      zone.points.forEach((pt, pi) => {
        allCircles.push({ zoneIdx: zi, pointIdx: pi, lat: pt.lat, lon: pt.lon, radius: pt.radius });
      });
    });
    allCircles.sort((a, b) => b.radius - a.radius);

    allCircles.forEach(({ zoneIdx, lat, lon, radius }) => {
      const color = ZONE_COLORS[zoneIdx];
      const circle = new ymaps.Circle(
        [[lat, lon], radius * 1000],
        {},
        {
          fillColor: color.fill + '30',
          strokeColor: color.stroke,
          strokeWidth: 2,
          fillOpacity: 0.3,
        }
      );
      mapInst.current.geoObjects.add(circle);
      circlesRef.current.push(circle);
    });
  }, [config]);

  // Инициализация карты
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const ymaps = (window as any).ymaps;
    if (mapInst.current) mapInst.current.destroy();

    const map = new ymaps.Map(mapRef.current, {
      center: [config.center_lat || 55.73, config.center_lon || 36.85],
      zoom: 9,
      controls: ['zoomControl'],
    }, { suppressMapOpenBlock: true });

    mapInst.current = map;
    redrawCircles();

    return () => { if (mapInst.current) { mapInst.current.destroy(); mapInst.current = null; } };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady]);

  // Перерисовка при смене данных
  useEffect(() => { redrawCircles(); }, [redrawCircles]);

  // Клик по карте — добавляем точку в нужную зону
  useEffect(() => {
    if (!mapInst.current) return;
    const map = mapInst.current;

    const handler = (e: any) => {
      if (clickMode === null) return;
      const coords = e.get('coords');
      const zone = config.zones[clickMode];
      const newPoint: PricePoint = { lat: coords[0], lon: coords[1], radius: zone.radius, address: `${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}` };
      const zones = config.zones.map((z, i) =>
        i === clickMode ? { ...z, points: [...z.points, newPoint] } : z
      );
      onChange({ ...config, zones });
      setClickMode(null);
    };

    map.events.add('click', handler);
    return () => map.events.remove('click', handler);
  }, [clickMode, config, onChange]);

  // Геокодинг адреса
  const geocodeAddress = async (zoneIdx: number, address: string) => {
    if (!address.trim() || !(window as any).ymaps) return;
    setGeocoding(zoneIdx);
    try {
      const result = await (window as any).ymaps.geocode(address, { results: 1 });
      const obj = result.geoObjects.get(0);
      if (!obj) return;
      const coords = obj.geometry.getCoordinates();
      const fullAddress = obj.getAddressLine();
      const zone = config.zones[zoneIdx];
      const newPoint: PricePoint = { lat: coords[0], lon: coords[1], radius: zone.radius, address: fullAddress };
      const zones = config.zones.map((z, i) =>
        i === zoneIdx ? { ...z, points: [...z.points, newPoint] } : z
      );
      onChange({ ...config, zones });
      setAddressInputs(prev => { const a = [...prev]; a[zoneIdx] = ''; return a; });
      // Центрируем карту
      if (mapInst.current) mapInst.current.setCenter(coords, 10);
    } finally {
      setGeocoding(null);
    }
  };

  const removePoint = (zoneIdx: number, pointIdx: number) => {
    const zones = config.zones.map((z, i) =>
      i === zoneIdx ? { ...z, points: z.points.filter((_, pi) => pi !== pointIdx) } : z
    );
    onChange({ ...config, zones });
  };

  const updatePointRadius = (zoneIdx: number, pointIdx: number, radius: number) => {
    const zones = config.zones.map((z, i) =>
      i === zoneIdx ? {
        ...z,
        points: z.points.map((p, pi) => pi === pointIdx ? { ...p, radius } : p)
      } : z
    );
    onChange({ ...config, zones });
  };

  return (
    <div className="space-y-4">
      {/* Карта */}
      {apiKey ? (
        <div className="relative">
          {clickMode !== null && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-foreground text-background text-xs font-medium px-3 py-2 rounded-xl shadow-lg pointer-events-none flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${ZONE_COLORS[clickMode].dot}`} />
              Кликни на карте — добавится точка для «{config.zones[clickMode]?.label}»
              <button className="pointer-events-auto ml-1 opacity-60 hover:opacity-100" onClick={() => setClickMode(null)}>✕</button>
            </div>
          )}
          <div
            ref={mapRef}
            className={`w-full rounded-xl overflow-hidden border-2 transition-colors ${clickMode !== null ? 'border-primary cursor-crosshair' : 'border-border'}`}
            style={{ height: 340 }}
          />
        </div>
      ) : (
        <div className="rounded-xl bg-muted p-4 text-sm text-muted-foreground text-center">
          Сначала сохраните ключ Яндекс Карт
        </div>
      )}

      {/* Зоны */}
      <div className="space-y-3">
        {config.zones.map((zone, zi) => {
          const color = ZONE_COLORS[zi];
          return (
            <div key={zi} className={`rounded-xl border p-3 space-y-2 ${color.bg}`}>
              {/* Заголовок зоны */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`w-3 h-3 rounded-full shrink-0 ${color.dot}`} />
                <div className="flex gap-2 flex-1 min-w-0">
                  <input
                    className="flex-1 min-w-0 h-7 px-2 rounded-lg border border-input bg-background text-xs font-medium"
                    value={zone.label}
                    onChange={e => {
                      const zones = config.zones.map((z, i) => i === zi ? { ...z, label: e.target.value } : z);
                      onChange({ ...config, zones });
                    }}
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-xs text-muted-foreground">×</span>
                    <input
                      type="number" step="0.1" min="1"
                      className="w-14 h-7 px-2 rounded-lg border border-input bg-background text-xs text-center"
                      value={zone.factor}
                      onChange={e => {
                        const zones = config.zones.map((z, i) => i === zi ? { ...z, factor: parseFloat(e.target.value) || 1 } : z);
                        onChange({ ...config, zones });
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Точки */}
              {zone.points.length > 0 && (
                <div className="space-y-1.5">
                  {zone.points.map((pt, pi) => (
                    <div key={pi} className="flex items-center gap-2 bg-background/60 rounded-lg px-2 py-1.5">
                      <Icon name="MapPin" size={12} className="shrink-0 text-muted-foreground" />
                      <span className="text-xs flex-1 truncate text-foreground">{pt.address}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <input
                          type="number" step="5" min="1"
                          className="w-14 h-6 px-1 rounded border border-input bg-background text-xs text-center"
                          value={pt.radius}
                          onChange={e => updatePointRadius(zi, pi, parseFloat(e.target.value) || 10)}
                        />
                        <span className="text-xs text-muted-foreground">км</span>
                        <button onClick={() => removePoint(zi, pi)} className="ml-1 text-muted-foreground hover:text-destructive transition-colors">
                          <Icon name="X" size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Добавить точку */}
              <div className="flex gap-1.5">
                <input
                  className="flex-1 h-7 px-2 rounded-lg border border-input bg-background text-xs placeholder:text-muted-foreground"
                  placeholder="Адрес, напр. Звенигород"
                  value={addressInputs[zi]}
                  onChange={e => setAddressInputs(prev => { const a = [...prev]; a[zi] = e.target.value; return a; })}
                  onKeyDown={e => e.key === 'Enter' && geocodeAddress(zi, addressInputs[zi])}
                />
                <Button
                  size="sm" variant="outline"
                  className="h-7 px-2 text-xs shrink-0"
                  disabled={!addressInputs[zi].trim() || geocoding === zi}
                  onClick={() => geocodeAddress(zi, addressInputs[zi])}
                >
                  {geocoding === zi ? <Icon name="Loader" size={12} className="animate-spin" /> : <Icon name="Search" size={12} />}
                </Button>
                <Button
                  size="sm" variant={clickMode === zi ? 'default' : 'outline'}
                  className="h-7 px-2 text-xs shrink-0"
                  onClick={() => setClickMode(clickMode === zi ? null : zi)}
                  title="Кликнуть на карте"
                >
                  <Icon name="MousePointerClick" size={12} />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <Button disabled={saving} onClick={onSave} className="w-full">
        <Icon name="Check" size={14} className="mr-1.5" />
        {saving ? 'Сохраняем...' : 'Сохранить зоны'}
      </Button>
    </div>
  );
}
