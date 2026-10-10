'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { CircleMarker, LayerGroup, Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { MASTER_SPOT_CATEGORIES } from '@/data/masterHub';
import type { LifestyleSpotItem } from '@/data/spotsData';
import { adminButton } from './AdminUI';
import { handleAdminUnauthorized } from './adminAuthUtils';
import { SpotEditorDrawer } from './SpotEditorDrawer';

interface MapPoint {
  id: string;
  title: string;
  province: string;
  vibe: string;
  status: 'published' | 'draft';
  lat: number;
  lng: number;
  validCoordinates: boolean;
}

// Validated categorical pair (dataviz reference slots 1 and 2): blue = published, orange = draft
const STATUS_COLORS = { published: '#2a78d6', draft: '#eb6834' } as const;
const STATUS_LABELS = { published: 'เผยแพร่', draft: 'ร่าง' } as const;
const THAILAND_BOUNDS: [[number, number], [number, number]] = [[5.6, 97.3], [20.5, 105.7]];
const VIBE_LABELS = Object.fromEntries(MASTER_SPOT_CATEGORIES.map((category) => [category.id, category.name]));

/**
 * All spots on an OpenStreetMap base map, to check locations and density.
 * Clicking a point opens the spot editor; spots with invalid coordinates are listed under the map.
 */
export function SpotsMapPanel() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);
  const [points, setPoints] = useState<MapPoint[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [province, setProvince] = useState('all');
  const [vibe, setVibe] = useState('all');
  const [statuses, setStatuses] = useState<Record<MapPoint['status'], boolean>>({ published: true, draft: true });
  const [editing, setEditing] = useState<LifestyleSpotItem | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/admin/coverage?view=points', { cache: 'no-store' })
      .then(async (res) => {
        if (handleAdminUnauthorized(res)) return;
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || 'โหลดพิกัดไม่สำเร็จ');
        if (active) setPoints(json.points);
      })
      .catch((loadError) => { if (active) setError(loadError instanceof Error ? loadError.message : 'โหลดพิกัดไม่สำเร็จ'); });
    return () => { active = false; };
  }, [reloadToken]);

  const openSpot = async (id: string) => {
    setOpeningId(id);
    try {
      const res = await fetch(`/api/admin/spots?id=${encodeURIComponent(id)}`, { cache: 'no-store' });
      if (handleAdminUnauthorized(res)) return;
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'เปิดสถานที่ไม่สำเร็จ');
      setEditing(json.spot);
    } catch (openError) {
      setError(openError instanceof Error ? openError.message : 'เปิดสถานที่ไม่สำเร็จ');
    } finally {
      setOpeningId(null);
    }
  };
  // The Leaflet click handler is created once; keep it pointed at the latest openSpot
  const openSpotRef = useRef(openSpot);
  useEffect(() => { openSpotRef.current = openSpot; });

  // Create the map once (Leaflet touches window, so it is imported in the browser only)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !containerRef.current || mapRef.current) return;
      const map = L.map(containerRef.current, { preferCanvas: true, zoomControl: true }).fitBounds(THAILAND_BOUNDS);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
      setMapReady(true);
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  const visible = useMemo(
    () => (points ?? []).filter((point) =>
      point.validCoordinates &&
      statuses[point.status] &&
      (province === 'all' || point.province === province) &&
      (vibe === 'all' || point.vibe === vibe)
    ),
    [points, statuses, province, vibe]
  );
  const invalid = useMemo(() => (points ?? []).filter((point) => !point.validCoordinates), [points]);
  const provinces = useMemo(() => [...new Set((points ?? []).map((point) => point.province))].sort((a, b) => a.localeCompare(b, 'th')), [points]);

  // Redraw markers whenever the filtered set changes
  useEffect(() => {
    if (!mapReady || !mapRef.current || !layerRef.current) return;
    let cancelled = false;
    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !layerRef.current || !mapRef.current) return;
      layerRef.current.clearLayers();
      const markers: CircleMarker[] = visible.map((point) => {
        const marker = L.circleMarker([point.lat, point.lng], {
          radius: 5,
          color: '#ffffff', // 2px surface ring keeps overlapping points apart
          weight: 1.5,
          fillColor: STATUS_COLORS[point.status],
          fillOpacity: 0.9,
        });
        marker.bindTooltip(`${point.title} · ${point.province} · ${STATUS_LABELS[point.status]}`, { direction: 'top', offset: [0, -4] });
        marker.on('click', () => openSpotRef.current(point.id));
        return marker;
      });
      markers.forEach((marker) => layerRef.current!.addLayer(marker));
      if (province !== 'all' && visible.length > 0) {
        mapRef.current.fitBounds(L.latLngBounds(visible.map((point) => [point.lat, point.lng] as [number, number])).pad(0.2));
      } else if (province === 'all') {
        mapRef.current.fitBounds(THAILAND_BOUNDS);
      }
    })();
    return () => { cancelled = true; };
  }, [mapReady, visible, province]);

  const counts = useMemo(() => ({
    published: visible.filter((point) => point.status === 'published').length,
    draft: visible.filter((point) => point.status === 'draft').length,
  }), [visible]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select aria-label="จังหวัด" value={province} onChange={(e) => setProvince(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
          <option value="all">ทุกจังหวัด</option>
          {provinces.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
        <select aria-label="vibe" value={vibe} onChange={(e) => setVibe(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
          <option value="all">ทุก vibe</option>
          {MASTER_SPOT_CATEGORIES.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
        {/* Legend doubles as the status filter */}
        <div className="flex items-center gap-1.5" role="group" aria-label="สถานะ">
          {(['published', 'draft'] as const).map((status) => (
            <button
              key={status}
              type="button"
              aria-pressed={statuses[status]}
              onClick={() => setStatuses((current) => ({ ...current, [status]: !current[status] }))}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${statuses[status] ? 'border-slate-300 bg-white text-slate-700' : 'border-slate-200 bg-slate-50 text-slate-400 line-through'}`}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLORS[status] }} />
              {STATUS_LABELS[status]} {points ? counts[status].toLocaleString('th-TH') : ''}
            </button>
          ))}
        </div>
        {openingId && <span className="inline-flex items-center gap-1 text-xs text-slate-500"><Loader2 size={12} className="animate-spin" /> กำลังเปิด…</span>}
        <span className="ml-auto text-[11px] text-slate-400">คลิกจุดเพื่อแก้ไขสถานที่</span>
      </div>

      {error && <p role="alert" className="text-sm font-semibold text-rose-600">{error}</p>}
      {toast && <p role="status" className="text-sm font-semibold text-emerald-700">{toast}</p>}

      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div ref={containerRef} className="h-[65vh] min-h-[360px] w-full" />
        {!points && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 text-sm text-slate-500">
            <Loader2 size={16} className="mr-2 animate-spin" /> กำลังโหลดพิกัด…
          </div>
        )}
      </div>

      {invalid.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs sm:text-sm font-bold text-amber-800">
            <AlertTriangle size={14} /> พิกัดไม่อยู่ในประเทศไทย {invalid.length} แห่ง (ไม่แสดงบนแผนที่)
          </p>
          <ul className="space-y-1">
            {invalid.map((point) => (
              <li key={point.id} className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate text-slate-700">{point.title} · {point.province} · {VIBE_LABELS[point.vibe] ?? point.vibe} · {STATUS_LABELS[point.status]}</span>
                <button type="button" onClick={() => openSpot(point.id)} className={adminButton.secondarySm}>แก้พิกัด</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {editing && (
        <SpotEditorDrawer
          key={editing.id}
          spot={editing}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            setEditing(null);
            setToast(message);
            setReloadToken((token) => token + 1);
          }}
        />
      )}
    </div>
  );
}
