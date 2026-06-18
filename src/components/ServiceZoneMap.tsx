import { useEffect, useRef, useState } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any */

const ZONES_URL        = 'https://functions.poehali.dev/0092227c-949a-4bfa-afca-6c591a34e572';
const PRICE_ZONES_URL  = 'https://functions.poehali.dev/03fb0c39-d302-40a1-82c6-b87dcc1b4071';
const CLIENT_LOCS_URL  = 'https://functions.poehali.dev/44964b44-1bd2-44c9-8882-13aedf960431';

interface Zone {
  id: number; name: string; color: string; opacity: number;
  zone_type: 'circle' | 'polygon'; coordinates: [number, number][];
  center_lat: number | null; center_lon: number | null; radius_km: number | null; active: boolean;
}
interface PriceZoneItem { radius: number; factor: number; label: string; points?: { lat: number; lon: number; radius: number }[]; }
interface PriceZoneConfig { center_lat: number; center_lon: number; zones: PriceZoneItem[]; active: boolean; }
interface ClientLoc { lat: number; lon: number; radius_km: number; }

declare global { interface Window { ymaps: any; } }

interface Props { apiKey?: string; height?: string; className?: string; }

const ZONE_COLORS = [
  { fill: '#22c55e', stroke: '#16a34a' },
  { fill: '#eab308', stroke: '#ca8a04' },
  { fill: '#f97316', stroke: '#ea580c' },
  { fill: '#ef4444', stroke: '#dc2626' },
];

export default function ServiceZoneMap({ apiKey, height = '420px', className = '' }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [priceZones, setPriceZones] = useState<PriceZoneConfig | null>(null);
  const [clientLocs, setClientLocs] = useState<ClientLoc[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [activeZone, setActiveZone] = useState<{ label: string; factor: number } | null>(null);

  useEffect(() => {
    fetch(ZONES_URL).then(r => r.json()).then(setZones).catch(() => {});
    fetch(PRICE_ZONES_URL).then(r => r.json()).then(d => { if (d) setPriceZones(d); }).catch(() => {});
    fetch(CLIENT_LOCS_URL).then(r => r.json()).then(d => { if (Array.isArray(d)) setClientLocs(d); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!apiKey) return;
    const init = () => { if (window.ymaps) window.ymaps.ready(() => setLoaded(true)); };
    if (window.ymaps) { window.ymaps.ready(() => setLoaded(true)); return; }
    const existing = document.querySelector('script[src*="api-maps.yandex.ru"]');
    if (existing) { existing.addEventListener('load', init); return; }
    const script = document.createElement('script');
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU`;
    script.async = true;
    script.onload = init;
    script.onerror = () => setError('Не удалось загрузить карту');
    document.head.appendChild(script);
  }, [apiKey]);

  useEffect(() => {
    if (!loaded || !mapRef.current) return;

    const hasPriceZones = priceZones && priceZones.active && priceZones.zones?.some(z => (z.points || []).length > 0);
    const hasPolygon    = zones.some(z => z.active && z.zone_type === 'polygon' && z.coordinates?.length > 2);
    const hasClients    = clientLocs.length > 0;

    if (!hasPriceZones && !hasPolygon && !hasClients) return;

    window.ymaps.ready(() => {
      if (mapInstance.current) mapInstance.current.destroy();

      const centerLat = priceZones?.center_lat ?? 55.7328;
      const centerLon = priceZones?.center_lon ?? 36.8517;

      const map = new window.ymaps.Map(mapRef.current, {
        center: [centerLat, centerLon],
        zoom: 9,
        controls: ['zoomControl', 'fullscreenControl'],
      }, { suppressMapOpenBlock: true });

      mapInstance.current = map;

      // 1. Клиентские зоны (синие) — рисуем первыми (снизу)
      if (hasClients) {
        const sorted = [...clientLocs].sort((a, b) => b.radius_km - a.radius_km);
        sorted.forEach(loc => {
          const circle = new window.ymaps.Circle(
            [[loc.lat, loc.lon], loc.radius_km * 1000],
            { hintContent: 'Зона клиента' },
            {
              fillColor: '#3b82f628',
              strokeColor: '#2563eb',
              strokeWidth: 1.5,
              fillOpacity: 0.28,
              cursor: 'default',
            }
          );
          map.geoObjects.add(circle);
        });
      }

      // 2. Ценовые зоны (цветные кольца) поверх клиентских
      if (hasPriceZones) {
        const allCircles: { lat: number; lon: number; radius: number; zoneIdx: number; label: string; factor: number }[] = [];
        priceZones!.zones.forEach((zone, zi) => {
          (zone.points || []).forEach((pt: any) => {
            allCircles.push({ lat: pt.lat, lon: pt.lon, radius: pt.radius, zoneIdx: zi, label: zone.label, factor: zone.factor });
          });
        });
        allCircles.sort((a, b) => b.radius - a.radius);

        allCircles.forEach(({ lat, lon, radius, zoneIdx, label, factor }) => {
          const color = ZONE_COLORS[zoneIdx] || ZONE_COLORS[3];
          const circle = new window.ymaps.Circle(
            [[lat, lon], radius * 1000],
            { hintContent: `${label} — ×${factor}` },
            {
              fillColor: color.fill + '33',
              strokeColor: color.stroke,
              strokeWidth: 2,
              fillOpacity: 0.28,
              cursor: 'default',
            }
          );
          circle.events.add('mouseenter', () => setActiveZone({ label, factor }));
          circle.events.add('mouseleave', () => setActiveZone(null));
          map.geoObjects.add(circle);
        });
      }

      // 3. Полигон основной зоны выезда (сверху)
      zones.filter(z => z.active && z.zone_type === 'polygon' && z.coordinates?.length > 2).forEach(zone => {
        const coords = zone.coordinates.map(c => [c[0], c[1]]);
        const polygon = new window.ymaps.Polygon([coords], {}, {
          fillColor: '#22c55e22',
          strokeColor: '#16a34a',
          strokeWidth: 2.5,
          fillOpacity: 0.2,
        });
        map.geoObjects.add(polygon);
      });
    });

    return () => {
      if (mapInstance.current) { mapInstance.current.destroy(); mapInstance.current = null; }
    };
  }, [loaded, zones, priceZones, clientLocs]);

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

  const legendItems = priceZones?.active && priceZones.zones?.length === 4
    ? priceZones.zones.map((z, i) => ({ label: z.label, factor: z.factor, color: ZONE_COLORS[i].stroke }))
    : [];

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-border ${className}`} style={{ height }}>
      <div ref={mapRef} className="w-full h-full" />

      {/* Легенда */}
      {(legendItems.length > 0 || clientLocs.length > 0) && (
        <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm rounded-xl shadow-lg p-3 max-w-[210px]">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Зоны выезда</p>
          <div className="space-y-1.5">
            {clientLocs.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-blue-500" />
                География клиентов
              </div>
            )}
            {legendItems.map((item, i) => (
              <div key={i} className={`flex items-center justify-between gap-2 text-xs transition-colors ${activeZone?.label === item.label ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  {item.label}
                </div>
                <span className="font-mono text-[11px] opacity-70">×{item.factor}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Тултип при наведении */}
      {activeZone && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-foreground text-background text-sm font-medium px-4 py-2 rounded-xl shadow-lg pointer-events-none whitespace-nowrap">
          {activeZone.label} — коэффициент ×{activeZone.factor}
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
