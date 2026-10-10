import React, { useState, useEffect } from 'react';
import { 
  Map, Route as RouteIcon, Bus, ArrowRight, ShieldCheck, 
  Clock, Navigation, CheckCircle2, ChevronRight, Layers 
} from 'lucide-react';
import type { Route, RouteStop, Bus as BusType } from '../types/index.ts';
import { api, toBnDigits } from '../lib/api.ts';
import { PabnaTransitMap } from '../components/PabnaTransitMap.tsx';

interface RoutesMapPageProps {
  onSelectBus: (busId: string) => void;
}

export const RoutesMapPage: React.FC<RoutesMapPageProps> = ({ onSelectBus }) => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [routeBuses, setRouteBuses] = useState<BusType[]>([]);
  const [allStops, setAllStops] = useState<RouteStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    api.getRoutes()
      .then((data) => {
        setRoutes(data);
        if (data.length > 0) {
          handleSelectRoute(data[0].id);
        }
        // Collect all unique stops for map rendering
        const stopsMap: Record<string, RouteStop> = {};
        data.forEach(r => {
          if (r.stops) {
            r.stops.forEach(s => {
              stopsMap[s.stop_name_bn] = s;
            });
          }
        });
        setAllStops(Object.values(stopsMap));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSelectRoute = (routeId: string) => {
    api.getRouteById(routeId)
      .then(res => {
        setSelectedRoute(res);
        setRouteBuses(res.buses || []);
      })
      .catch(console.error);
  };

  const filteredRoutes = routes.filter(r => {
    if (filterType === 'all') return true;
    return r.route_type === filterType;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          পাবনা পরিবহন রুট ও মানচিত্র
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          ওপেনস্ট্রিটম্যাপে রুটের মধ্যবর্তী স্টপেজ, দূরত্ব ও চলাচলের পথ পর্যালোচনা করুন।
        </p>
      </div>

      {/* Main Grid: Left Route Selector, Right Interactive Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Col: Route list (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Filter tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 font-medium rounded-lg whitespace-nowrap cursor-pointer ${
                filterType === 'all' ? 'bg-white text-emerald-800 shadow-xs font-bold' : 'text-slate-600'
              }`}
            >
              সকল রুট
            </button>
            <button
              onClick={() => setFilterType('long_distance')}
              className={`px-3 py-1.5 font-medium rounded-lg whitespace-nowrap cursor-pointer ${
                filterType === 'long_distance' ? 'bg-white text-emerald-800 shadow-xs font-bold' : 'text-slate-600'
              }`}
            >
              দূরপাল্লা
            </button>
            <button
              onClick={() => setFilterType('pabna_crossing')}
              className={`px-3 py-1.5 font-medium rounded-lg whitespace-nowrap cursor-pointer ${
                filterType === 'pabna_crossing' ? 'bg-white text-emerald-800 shadow-xs font-bold' : 'text-slate-600'
              }`}
            >
              পাবনা অতিক্রমকারী
            </button>
            <button
              onClick={() => setFilterType('local')}
              className={`px-3 py-1.5 font-medium rounded-lg whitespace-nowrap cursor-pointer ${
                filterType === 'local' ? 'bg-white text-emerald-800 shadow-xs font-bold' : 'text-slate-600'
              }`}
            >
              লোকাল
            </button>
          </div>

          {/* Route cards scroll list */}
          <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
            {filteredRoutes.map((route) => {
              const isSelected = selectedRoute?.id === route.id;
              return (
                <div
                  key={route.id}
                  onClick={() => handleSelectRoute(route.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50/70 border-emerald-600 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span className="font-semibold text-emerald-800">
                      {route.route_type === 'pabna_crossing' ? 'পাবনা অতিক্রমকারী' :
                       route.route_type === 'long_distance' ? 'দূরপাল্লার রুট' : 'লোকাল রুট'}
                    </span>
                    <span className="tabular-nums font-mono">{toBnDigits(route.distance_km)} কি.মি.</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {route.route_name_bn}
                  </h3>

                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-600">
                    <span className="truncate">{route.start_location}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{route.end_location}</span>
                  </div>

                  {route.estimated_duration && (
                    <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-500">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{route.estimated_duration}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Map & Details (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Interactive Map */}
          <PabnaTransitMap selectedRoute={selectedRoute} allStops={allStops} />

          {/* Selected Route Info Box */}
          {selectedRoute && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[11px] text-emerald-800 font-semibold block">নির্বাচিত রুট</span>
                  <h3 className="text-base font-bold text-slate-900">{selectedRoute.route_name_bn}</h3>
                </div>
                <div className="text-xs text-slate-600 sm:text-right">
                  <span className="block font-semibold">আনুমানিক সময়: {selectedRoute.estimated_duration || 'অনির্ধারিত'}</span>
                  <span className="text-slate-400 text-[11px]">দৈর্ঘ্য: {toBnDigits(selectedRoute.distance_km)} কি.মি.</span>
                </div>
              </div>

              {/* Stops Order Timeline */}
              {selectedRoute.stops && selectedRoute.stops.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-800">যাত্রাপথের ক্রমানুযায়ী স্টপেজ ও স্টেশন:</h4>
                  <div className="space-y-2 pt-1">
                    {selectedRoute.stops.map((stop, idx) => (
                      <div key={stop.id} className="flex items-start gap-3 text-xs">
                        <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-300 text-slate-700 font-bold flex items-center justify-center text-[10px] shrink-0 font-mono">
                          {toBnDigits(idx + 1)}
                        </div>
                        <div className="flex-1 pb-2 border-b border-slate-100">
                          <span className="font-semibold text-slate-900">{stop.stop_name_bn}</span>
                          <span className="text-slate-400 text-[11px] ml-2">({stop.district || 'পাবনা'}, {stop.upazila || 'সদর'})</span>
                          {stop.is_in_pabna ? (
                            <span className="ml-2 text-[10px] text-emerald-700 font-medium">✓ পাবনা জেলা অংশ</span>
                          ) : (
                            <span className="ml-2 text-[10px] text-slate-500">বাহিরের জেলা অংশ</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Running Buses on this Route */}
              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-800 mb-2">এই রুটে চলাচলকারী বাস:</h4>
                {routeBuses.length === 0 ? (
                  <p className="text-xs text-slate-500">বর্তমানে কোনো নিবন্ধিত বাস নেই।</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {routeBuses.map(b => (
                      <div
                        key={b.id}
                        onClick={() => onSelectBus(b.id)}
                        className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-emerald-600 transition-colors flex items-center justify-between cursor-pointer"
                      >
                        <div className="truncate pr-2">
                          <strong className="text-slate-900 block truncate">{b.name_bn}</strong>
                          <span className="text-[10px] text-slate-500">{b.company_name_bn}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
