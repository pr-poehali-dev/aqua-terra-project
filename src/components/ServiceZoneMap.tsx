import { useEffect, useRef, useState } from 'react';

const ZONES_URL = 'https://functions.poehali.dev/0092227c-949a-4bfa-afca-6c591a34e572';

interface Zone {
  id: number;
  name: string;
  color: string;
  opacity: number;
  zone_type: 'circle' | 'polygon';
  coordinates: [number, number][];
  center_lat: number | null;
  center_lon: number | null;
  radius_km: number | null;
  active: boolean;
}

declare global {
  interface Window {
    ymaps: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  }
}

interface Props {
  apiKey?: string;
  height?: string;
  className?: string;
}

export default function ServiceZoneMap({ apiKey, height = '420px', className = '' }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [zones, setZones] = useState<Zone[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [activeZone, setActiveZone] = useState<string | null>(null);

  // Загружаем зоны
  useEffect(() => {
    fetch(ZONES_URL).then(r => r.json()).then(setZones).catch(() => {});
  }, []);

  // Подгружаем Яндекс Карты
  useEffect(() => {
    if (!apiKey) return;
    if (window.ymaps) { setLoaded(true); return; }

    const existing = document.querySelector('script[src*="api-maps.yandex.ru"]');
    if (existing) {
      existing.addEventListener('load', () => setLoaded(true));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU`;
    script.async = true;
    script.onload = () => setLoaded(true);
    script.onerror = () => setError('Не удалось загрузить карту');
    document.head.appendChild(script);
  }, [apiKey]);

  // Инициализируем карту
  useEffect(() => {
    if (!loaded || !mapRef.current || zones.length === 0) return;

    window.ymaps.ready(() => {
      if (mapInstance.current) {
        mapInstance.current.destroy();
      }

      const map = new window.ymaps.Map(mapRef.current, {
        center: [55.7328, 36.8517], // Звенигород
        zoom: 9,
        controls: ['zoomControl', 'fullscreenControl'],
      }, {
        suppressMapOpenBlock: true,
      });

      mapInstance.current = map;

      zones.filter(z => z.active).forEach(zone => {
        if (zone.zone_type === 'circle' && zone.center_lat && zone.center_lon && zone.radius_km) {
          const circle = new window.ymaps.Circle(
            [[zone.center_lat, zone.center_lon], zone.radius_km * 1000],
            { hintContent: zone.name },
            {
              fillColor: zone.color + '44',
              strokeColor: zone.color,
              strokeWidth: 2,
              strokeStyle: 'solid',
              fillOpacity: zone.opacity,
            }
          );
          circle.events.add('mouseenter', () => setActiveZone(zone.name));
          circle.events.add('mouseleave', () => setActiveZone(null));
          map.geoObjects.add(circle);
        }

        if (zone.zone_type === 'polygon' && zone.coordinates?.length > 2) {
          // ymaps ожидает [lat, lon]
          const coords = zone.coordinates.map(c => [c[0], c[1]]);
          const polygon = new window.ymaps.Polygon(
            [coords],
            { hintContent: zone.name },
            {
              fillColor: zone.color + '44',
              strokeColor: zone.color,
              strokeWidth: 2,
              fillOpacity: zone.opacity,
            }
          );
          polygon.events.add('mouseenter', () => setActiveZone(zone.name));
          polygon.events.add('mouseleave', () => setActiveZone(null));
          map.geoObjects.add(polygon);
        }
      });
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.destroy();
        mapInstance.current = null;
      }
    };
  }, [loaded, zones]);

  if (!apiKey) {
    return (
      <div className={`rounded-2xl overflow-hidden bg-muted/50 border border-border flex items-center justify-center ${className}`} style={{ height }}>
        <div className="text-center p-8 text-muted-foreground">
          <div className="text-4xl mb-3">🗺️</div>
          <p className="font-medium text-foreground mb-1">Карта зон обслуживания</p>
          <p className="text-sm">Добавьте YANDEX_MAPS_KEY в настройках для отображения карты</p>
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

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-border ${className}`} style={{ height }}>
      <div ref={mapRef} className="w-full h-full" />

      {/* Легенда */}
      <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm rounded-xl shadow-lg p-3 max-w-[220px]">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Зоны выезда</p>
        <div className="space-y-1.5">
          {zones.filter(z => z.active).map(zone => (
            <div key={zone.id}
              className={`flex items-center gap-2 text-xs transition-colors ${activeZone === zone.name ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
              <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: zone.color }} />
              {zone.name}
            </div>
          ))}
        </div>
      </div>

      {/* Тултип при наведении */}
      {activeZone && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-xl shadow-lg pointer-events-none">
          {activeZone}
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
