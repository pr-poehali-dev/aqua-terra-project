import { useEffect, useRef, useState } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any */

const ZONES_URL       = 'https://functions.poehali.dev/0092227c-949a-4bfa-afca-6c591a34e572';
const PRICE_ZONES_URL = 'https://functions.poehali.dev/03fb0c39-d302-40a1-82c6-b87dcc1b4071';

interface ServiceZone {
  id: number; name: string; color: string; opacity: number;
  zone_type: 'circle' | 'polygon'; coordinates: [number, number][];
  center_lat: number | null; center_lon: number | null; radius_km: number | null; active: boolean;
}
interface WorkPoint { lat: number; lon: number; address: string; }
interface PriceConfig {
  ring1_factor: number; ring1_label: string;
  ring2_factor: number; ring2_label: string;
  ring3_factor: number; ring3_label: string;
  r1_km: number; r2_km: number; r3_km: number;
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
  const mapBuilt = useRef(false);
  const zonesRef = useRef<ServiceZone[]>([]);
  const priceRef = useRef<PriceConfig | null>(null);
  const [zones, setZones] = useState<ServiceZone[]>([]);
  const [priceConfig, setPriceConfig] = useState<PriceConfig | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(ZONES_URL).then(r => r.json()).then(d => { zonesRef.current = d; setZones(d); }).catch(() => {});
    fetch(PRICE_ZONES_URL).then(r => r.json()).then(d => { if (d) { priceRef.current = d; setPriceConfig(d); } }).catch(() => {});
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
    if (!loaded || !mapRef.current || mapBuilt.current) return;

    const hasPoints = priceRef.current?.active && (priceRef.current.points?.length ?? 0) > 0;
    const hasPolygon = zonesRef.current.some(z => z.active && z.zone_type === 'polygon' && z.coordinates?.length > 2);
    if (!hasPoints && !hasPolygon) return;

    mapBuilt.current = true;

    window.ymaps.ready(() => {
      if (mapInstance.current) mapInstance.current.destroy();

      const pc = priceRef.current!;
      const zs = zonesRef.current;
      const center = hasPoints && pc.points.length > 0
        ? [pc.points[0].lat, pc.points[0].lon]
        : [55.7328, 36.8517];

      const map = new window.ymaps.Map(mapRef.current, {
        center, zoom: 9,
        controls: ['zoomControl', 'fullscreenControl'],
      }, { suppressMapOpenBlock: true });

      // Отключаем зум колесом мыши — кнопки +/- работают
      map.behaviors.disable('scrollZoom');

      mapInstance.current = map;

      // Рисуем градиентные зоны через Canvas-оверлей поверх тайлов (не перехватывает мышь)
      if (hasPoints) {
        const drawZones = () => {
          const mapEl = mapRef.current!;
          const W = mapEl.offsetWidth;
          const H = mapEl.offsetHeight;

          // Удаляем старый canvas если есть
          const old = mapEl.querySelector('canvas.zone-canvas');
          if (old) old.remove();

          const canvas = document.createElement('canvas');
          canvas.className = 'zone-canvas';
          canvas.width = W;
          canvas.height = H;
          canvas.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;z-index:1;';
          mapEl.appendChild(canvas);

          const ctx = canvas.getContext('2d')!;

          // Общие параметры проекции
          const proj = map.options.get('projection');
          const zoom = map.getZoom();
          const mapGlobalCenter = proj.toGlobalPixels(map.getCenter(), zoom);
          const halfW = W / 2;
          const halfH = H / 2;
          const toPage = (coord: number[]) => {
            const gp = proj.toGlobalPixels(coord, zoom);
            return [gp[0] - mapGlobalCenter[0] + halfW, gp[1] - mapGlobalCenter[1] + halfH];
          };

          const toRpx = (coord: number[], distM: number) => {
            const edge = window.ymaps.coordSystem.geo.solveDirectProblem(coord, [0, 1], distM).endPoint;
            const [ex, ey] = toPage(edge);
            const [bx, by] = toPage(coord);
            return Math.sqrt((ex-bx)**2 + (ey-by)**2);
          };

          const r1m = (pc.r1_km ?? 10) * 1000;
          const r2m = (pc.r2_km ?? 25) * 1000;
          const r3m = (pc.r3_km ?? 50) * 1000;

          // Для каждого пикселя находим минимальное расстояние до любой точки (нормализованное)
          // Быстро: рисуем через ImageData только в зоне видимых точек
          const points2d = pc.points.map(pt => {
            const [cx, cy] = toPage([pt.lat, pt.lon]);
            const rPx = toRpx([pt.lat, pt.lon], r3m);
            return { cx, cy, rPx };
          });

          const imgData = ctx.createImageData(W, H);
          const d = imgData.data;

          for (let y = 0; y < H; y++) {
            for (let x = 0; x < W; x++) {
              let minDist = Infinity;
              let minRpx = 1;
              for (const pt of points2d) {
                const dist = Math.sqrt((x - pt.cx) ** 2 + (y - pt.cy) ** 2);
                if (dist < minDist) { minDist = dist; minRpx = pt.rPx; }
              }
              const t = minDist / minRpx; // 0=центр, 1=край r3
              if (t >= 1) continue;

              const t1 = r1m / r3m;
              const t2 = r2m / r3m;
              let r, g, b;
              if (t < t1) {
                r = 34; g = 197; b = 94;
              } else if (t < t2) {
                const f = (t - t1) / (t2 - t1);
                r = Math.round(34 + (234-34)*f);
                g = Math.round(197 + (179-197)*f);
                b = Math.round(94 + (8-94)*f);
              } else {
                const f = (t - t2) / (1 - t2);
                r = Math.round(234 + (239-234)*f);
                g = Math.round(179 + (68-179)*f);
                b = Math.round(8 + (50-8)*f);
              }
              // Равномерная яркость по всем зонам, спад только у самого края
              const a = Math.round((t < 0.85 ? 0.52 : (1 - t) / 0.15 * 0.52) * 255);
              const i = (y * W + x) * 4;
              d[i]=r; d[i+1]=g; d[i+2]=b; d[i+3]=a;
            }
          }
          ctx.putImageData(imgData, 0, 0);
        };

        drawZones();
        map.events.add(['boundschange', 'sizechange'], drawZones);
      }

      // Полигон зоны выезда поверх (контур)
      zs.filter(z => z.active && z.zone_type === 'polygon' && z.coordinates?.length > 2).forEach(zone => {
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

    return () => { if (mapInstance.current) { mapInstance.current.destroy(); mapInstance.current = null; mapBuilt.current = false; } };
   
  }, [loaded, zones.length, priceConfig?.points?.length]);

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
    <div className={`relative rounded-2xl border border-border ${className}`} style={{ height, overflow: 'clip' }}>
      <div ref={mapRef} className="w-full h-full" />



      {!loaded && (
        <div className="absolute inset-0 bg-muted/80 flex items-center justify-center rounded-2xl">
          <div className="text-sm text-muted-foreground animate-pulse">Загружаем карту…</div>
        </div>
      )}
    </div>
  );
}