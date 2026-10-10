import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { Route, RouteStop } from '../types/index.ts';

interface PabnaTransitMapProps {
  selectedRoute: Route | null;
  allStops: RouteStop[];
  onSelectStop?: (stop: RouteStop) => void;
}

export const PabnaTransitMap: React.FC<PabnaTransitMapProps> = ({
  selectedRoute,
  allStops,
  onSelectStop,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Initialize map centered around Pabna district (24.0064, 89.2372)
      const map = L.map(mapContainerRef.current).setView([24.0064, 89.2372], 10);

      // OpenStreetMap standard tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // Default icon style
    const createMarkerIcon = (color: string, label: string) => {
      return L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="background-color: ${color}; width: 26px; height: 26px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: bold; font-family: sans-serif;">
            ${label}
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });
    };

    const stopsToRender = selectedRoute && selectedRoute.stops && selectedRoute.stops.length > 0
      ? selectedRoute.stops
      : allStops;

    const validCoordinates: [number, number][] = [];

    stopsToRender.forEach((stop, index) => {
      if (stop.lat && stop.lng) {
        const isSelectedRoute = Boolean(selectedRoute);
        const isStart = index === 0 && isSelectedRoute;
        const isEnd = index === stopsToRender.length - 1 && isSelectedRoute;

        let color = '#059669'; // default emerald for Pabna
        if (isStart) color = '#2563eb'; // blue for start
        else if (isEnd) color = '#dc2626'; // red for destination
        else if (!stop.is_in_pabna) color = '#64748b'; // slate for outside Pabna

        const marker = L.marker([stop.lat, stop.lng], {
          icon: createMarkerIcon(color, String(stop.stop_order || index + 1))
        });

        marker.bindPopup(`
          <div style="font-family: SolaimanLipi, sans-serif; font-size: 13px; min-width: 160px; line-height: 1.4;">
            <strong style="color: #0f172a; font-size: 14px;">${stop.stop_name_bn}</strong>
            ${stop.stop_name_en ? `<div style="color: #64748b; font-size: 11px;">${stop.stop_name_en}</div>` : ''}
            <div style="margin-top: 6px; font-size: 12px; color: #334155;">
              <span>উপজেলা: ${stop.upazila || 'পাবনা'}</span><br/>
              <span>জেলা: ${stop.district || 'পাবনা'}</span><br/>
              <span style="color: ${stop.is_in_pabna ? '#059669' : '#d97706'}; font-weight: 600;">
                ${stop.is_in_pabna ? '✓ পাবনা জেলার অন্তর্গত' : 'পাবনার বাইরে ট্রানজিট'}
              </span>
            </div>
          </div>
        `);

        marker.addTo(layerGroup);
        validCoordinates.push([stop.lat, stop.lng]);
      }
    });

    // If viewing a single selected route with 2+ stops, draw a polyline connecting verified stops
    if (selectedRoute && validCoordinates.length > 1) {
      const polyline = L.polyline(validCoordinates, {
        color: '#059669',
        weight: 4,
        opacity: 0.8,
        dashArray: selectedRoute.route_type === 'pabna_crossing' ? '8, 8' : undefined
      });
      polyline.addTo(layerGroup);
      map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
    } else if (validCoordinates.length > 0) {
      const bounds = L.latLngBounds(validCoordinates);
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [selectedRoute, allStops]);

  return (
    <div className="relative w-full h-[450px] sm:h-[520px] rounded-2xl overflow-hidden border border-slate-200 shadow-xs">
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {/* Map Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-md p-2.5 rounded-xl border border-slate-200 text-[11px] shadow-md space-y-1">
        <span className="font-bold text-slate-800 block mb-1">চিহ্ন পরিচিতি</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-600"></span>
          <span>যাত্রার শুরু</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
          <span>পাবনা জেলা স্টপ</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-600"></span>
          <span>গন্তব্য</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-slate-500"></span>
          <span>বাহিরের জেলা</span>
        </div>
      </div>
    </div>
  );
};
