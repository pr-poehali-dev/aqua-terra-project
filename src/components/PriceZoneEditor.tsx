import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface WorkPoint { lat: number; lon: number; address: string; }

export interface PriceZoneConfig {
  // Единые радиусы колец вокруг каждой рабочей точки
  ring1_km: number; ring1_factor: number; ring1_label: string;
  ring2_km: number; ring2_factor: number; ring2_label: string;
  ring3_km: number; ring3_factor: number; ring3_label: string;
  ring4_km: number; ring4_factor: number; ring4_label: string;
  // Рабочие точки — центры колец
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
  { key: 'ring1', fill: '#22c55e', stroke: '#16a34a', dot: 'bg-green-500',  bg: 'bg-green-500/10 border-green-500/30' },
  { key: 'ring2', fill: '#eab308', stroke: '#ca8a04', dot: 'bg-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/30' },
  { key: 'ring3', fill: '#f97316', stroke: '#ea580c', dot: 'bg-orange-500', bg: 'bg-orange-500/10 border-orange-500/30' },
  { key: 'ring4', fill: '#ef4444', stroke: '#dc2626', dot: 'bg-red-500',    bg: 'bg-red-500/10 border-red-500/30' },
] as const;

export default function PriceZoneEditor({ config, apiKey, saving, onChange, onSave }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInst = useRef<any>(null);
  const circlesRef = useRef<any[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [addressInput, setAddressInput] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  const [clickMode, setClickMode] = useState(false);

  const rings = [
    { km: config.ring1_km, factor: config.ring1_factor, label: config.ring1_label },
    { km: config.ring2_km, factor: config.ring2_factor, label: config.ring2_label },
    { km: config.ring3_km, factor: config.ring3_factor, label: config.ring3_label },
    { km: config.ring4_km, factor: config.ring4_factor, label: config.ring4_label },
  ];

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

  // Перерисовка
  const redraw = useCallback(() => {
    if (!mapInst.current) return;
    const ymaps = (window as any).ymaps;
    circlesRef.current.forEach(c => mapInst.current.geoObjects.remove(c));
    circlesRef.current = [];

    // Рисуем от большего кольца к меньшему
    const ringKms = [config.ring4_km, config.ring3_km, config.ring2_km, config.ring1_km];
    const ringIdxOrder = [3, 2, 1, 0];

    config.points.forEach(pt => {
      ringIdxOrder.forEach(ri => {
        const km = ringKms[3 - ri];
        const color = RINGS[ri];
        const circle = new ymaps.Circle(
          [[pt.lat, pt.lon], km * 1000],
          {},
          { fillColor: color.fill + '2a', strokeColor: color.stroke, strokeWidth: 1.5, fillOpacity: 0.28 }
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
      const address = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
      onChange({ ...config, points: [...config.points, { lat, lon, address }] });
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
      onChange({ ...config, points: [...config.points, { lat, lon, address }] });
      setAddressInput('');
      if (mapInst.current) mapInst.current.setCenter([lat, lon], 10);
    } finally {
      setGeocoding(false);
    }
  };

  const removePoint = (i: number) => {
    onChange({ ...config, points: config.points.filter((_, pi) => pi !== i) });
  };

  const setRingField = (ringKey: string, field: string, value: any) => {
    onChange({ ...config, [`${ringKey}_${field}`]: value });
  };

  return (
    <div className="space-y-5">
      {/* Карта */}
      {apiKey ? (
        <div className="relative">
          {clickMode && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-foreground text-background text-xs font-medium px-3 py-2 rounded-xl shadow-lg flex items-center gap-2">
              <Icon name="MapPin" size={13} />
              Кликни на карте — добавится рабочая точка
              <button className="pointer-events-auto ml-1 opacity-60 hover:opacity-100" onClick={() => setClickMode(false)}>✕</button>
            </div>
          )}
          <div
            ref={mapRef}
            className={`w-full rounded-xl overflow-hidden border-2 transition-colors ${clickMode ? 'border-primary cursor-crosshair' : 'border-border'}`}
            style={{ height: 340 }}
          />
        </div>
      ) : (
        <div className="rounded-xl bg-muted p-4 text-sm text-muted-foreground text-center">
          Сначала сохраните ключ Яндекс Карт
        </div>
      )}

      {/* Добавить рабочую точку */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Рабочие точки</p>
        <div className="flex gap-2 mb-2">
          <input
            className="flex-1 h-9 px-3 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground"
            placeholder="Район, адрес или город"
            value={addressInput}
            onChange={e => setAddressInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && geocodeAddress()}
          />
          <Button size="sm" className="h-9 px-3 shrink-0" disabled={!addressInput.trim() || geocoding} onClick={geocodeAddress}>
            {geocoding ? <Icon name="Loader" size={14} className="animate-spin" /> : <Icon name="Search" size={14} />}
          </Button>
          <Button size="sm" variant={clickMode ? 'default' : 'outline'} className="h-9 px-3 shrink-0" onClick={() => setClickMode(!clickMode)} title="Кликнуть на карте">
            <Icon name="MousePointerClick" size={14} />
          </Button>
        </div>

        {config.points.length === 0 && (
          <p className="text-xs text-muted-foreground">Добавь районы, где уже работаешь — вокруг каждого построятся цветные кольца</p>
        )}
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {config.points.map((pt, i) => (
            <div key={i} className="flex items-center gap-2 bg-muted/40 rounded-lg px-3 py-1.5">
              <Icon name="MapPin" size={12} className="shrink-0 text-muted-foreground" />
              <span className="flex-1 text-xs text-foreground truncate">{pt.address}</span>
              <button onClick={() => removePoint(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                <Icon name="X" size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Радиусы и коэффициенты колец */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Кольца вокруг каждой точки</p>
        <div className="space-y-2">
          {RINGS.map((ring, i) => {
            const km = (config as any)[`${ring.key}_km`];
            const factor = (config as any)[`${ring.key}_factor`];
            const label = (config as any)[`${ring.key}_label`];
            return (
              <div key={ring.key} className={`rounded-xl border p-3 ${ring.bg}`}>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`w-3 h-3 rounded-full shrink-0 ${ring.dot}`} />
                  <input
                    className="flex-1 min-w-[100px] h-7 px-2 rounded-lg border border-input bg-background text-xs"
                    value={label}
                    placeholder={`Зона ${i + 1}`}
                    onChange={e => setRingField(ring.key, 'label', e.target.value)}
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-xs text-muted-foreground">до</span>
                    <input
                      type="number" step="5" min="1"
                      className="w-14 h-7 px-1 rounded-lg border border-input bg-background text-xs text-center"
                      value={km}
                      onChange={e => setRingField(ring.key, 'km', parseFloat(e.target.value) || 1)}
                    />
                    <span className="text-xs text-muted-foreground">км</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-xs text-muted-foreground">×</span>
                    <input
                      type="number" step="0.1" min="1"
                      className="w-14 h-7 px-1 rounded-lg border border-input bg-background text-xs text-center"
                      value={factor}
                      onChange={e => setRingField(ring.key, 'factor', parseFloat(e.target.value) || 1)}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Button disabled={saving} onClick={onSave} className="w-full">
        <Icon name="Check" size={14} className="mr-1.5" />
        {saving ? 'Сохраняем...' : 'Сохранить'}
      </Button>
    </div>
  );
}
