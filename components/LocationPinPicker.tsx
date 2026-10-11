'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import type { Map as LeafletMap, Marker } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Check, ExternalLink, Loader2, Search } from 'lucide-react';

/**
 * Sets the pin of a place: paste a Google Maps link, search by name, or tap the map and drag the pin.
 * The map is OpenStreetMap, so the coordinates are ours to store.
 */
export interface Pin {
  latitude: number;
  longitude: number;
}

interface FoundPlace extends Pin {
  name: string;
  detail: string;
}

interface LocationPinPickerProps {
  pin: Pin | null;
  onPinChange: (pin: Pin) => void;
  mapUrl: string;
  onMapUrlChange: (url: string) => void;
  /** Name and area of the place, used to start the searches */
  searchText: string;
  error?: string;
}

const THAILAND_BOUNDS: [[number, number], [number, number]] = [[5.6, 97.3], [20.5, 105.7]];
const PIN_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="30" height="40"><path d="M12 0C5.4 0 0 5.3 0 11.8 0 20.7 12 32 12 32s12-11.3 12-20.2C24 5.3 18.6 0 12 0z" fill="#2563EB"/><circle cx="12" cy="12" r="4.5" fill="#fff"/></svg>';
const inputClass = 'w-full h-12 px-4 rounded-2xl border border-slate-300 bg-white text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/25 focus:border-[#2563EB]';
const quietButton = 'inline-flex items-center justify-center gap-1.5 min-h-10 px-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold cursor-pointer whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed';

export function LocationPinPicker({ pin, onPinChange, mapUrl, onMapUrlChange, searchText, error }: LocationPinPickerProps) {
  const uid = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const leafletRef = useRef<typeof import('leaflet') | null>(null);
  const onPinChangeRef = useRef(onPinChange);
  const resolvedUrlRef = useRef('');
  const [mapReady, setMapReady] = useState(false);
  const [query, setQuery] = useState('');
  const [places, setPlaces] = useState<FoundPlace[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [note, setNote] = useState<{ tone: 'ok' | 'warn'; text: string } | null>(null);

  useEffect(() => {
    onPinChangeRef.current = onPinChange;
  }, [onPinChange]);

  // Leaflet touches `window`, so it loads in the browser only
  useEffect(() => {
    let disposed = false;
    import('leaflet').then((L) => {
      if (disposed || !containerRef.current || mapRef.current) return;
      leafletRef.current = L;
      const map = L.map(containerRef.current, { maxBounds: THAILAND_BOUNDS, maxBoundsViscosity: 0.8, minZoom: 5 });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      map.fitBounds(THAILAND_BOUNDS);
      map.on('click', (event) => onPinChangeRef.current({ latitude: event.latlng.lat, longitude: event.latlng.lng }));
      mapRef.current = map;
      setMapReady(true);
    });
    return () => {
      disposed = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // The marker follows the pin; the map moves to it when it was set from a link or a search
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!mapReady || !L || !map || !pin) return;
    const position: [number, number] = [pin.latitude, pin.longitude];
    if (!markerRef.current) {
      const marker = L.marker(position, {
        draggable: true,
        keyboard: false,
        icon: L.divIcon({ html: PIN_ICON, className: '', iconSize: [30, 40], iconAnchor: [15, 40] }),
      }).addTo(map);
      marker.on('dragend', () => {
        const moved = marker.getLatLng();
        onPinChangeRef.current({ latitude: moved.lat, longitude: moved.lng });
      });
      markerRef.current = marker;
    } else {
      markerRef.current.setLatLng(position);
    }
    if (!map.getBounds().pad(-0.2).contains(position) || map.getZoom() < 13) map.setView(position, Math.max(map.getZoom(), 16));
  }, [pin, mapReady]);

  const resolveLink = async (value: string) => {
    const url = value.trim();
    if (!url.startsWith('https://') || url === resolvedUrlRef.current) return;
    resolvedUrlRef.current = url;
    setIsResolving(true);
    setNote(null);
    try {
      const res = await fetch('/api/places/resolve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) setNote({ tone: 'warn', text: data?.message || 'อ่านลิงก์นี้ไม่ได้ ลองค้นหาหรือแตะบนแผนที่แทน' });
      else if (data.coordinates) {
        onPinChange(data.coordinates);
        setNote({ tone: 'ok', text: 'ปักหมุดจากลิงก์แล้ว ตรวจตำแหน่งบนแผนที่ด้านล่าง' });
      } else setNote({ tone: 'warn', text: 'ลิงก์นี้ไม่มีตำแหน่งติดมา ค้นหาชื่อสถานที่หรือแตะบนแผนที่เพื่อปักหมุด' });
    } catch {
      setNote({ tone: 'warn', text: 'เชื่อมต่อไม่ได้ ลองแตะบนแผนที่เพื่อปักหมุดแทน' });
    } finally {
      setIsResolving(false);
    }
  };

  const search = async () => {
    const text = (query.trim() || searchText).trim();
    if (text.length < 2 || isSearching) return;
    if (!query.trim()) setQuery(text);
    setIsSearching(true);
    setNote(null);
    try {
      const res = await fetch(`/api/places/search?q=${encodeURIComponent(text)}`);
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setPlaces(null);
        setNote({ tone: 'warn', text: data?.message || 'ค้นหาไม่ได้ในตอนนี้ ลองแตะบนแผนที่เพื่อปักหมุดแทน' });
      } else setPlaces(data.places);
    } catch {
      setNote({ tone: 'warn', text: 'เชื่อมต่อไม่ได้ ลองแตะบนแผนที่เพื่อปักหมุดแทน' });
    } finally {
      setIsSearching(false);
    }
  };

  const googleSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchText || 'ประเทศไทย')}`;

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor={`${uid}-link`} className="block text-sm font-bold text-slate-800">ลิงก์ Google Maps <span className="font-medium text-slate-500">(ไม่บังคับ)</span></label>
          <a href={googleSearchUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-bold text-[#2563EB] hover:underline whitespace-nowrap">
            เปิด Google Maps <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
        </div>
        <div className="relative">
          <input id={`${uid}-link`} type="url" value={mapUrl} maxLength={500} placeholder="วางลิงก์ที่ได้จากปุ่มแชร์ใน Google Maps" className={inputClass}
            onChange={(e) => onMapUrlChange(e.target.value)}
            onBlur={(e) => resolveLink(e.target.value)}
            onPaste={(e) => { const pasted = e.clipboardData.getData('text'); if (pasted) setTimeout(() => resolveLink(pasted), 0); }} />
          {isResolving && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[#2563EB]" aria-hidden="true" />}
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`${uid}-search`} className="block text-sm font-bold text-slate-800">ตำแหน่งบนแผนที่</label>
        <div className="flex gap-2">
          <input id={`${uid}-search`} value={query} maxLength={120} placeholder={searchText || 'ค้นหาชื่อสถานที่'} className={inputClass}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void search(); } }} />
          <button type="button" onClick={search} disabled={isSearching} className={`${quietButton} !min-h-12 shrink-0`}>
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Search className="w-4 h-4" aria-hidden="true" />} ค้นหา
          </button>
        </div>
        {places && (
          places.length === 0
            ? <p className="text-xs font-medium text-slate-600">ไม่พบชื่อนี้ ลองพิมพ์ชื่อย่านหรือถนนใกล้เคียง แล้วแตะบนแผนที่เพื่อปักหมุดเอง</p>
            : (
              <ul className="rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                {places.map((place) => (
                  <li key={`${place.latitude},${place.longitude}`}>
                    <button type="button" onClick={() => { onPinChange({ latitude: place.latitude, longitude: place.longitude }); setPlaces(null); setNote({ tone: 'ok', text: 'ปักหมุดแล้ว ลากหมุดเพื่อขยับให้ตรงจุดได้' }); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 cursor-pointer">
                      <span className="block text-sm font-bold text-slate-900">{place.name}</span>
                      <span className="block text-xs font-medium text-slate-500 truncate">{place.detail}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )
        )}
      </div>

      <div className={`relative rounded-2xl overflow-hidden border ${error ? 'border-rose-400' : 'border-slate-200'}`}>
        <div ref={containerRef} role="application" aria-label="แผนที่สำหรับปักหมุด แตะเพื่อปักหมุด" className="h-56 w-full bg-slate-100 z-0" />
        {!mapReady && <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-slate-400" aria-hidden="true" /></div>}
      </div>

      <p aria-live="polite" className={`flex items-start gap-1.5 text-xs font-medium leading-relaxed ${error ? 'text-rose-700' : note?.tone === 'warn' ? 'text-amber-700' : 'text-slate-600'}`} {...(error ? { 'data-field-error': true } : {})}>
        {!error && pin && <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-600" aria-hidden="true" />}
        <span>{error || note?.text || (pin ? 'ปักหมุดแล้ว ลากหมุดหรือแตะจุดอื่นเพื่อขยับได้' : 'ค้นหาชื่อสถานที่ หรือซูมแล้วแตะบนแผนที่เพื่อปักหมุด')}</span>
      </p>
    </div>
  );
}
