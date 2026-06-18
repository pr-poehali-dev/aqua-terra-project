import { useEffect, useRef, useState } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any */

const ZONES_URL       = 'https://functions.poehali.dev/0092227c-949a-4bfa-afca-6c591a34e572';
const PRICE_ZONES_URL = 'https://functions.poehali.dev/03fb0c39-d302-40a1-82c6-b87dcc1b4071';

interface ServiceZone {
  id: number; name: string; color: string; opacity: number;
  zone_type: 'circle' | 'polygon'; coordinates: [number, number][];
  center_lat: number | null; center_lon: number | null; radius_km: number | null; active: boolean;
}
interface PriceConfig {
  ring1_km: number; ring1_factor: number; ring1_label: string;
  ring2_km: number; ring2_factor: number; ring2_label: string;
  ring3_km: number; ring3_factor: number; ring3_label: string;
  ring4_km: number; ring4_factor: number; ring4_label: string;
  points: { lat: number; lon: number; address: string }[];
  active: boolean;
}

declare global { interface Window { ymaps: any; } }

interface Props { apiKey?: string; height?: string; className?: string; }

const RINGS = [
  { fill: '#22c55e', stroke: '#16a34a' },
  { fill: '#eab308', stroke: '#ca8a04' },
  { fill: '#f97316', stroke: '#ea580c' },
  { fill: '#ef4444', stroke: '#dc2626' },
];

export default function ServiceZoneMap({ apiKey, height = '420px', className = '' }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [zones, setZones] = useState<ServiceZone[]>([]);
  const [priceConfig, setPriceConfig] = useState<PriceConfig | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [hovered, setHovered] = useState<{ label: string; factor: number } | null>(null);

  useEffect(() => {
    fetch(ZONES_URL).then(r => r.json()).then(setZones).catch(() => {});
    fetch(PRICE_ZONES_URL).then(r => r.json()).then(d => { if (d) setPriceConfig(d); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!apiKey) return;
    const init = () => { if (window.ymaps) window.ymaps.ready(() => setLoaded(true)); };
    if (window.ymaps) { window.ymaps.ready(() => setLoaded(true)); return; }
    const existing = document.querySelector('script[src*="api-maps.yandex.ru"]');
    if (existing) { existing.addEventListener('load', init); return; }
    const s = document.createElement('script');
    s.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU`;
    s.async = true; s.onload = init;
    s.onerror = () => setError('Не удалось загрузить карту');
    document.head.appendChild(s);
  }, [apiKey]);

  useEffect(() => {
    if (!loaded || !mapRef.current) return;

    const hasRings = priceConfig?.active && (priceConfig.points?.length ?? 0) > 0;
    const hasPolygon = zones.some(z => z.active && z.zone_type === 'polygon' && z.coordinates?.length > 2);
    if (!hasRings && !hasPolygon) return;

    window.ymaps.ready(() => {
      if (mapInstance.current) mapInstance.current.destroy();

      // Центр карты — первая рабочая точка или Звенигород
      const center = hasRings && priceConfig!.points.length > 0
        ? [priceConfig!.points[0].lat, priceConfig!.points[0].lon]
        : [55.7328, 36.8517];

      const map = new window.ymaps.Map(mapRef.current, {
        center, zoom: 9,
        controls: ['zoomControl', 'fullscreenControl'],
      }, { suppressMapOpenBlock: true });

      mapInstance.current = map;

      // Рисуем кольца вокруг рабочих точек — от большего к меньшему
      if (hasRings) {
        const ringDefs = [
          { km: priceConfig!.ring4_km, factor: priceConfig!.ring4_factor, label: priceConfig!.ring4_label, ri: 3 },
          { km: priceConfig!.ring3_km, factor: priceConfig!.ring3_factor, label: priceConfig!.ring3_label, ri: 2 },
          { km: priceConfig!.ring2_km, factor: priceConfig!.ring2_factor, label: priceConfig!.ring2_label, ri: 1 },
          { km: priceConfig!.ring1_km, factor: priceConfig!.ring1_factor, label: priceConfig!.ring1_label, ri: 0 },
        ];

        ringDefs.forEach(({ km, factor, label, ri }) => {
          const color = RINGS[ri];
          priceConfig!.points.forEach(pt => {
            const circle = new window.ymaps.Circle(
              [[pt.lat, pt.lon], km * 1000],
              { hintContent: `${label} — ×${factor}` },
              {
                fillColor: color.fill + '2e',
                strokeColor: color.stroke,
                strokeWidth: 1.5,
                fillOpacity: 0.28,
                cursor: 'default',
              }
            );
            circle.events.add('mouseenter', () => setHovered({ label, factor }));
            circle.events.add('mouseleave', () => setHovered(null));
            map.geoObjects.add(circle);
          });
        });
      }

      // Полигон зоны выезда поверх
      zones.filter(z => z.active && z.zone_type === 'polygon' && z.coordinates?.length > 2).forEach(zone => {
        const coords = zone.coordinates.map(c => [c[0], c[1]]);
        const polygon = new window.ymaps.Polygon([coords], {}, {
          fillColor: '#22c55e1a',
          strokeColor: '#16a34a',
          strokeWidth: 2,
          fillOpacity: 0.15,
        });
        map.geoObjects.add(polygon);
      });
    });

    return () => { if (mapInstance.current) { mapInstance.current.destroy(); mapInstance.current = null; } };
  }, [loaded, zones, priceConfig]);

  if (!apiKey) {
    return (
      <div className={`rounded-2xl overflow-hidden bg-muted/50 border border-border flex items-center justify-center ${className}`} style={{ height }}>
        <div className="text-center p-8 text-muted-foreground">
          <div className="text-4xl mb-3">🗺️</div>
          <p className="font-medium text-foreground mb-1">Карта зон обслуживания</p>
          <p className="text-sm">Ключ Яндекс Карт не настроен</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-2xl bg-muted/50 border border-border flex items-center justify-center ${className}`} style={{ height }}>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  const legendRings = priceConfig?.active ? [
    { label: priceConfig.ring1_label, factor: priceConfig.ring1_factor, color: RINGS[0].stroke },
    { label: priceConfig.ring2_label, factor: priceConfig.ring2_factor, color: RINGS[1].stroke },
    { label: priceConfig.ring3_label, factor: priceConfig.ring3_factor, color: RINGS[2].stroke },
    { label: priceConfig.ring4_label, factor: priceConfig.ring4_factor, color: RINGS[3].stroke },
  ] : [];

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-border ${className}`} style={{ height }}>
      <div ref={mapRef} className="w-full h-full" />

      {legendRings.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm rounded-xl shadow-lg p-3 max-w-[200px]">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Зоны выезда</p>
          <div className="space-y-1.5">
            {legendRings.map((r, i) => (
              <div key={i} className={`flex items-center justify-between gap-2 text-xs transition-colors ${hovered?.label === r.label ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
                  {r.label}
                </div>
                <span className="font-mono text-[11px] opacity-70">×{r.factor}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {hovered && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-foreground text-background text-sm font-medium px-4 py-2 rounded-xl shadow-lg pointer-events-none whitespace-nowrap">
          {hovered.label} — коэффициент ×{hovered.factor}
        </div>
      )}

      {!loaded && (
        <div className="absolute inset-0 bg-muted/80 flex items-center justify-center rounded-2xl">
          <div className="text-sm text-muted-foreground animate-pulse">Загружаем карту…</div>
        </div>
      )}
    </div>
  );
}
