import { useEffect, useRef, useState } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any */

const ZONES_URL       = 'https://functions.poehali.dev/0092227c-949a-4bfa-afca-6c591a34e572';
const PRICE_ZONES_URL = 'https://functions.poehali.dev/03fb0c39-d302-40a1-82c6-b87dcc1b4071';

interface ServiceZone {
  id: number; name: string; color: string; opacity: number;
  zone_type: 'circle' | 'polygon'; coordinates: [number, number][];
  center_lat: number | null; center_lon: number | null; radius_km: number | null; active: boolean;
}
interface WorkPoint { lat: number; lon: number; address: string; r1_km: number; r2_km: number; r3_km: number; }
interface PriceConfig {
  ring1_factor: number; ring1_label: string;
  ring2_factor: number; ring2_label: string;
  ring3_factor: number; ring3_label: string;
  points: WorkPoint[];
  active: boolean;
}

declare global { interface Window { ymaps: any; } }

interface Props { apiKey?: string; height?: string; className?: string; }

// Градиент: зелёный → жёлтый → красный через промежуточные слои
// Рисуем много тонких колец с убывающей прозрачностью — имитируем плавный переход
const GRADIENT_STEPS = 18;

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return [r,g,b];
}
function lerp(a: number, b: number, t: number) { return Math.round(a + (b-a)*t); }
function rgbToHex(r: number, g: number, b: number) {
  return '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
}

// Интерполяция цвета по позиции 0..1 (зелёный→жёлтый→красный)
function gradientColor(t: number): string {
  const green  = hexToRgb('#22c55e');
  const yellow = hexToRgb('#eab308');
  const red    = hexToRgb('#ef4444');
  if (t <= 0.5) {
    const tt = t / 0.5;
    return rgbToHex(lerp(green[0],yellow[0],tt), lerp(green[1],yellow[1],tt), lerp(green[2],yellow[2],tt));
  } else {
    const tt = (t - 0.5) / 0.5;
    return rgbToHex(lerp(yellow[0],red[0],tt), lerp(yellow[1],red[1],tt), lerp(yellow[2],red[2],tt));
  }
}

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

    const hasPoints = priceConfig?.active && (priceConfig.points?.length ?? 0) > 0;
    const hasPolygon = zones.some(z => z.active && z.zone_type === 'polygon' && z.coordinates?.length > 2);
    if (!hasPoints && !hasPolygon) return;

    window.ymaps.ready(() => {
      if (mapInstance.current) mapInstance.current.destroy();

      const center = hasPoints && priceConfig!.points.length > 0
        ? [priceConfig!.points[0].lat, priceConfig!.points[0].lon]
        : [55.7328, 36.8517];

      const map = new window.ymaps.Map(mapRef.current, {
        center, zoom: 9,
        controls: ['zoomControl', 'fullscreenControl'],
      }, { suppressMapOpenBlock: true });

      mapInstance.current = map;

      // Рисуем градиентные кольца для каждой рабочей точки
      if (hasPoints) {
        priceConfig!.points.forEach(pt => {
          const maxR = pt.r3_km * 1000;

          // Рисуем от большего к меньшему — GRADIENT_STEPS слоёв
          for (let step = GRADIENT_STEPS; step >= 0; step--) {
            const t = step / GRADIENT_STEPS; // 1 = край (красный), 0 = центр (зелёный)
            const radius = maxR * t;
            if (radius < 100) continue;

            const color = gradientColor(t);
            // Непрозрачность: у центра плотнее, к краям тоньше
            const opacity = 0.18 - t * 0.08;

            const circle = new window.ymaps.Circle(
              [[pt.lat, pt.lon], radius],
              {},
              {
                fillColor: color + '00', // заливка прозрачная — только обводка
                strokeColor: color,
                strokeWidth: maxR / GRADIENT_STEPS / 1000 * 80 + 2, // толщина пропорциональна шагу
                strokeOpacity: opacity,
                fillOpacity: 0,
                cursor: 'default',
                interactivityModel: 'default#transparent',
              }
            );
            map.geoObjects.add(circle);
          }

          // Невидимый большой круг для hover-событий
          const ringDefs = [
            { km: pt.r3_km, factor: priceConfig!.ring3_factor, label: priceConfig!.ring3_label },
            { km: pt.r2_km, factor: priceConfig!.ring2_factor, label: priceConfig!.ring2_label },
            { km: pt.r1_km, factor: priceConfig!.ring1_factor, label: priceConfig!.ring1_label },
          ];
          ringDefs.forEach(({ km, factor, label }) => {
            const hit = new window.ymaps.Circle(
              [[pt.lat, pt.lon], km * 1000],
              { hintContent: `${label} — ×${factor}` },
              {
                fillColor: '#ffffff01',
                strokeColor: 'transparent',
                strokeWidth: 0,
                fillOpacity: 0.01,
                cursor: 'default',
              }
            );
            hit.events.add('mouseenter', () => setHovered({ label, factor }));
            hit.events.add('mouseleave', () => setHovered(null));
            map.geoObjects.add(hit);
          });
        });
      }

      // Полигон зоны выезда поверх (контур)
      zones.filter(z => z.active && z.zone_type === 'polygon' && z.coordinates?.length > 2).forEach(zone => {
        const coords = zone.coordinates.map(c => [c[0], c[1]]);
        const polygon = new window.ymaps.Polygon([coords], {}, {
          fillColor: '#ffffff00',
          strokeColor: '#16a34a',
          strokeWidth: 2,
          strokeStyle: 'dash',
          fillOpacity: 0,
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

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-border ${className}`} style={{ height }}>
      <div ref={mapRef} className="w-full h-full" />

      {/* Легенда */}
      {priceConfig?.active && priceConfig.points.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm rounded-xl shadow-lg p-3 max-w-[190px]">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Зоны выезда</p>
          <div className="space-y-1.5">
            {[
              { label: priceConfig.ring1_label, factor: priceConfig.ring1_factor, color: '#22c55e' },
              { label: priceConfig.ring2_label, factor: priceConfig.ring2_factor, color: '#eab308' },
              { label: priceConfig.ring3_label, factor: priceConfig.ring3_factor, color: '#ef4444' },
            ].map((r, i) => (
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
