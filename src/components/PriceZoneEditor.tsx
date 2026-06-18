import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface WorkPoint {
  lat: number; lon: number; address: string;
  r1_km: number; r2_km: number; r3_km: number;
}

export interface PriceZoneConfig {
  ring1_factor: number; ring1_label: string;
  ring2_factor: number; ring2_label: string;
  ring3_factor: number; ring3_label: string;
  points: WorkPoint[];
  active: boolean;
}

interface Props {
  config: PriceZoneConfig;
  apiKey: string;
  saving: boolean;
  onChange: (c: PriceZoneConfig) => void;
  onSave: () => void;
}

const RINGS = [
  { color: '#22c55e', stroke: '#16a34a', dot: 'bg-green-500',  label: 'Зелёная' },
  { color: '#eab308', stroke: '#ca8a04', dot: 'bg-yellow-500', label: 'Жёлтая' },
  { color: '#ef4444', stroke: '#dc2626', dot: 'bg-red-500',    label: 'Красная' },
];

const DEFAULT_RADII = { r1_km: 10, r2_km: 25, r3_km: 50 };

export default function PriceZoneEditor({ config, apiKey, saving, onChange, onSave }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInst = useRef<any>(null);
  const circlesRef = useRef<any[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [addressInput, setAddressInput] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  const [clickMode, setClickMode] = useState(false);
  const [expandedPoint, setExpandedPoint] = useState<number | null>(null);

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

  // Перерисовка кругов (от большего к меньшему, градиент через несколько слоёв)
  const redraw = useCallback(() => {
    if (!mapInst.current) return;
    const ymaps = (window as any).ymaps;
    circlesRef.current.forEach(c => mapInst.current.geoObjects.remove(c));
    circlesRef.current = [];

    config.points.forEach(pt => {
      const radii = [
        { km: pt.r3_km, ri: 2 },
        { km: pt.r2_km, ri: 1 },
        { km: pt.r1_km, ri: 0 },
      ];
      radii.forEach(({ km, ri }) => {
        const ring = RINGS[ri];
        const circle = new ymaps.Circle(
          [[pt.lat, pt.lon], km * 1000],
          {},
          {
            fillColor: ring.color + '28',
            strokeColor: 'transparent',
            strokeWidth: 0,
            fillOpacity: 0.32,
          }
        );
        mapInst.current.geoObjects.add(circle);
        circlesRef.current.push(circle);
      });
    });
  }, [config]);

  // Инициализация карты
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const ymaps = (window as any).ymaps;
    if (mapInst.current) mapInst.current.destroy();
    const center = config.points.length > 0
      ? [config.points[0].lat, config.points[0].lon]
      : [55.73, 36.85];
    const map = new ymaps.Map(mapRef.current, {
      center, zoom: 9, controls: ['zoomControl'],
    }, { suppressMapOpenBlock: true });
    mapInst.current = map;
    redraw();
    return () => { if (mapInst.current) { mapInst.current.destroy(); mapInst.current = null; } };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady]);

  useEffect(() => { redraw(); }, [redraw]);

  // Клик по карте
  useEffect(() => {
    if (!mapInst.current) return;
    const map = mapInst.current;
    const handler = (e: any) => {
      if (!clickMode) return;
      const [lat, lon] = e.get('coords');
      const pt: WorkPoint = { lat, lon, address: `${lat.toFixed(4)}, ${lon.toFixed(4)}`, ...DEFAULT_RADII };
      onChange({ ...config, points: [...config.points, pt] });
      setClickMode(false);
    };
    map.events.add('click', handler);
    return () => map.events.remove('click', handler);
  }, [clickMode, config, onChange]);

  const geocodeAddress = async () => {
    if (!addressInput.trim() || !(window as any).ymaps) return;
    setGeocoding(true);
    try {
      const result = await (window as any).ymaps.geocode(addressInput, { results: 1 });
      const obj = result.geoObjects.get(0);
      if (!obj) return;
      const [lat, lon] = obj.geometry.getCoordinates();
      const address = obj.getAddressLine();
      const pt: WorkPoint = { lat, lon, address, ...DEFAULT_RADII };
      onChange({ ...config, points: [...config.points, pt] });
      setAddressInput('');
      if (mapInst.current) mapInst.current.setCenter([lat, lon], 10);
      setExpandedPoint(config.points.length); // открываем новую точку
    } finally {
      setGeocoding(false);
    }
  };

  const removePoint = (i: number) => {
    onChange({ ...config, points: config.points.filter((_, pi) => pi !== i) });
    if (expandedPoint === i) setExpandedPoint(null);
  };

  const updatePoint = (i: number, field: keyof WorkPoint, value: any) => {
    const points = config.points.map((p, pi) => pi === i ? { ...p, [field]: value } : p);
    onChange({ ...config, points });
  };

  const updateRing = (key: string, value: any) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="space-y-5">
      {/* Карта */}
      {apiKey ? (
        <div className="relative">
          {clickMode && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-foreground text-background text-xs font-medium px-3 py-2 rounded-xl shadow-lg flex items-center gap-2 pointer-events-none">
              <Icon name="MapPin" size={13} />Кликни на карте
              <button className="pointer-events-auto ml-1 opacity-60 hover:opacity-100" onClick={() => setClickMode(false)}>✕</button>
            </div>
          )}
          <div
            ref={mapRef}
            className={`w-full rounded-xl overflow-hidden border-2 transition-colors ${clickMode ? 'border-primary cursor-crosshair' : 'border-border'}`}
            style={{ height: 300 }}
          />
        </div>
      ) : (
        <div className="rounded-xl bg-muted p-4 text-sm text-muted-foreground text-center">
          Сначала сохраните ключ Яндекс Карт выше
        </div>
      )}

      {/* Добавить рабочую точку */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Рабочие точки</p>
        <div className="flex gap-2 mb-3">
          <input
            className="flex-1 h-9 px-3 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground"
            placeholder="Адрес или район"
            value={addressInput}
            onChange={e => setAddressInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && geocodeAddress()}
          />
          <Button size="sm" className="h-9 px-3 shrink-0" disabled={!addressInput.trim() || geocoding} onClick={geocodeAddress}>
            {geocoding ? <Icon name="Loader" size={14} className="animate-spin" /> : <Icon name="Search" size={14} />}
          </Button>
          <Button size="sm" variant={clickMode ? 'default' : 'outline'} className="h-9 px-3 shrink-0" onClick={() => setClickMode(!clickMode)}>
            <Icon name="MousePointerClick" size={14} />
          </Button>
        </div>

        {config.points.length === 0 && (
          <p className="text-xs text-muted-foreground">Добавь районы где уже работаешь — вокруг каждого построятся цветные кольца</p>
        )}

        <div className="space-y-2">
          {config.points.map((pt, i) => (
            <div key={i} className="rounded-xl border border-border bg-muted/20 overflow-hidden">
              {/* Строка точки */}
              <div
                className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/40 transition-colors"
                onClick={() => setExpandedPoint(expandedPoint === i ? null : i)}
              >
                <Icon name="MapPin" size={13} className="shrink-0 text-muted-foreground" />
                <span className="flex-1 text-xs text-foreground truncate">{pt.address}</span>
                <div className="flex gap-1 shrink-0">
                  <span className="text-[10px] text-green-600 font-mono">{pt.r1_km}km</span>
                  <span className="text-[10px] text-yellow-600 font-mono">{pt.r2_km}km</span>
                  <span className="text-[10px] text-red-600 font-mono">{pt.r3_km}km</span>
                </div>
                <Icon name={expandedPoint === i ? 'ChevronUp' : 'ChevronDown'} size={13} className="text-muted-foreground shrink-0" />
                <button onClick={e => { e.stopPropagation(); removePoint(i); }} className="text-muted-foreground hover:text-destructive transition-colors ml-0.5">
                  <Icon name="X" size={13} />
                </button>
              </div>
              {/* Радиусы */}
              {expandedPoint === i && (
                <div className="px-3 pb-3 pt-1 border-t border-border/50">
                  <p className="text-xs text-muted-foreground mb-2">Радиусы колец для этой точки</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { field: 'r1_km' as const, dot: 'bg-green-500', label: 'Зелёная' },
                      { field: 'r2_km' as const, dot: 'bg-yellow-500', label: 'Жёлтая' },
                      { field: 'r3_km' as const, dot: 'bg-red-500', label: 'Красная' },
                    ].map(({ field, dot, label }) => (
                      <div key={field}>
                        <div className="flex items-center gap-1 mb-1">
                          <span className={`w-2 h-2 rounded-full ${dot}`} />
                          <span className="text-[10px] text-muted-foreground">{label}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <input
                            type="number" step="5" min="1"
                            className="w-full h-7 px-2 rounded-lg border border-input bg-background text-xs text-center"
                            value={pt[field]}
                            onChange={e => updatePoint(i, field, parseFloat(e.target.value) || 1)}
                          />
                          <span className="text-xs text-muted-foreground shrink-0">км</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Глобальные коэффициенты */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Коэффициенты зон</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { factorKey: 'ring1_factor', labelKey: 'ring1_label', dot: 'bg-green-500' },
            { factorKey: 'ring2_factor', labelKey: 'ring2_label', dot: 'bg-yellow-500' },
            { factorKey: 'ring3_factor', labelKey: 'ring3_label', dot: 'bg-red-500' },
          ].map(({ factorKey, labelKey, dot }) => (
            <div key={factorKey} className="rounded-xl border border-border p-2.5 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dot}`} />
                <input
                  className="flex-1 min-w-0 h-6 px-1.5 rounded border border-input bg-background text-xs"
                  value={(config as any)[labelKey]}
                  onChange={e => updateRing(labelKey, e.target.value)}
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">×</span>
                <input
                  type="number" step="0.1" min="1"
                  className="flex-1 h-6 px-1 rounded border border-input bg-background text-xs text-center"
                  value={(config as any)[factorKey]}
                  onChange={e => updateRing(factorKey, parseFloat(e.target.value) || 1)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button disabled={saving} onClick={onSave} className="w-full">
        <Icon name="Check" size={14} className="mr-1.5" />
        {saving ? 'Сохраняем...' : 'Сохранить'}
      </Button>
    </div>
  );
}
