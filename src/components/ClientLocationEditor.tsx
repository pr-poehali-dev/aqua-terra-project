import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

/* eslint-disable @typescript-eslint/no-explicit-any */

const CLIENT_LOC_URL = 'https://functions.poehali.dev/44964b44-1bd2-44c9-8882-13aedf960431';
const ZONE_COLOR = { fill: '#3b82f6', stroke: '#2563eb' }; // синий для клиентских зон

export interface ClientLocation {
  id: number;
  address: string;
  lat: number;
  lon: number;
  radius_km: number;
  active: boolean;
}

interface Props {
  apiKey: string;
  adminToken: string;
}

export default function ClientLocationEditor({ apiKey, adminToken }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInst = useRef<any>(null);
  const circlesRef = useRef<any[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [locations, setLocations] = useState<ClientLocation[]>([]);
  const [addressInput, setAddressInput] = useState('');
  const [defaultRadius, setDefaultRadius] = useState(5);
  const [geocoding, setGeocoding] = useState(false);
  const [clickMode, setClickMode] = useState(false);
  const [loading, setLoading] = useState(true);

  const headers = { 'Content-Type': 'application/json', 'X-Admin-Token': adminToken };

  const load = () => {
    setLoading(true);
    fetch(`${CLIENT_LOC_URL}?admin=1`, { headers })
      .then(r => r.json())
      .then(setLocations)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

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

  // Инициализация карты
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const ymaps = (window as any).ymaps;
    if (mapInst.current) mapInst.current.destroy();
    const map = new ymaps.Map(mapRef.current, {
      center: [55.73, 36.85], zoom: 9,
      controls: ['zoomControl'],
    }, { suppressMapOpenBlock: true });
    mapInst.current = map;
    return () => { if (mapInst.current) { mapInst.current.destroy(); mapInst.current = null; } };
  }, [mapReady]);

  // Перерисовка кругов
  useEffect(() => {
    if (!mapInst.current || !mapReady) return;
    const ymaps = (window as any).ymaps;
    circlesRef.current.forEach(c => mapInst.current.geoObjects.remove(c));
    circlesRef.current = [];
    locations.filter(l => l.active).forEach(loc => {
      const circle = new ymaps.Circle(
        [[loc.lat, loc.lon], loc.radius_km * 1000],
        {},
        { fillColor: ZONE_COLOR.fill + '28', strokeColor: ZONE_COLOR.stroke, strokeWidth: 2, fillOpacity: 0.3 }
      );
      mapInst.current.geoObjects.add(circle);
      circlesRef.current.push(circle);
    });
  }, [locations, mapReady]);

  // Клик по карте
  useEffect(() => {
    if (!mapInst.current) return;
    const map = mapInst.current;
    const handler = async (e: any) => {
      if (!clickMode) return;
      const [lat, lon] = e.get('coords');
      const address = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
      await addLocation(address, lat, lon, defaultRadius);
      setClickMode(false);
    };
    map.events.add('click', handler);
    return () => map.events.remove('click', handler);
  }, [clickMode, defaultRadius]);

  const addLocation = async (address: string, lat: number, lon: number, radius_km: number) => {
    const res = await fetch(CLIENT_LOC_URL, {
      method: 'POST', headers,
      body: JSON.stringify({ address, lat, lon, radius_km, active: true }),
    });
    const data = await res.json();
    setLocations(prev => [...prev, { id: data.id, address, lat, lon, radius_km, active: true }]);
    if (mapInst.current) mapInst.current.setCenter([lat, lon], 11);
  };

  const geocodeAddress = async () => {
    if (!addressInput.trim() || !(window as any).ymaps) return;
    setGeocoding(true);
    try {
      const result = await (window as any).ymaps.geocode(addressInput, { results: 1 });
      const obj = result.geoObjects.get(0);
      if (!obj) return;
      const [lat, lon] = obj.geometry.getCoordinates();
      const fullAddress = obj.getAddressLine();
      await addLocation(fullAddress, lat, lon, defaultRadius);
      setAddressInput('');
    } finally {
      setGeocoding(false);
    }
  };

  const removeLocation = async (id: number) => {
    await fetch(`${CLIENT_LOC_URL}?id=${id}`, { method: 'DELETE', headers });
    setLocations(prev => prev.filter(l => l.id !== id));
  };

  const updateRadius = async (loc: ClientLocation, radius_km: number) => {
    const updated = { ...loc, radius_km };
    await fetch(`${CLIENT_LOC_URL}?id=${loc.id}`, {
      method: 'PUT', headers, body: JSON.stringify(updated),
    });
    setLocations(prev => prev.map(l => l.id === loc.id ? updated : l));
  };

  return (
    <div className="space-y-4">
      {/* Карта */}
      {apiKey ? (
        <div className="relative">
          {clickMode && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-foreground text-background text-xs font-medium px-3 py-2 rounded-xl shadow-lg flex items-center gap-2">
              <Icon name="MousePointerClick" size={13} />
              Кликни на карте — добавится точка клиента
              <button className="ml-1 opacity-60 hover:opacity-100" onClick={() => setClickMode(false)}>✕</button>
            </div>
          )}
          <div
            ref={mapRef}
            className={`w-full rounded-xl overflow-hidden border-2 transition-colors ${clickMode ? 'border-blue-500 cursor-crosshair' : 'border-border'}`}
            style={{ height: 320 }}
          />
        </div>
      ) : (
        <div className="rounded-xl bg-muted p-4 text-sm text-muted-foreground text-center">
          Сначала сохраните ключ Яндекс Карт выше
        </div>
      )}

      {/* Добавить точку */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Добавить клиента</p>
        <div className="flex gap-2">
          <input
            className="flex-1 h-9 px-3 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground"
            placeholder="Адрес клиента"
            value={addressInput}
            onChange={e => setAddressInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && geocodeAddress()}
          />
          <div className="flex items-center gap-1 shrink-0">
            <input
              type="number" step="1" min="1"
              className="w-16 h-9 px-2 rounded-lg border border-input bg-background text-sm text-center"
              value={defaultRadius}
              onChange={e => setDefaultRadius(parseFloat(e.target.value) || 5)}
              title="Радиус (км)"
            />
            <span className="text-xs text-muted-foreground">км</span>
          </div>
          <Button size="sm" className="h-9 px-3 shrink-0" disabled={!addressInput.trim() || geocoding} onClick={geocodeAddress}>
            {geocoding ? <Icon name="Loader" size={14} className="animate-spin" /> : <Icon name="Search" size={14} />}
          </Button>
          <Button size="sm" variant={clickMode ? 'default' : 'outline'} className="h-9 px-3 shrink-0" onClick={() => setClickMode(!clickMode)} title="Кликнуть на карте">
            <Icon name="MousePointerClick" size={14} />
          </Button>
        </div>
      </div>

      {/* Список */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Клиенты ({locations.length})
        </p>
        {loading && <p className="text-sm text-muted-foreground py-2">Загрузка…</p>}
        {!loading && locations.length === 0 && (
          <p className="text-sm text-muted-foreground py-2">Пока нет ни одного клиента</p>
        )}
        <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
          {locations.map(loc => (
            <div key={loc.id} className="flex items-center gap-2 bg-muted/40 rounded-lg px-3 py-2">
              <span className="w-2 h-2 rounded-full shrink-0 bg-blue-500" />
              <span className="flex-1 text-xs text-foreground truncate" title={loc.address}>{loc.address}</span>
              <div className="flex items-center gap-1 shrink-0">
                <input
                  type="number" step="1" min="1"
                  className="w-12 h-6 px-1 rounded border border-input bg-background text-xs text-center"
                  value={loc.radius_km}
                  onChange={e => updateRadius(loc, parseFloat(e.target.value) || 1)}
                />
                <span className="text-xs text-muted-foreground">км</span>
              </div>
              <button onClick={() => removeLocation(loc.id)} className="text-muted-foreground hover:text-destructive transition-colors ml-1">
                <Icon name="X" size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
