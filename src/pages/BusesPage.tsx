import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Bus, Phone, ShieldCheck, ArrowRight, 
  RotateCcw, ChevronRight, CheckCircle2, AlertCircle, Compass, Sparkles 
} from 'lucide-react';
import type { Bus as BusType, BusCompany } from '../types/index.ts';
import { api, toBnDigits } from '../lib/api.ts';

interface BusesPageProps {
  initialSearch?: string;
  initialCrossingOnly?: boolean;
  onSelectBus: (busId: string) => void;
  onOpenCorrection: (busName: string, busId: string) => void;
}

export const BusesPage: React.FC<BusesPageProps> = ({
  initialSearch = '',
  initialCrossingOnly = false,
  onSelectBus,
  onOpenCorrection,
}) => {
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [busType, setBusType] = useState('all');
  const [isAc, setIsAc] = useState('all');
  const [companyId, setCompanyId] = useState('all');
  const [isCrossing, setIsCrossing] = useState(initialCrossingOnly ? '1' : '');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const [buses, setBuses] = useState<BusType[]>([]);
  const [companies, setCompanies] = useState<BusCompany[]>([]);
  const [loading, setLoading] = useState(true);

  // Load companies once
  useEffect(() => {
    api.getCompanies().then(setCompanies).catch(console.error);
  }, []);

  // Fetch buses on filter change
  useEffect(() => {
    setLoading(true);
    api.getBuses({
      search: searchTerm,
      bus_type: busType !== 'all' ? busType : undefined,
      is_ac: isAc !== 'all' ? isAc : undefined,
      company_id: companyId !== 'all' ? companyId : undefined,
      is_pabna_crossing: isCrossing !== '' ? isCrossing : undefined,
      verified_only: verifiedOnly ? '1' : undefined,
    })
      .then(res => setBuses(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [searchTerm, busType, isAc, companyId, isCrossing, verifiedOnly]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setBusType('all');
    setIsAc('all');
    setCompanyId('all');
    setIsCrossing('');
    setVerifiedOnly(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Title & Description */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          পাবনা বাস ডিরেক্টরি ও অনুসন্ধান
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          পাবনা জেলার সব বাস সার্ভিস, ভাড়া, ছাড়ার সময় ও কাউন্টারের সত্যায়িত তথ্য অনুসন্ধান করুন।
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        
        {/* Main Search Input */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="বাসের নাম, বাংলা/ইংরেজি বানান, গন্তব্য বা স্টপেজ লিখুন (যেমন: পাবনা, ঢাকা, Shyamoli)..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          
          {/* Bus Type */}
          <div>
            <label className="block text-slate-500 font-medium mb-1">বাসের ধরন</label>
            <select
              value={busType}
              onChange={(e) => setBusType(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <option value="all">সকল ধরন</option>
              <option value="intercity">দূরপাল্লার বাস (Intercity)</option>
              <option value="local">লোকাল বাস (Local)</option>
              <option value="pabna_crossing">পাবনা অতিক্রমকারী (Crossing)</option>
              <option value="regional">আঞ্চলিক বাস (Regional)</option>
            </select>
          </div>

          {/* AC / Non-AC */}
          <div>
            <label className="block text-slate-500 font-medium mb-1">এসি / নন-এসি</label>
            <select
              value={isAc}
              onChange={(e) => setIsAc(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <option value="all">সব কোচ</option>
              <option value="1">শুধুমাত্র এসি (AC)</option>
              <option value="0">নন-এসি (Non-AC)</option>
            </select>
          </div>

          {/* Company */}
          <div>
            <label className="block text-slate-500 font-medium mb-1">বাস কোম্পানি</label>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <option value="all">সকল কোম্পানি</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name_bn}</option>
              ))}
            </select>
          </div>

          {/* Pabna Crossing Toggle */}
          <div>
            <label className="block text-slate-500 font-medium mb-1">পাবনা অতিক্রমকারী</label>
            <select
              value={isCrossing}
              onChange={(e) => setIsCrossing(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <option value="">সকল বাস</option>
              <option value="1">শুধুমাত্র অতিক্রমকারী বাস</option>
              <option value="0">পাবনা হতে শুরু/শেষ বাস</option>
            </select>
          </div>
        </div>

        {/* Filter Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>শুধুমাত্র সরেজমিন যাচাইকৃত তথ্য প্রদর্শন করুন</span>
          </label>

          {(searchTerm || busType !== 'all' || isAc !== 'all' || companyId !== 'all' || isCrossing !== '' || verifiedOnly) && (
            <button
              onClick={handleResetFilters}
              className="text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ফিল্টার রিসেট</span>
            </button>
          )}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-600 px-1">
        <span>
          মোট <strong>{toBnDigits(buses.length)}</strong> টি বাস পাওয়া গেছে
        </span>
      </div>

      {/* Bus Cards List */}
      {loading ? (
        <div className="p-16 text-center text-sm text-slate-500 bg-white rounded-2xl border border-slate-200">
          বাসের তথ্য লোড হচ্ছে...
        </div>
      ) : buses.length === 0 ? (
        <div className="p-12 text-center space-y-3 bg-white rounded-2xl border border-slate-200">
          <Bus className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">কোনো বাস পাওয়া যায়নি</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            আপনার অনুসন্ধান শব্দের সঙ্গে মিলে এমন কোনো বাস রেকর্ড নেই। বানান পরীক্ষা করুন অথবা ফিল্টার পরিবর্তন করুন।
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-medium cursor-pointer"
          >
            সব বাস দেখুন
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {buses.map((bus) => (
            <div
              key={bus.id}
              onClick={() => onSelectBus(bus.id)}
              className="bg-white rounded-xl border border-slate-200 hover:border-emerald-600 hover:shadow-md transition-all p-5 flex flex-col justify-between cursor-pointer group"
            >
              <div className="space-y-3">
                
                {/* Header */}
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-emerald-800 truncate">
                    {bus.company_name_bn || 'বাস সার্ভিস'}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {bus.is_ac === 1 ? (
                      <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">এসি</span>
                    ) : (
                      <span className="text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">নন-এসি</span>
                    )}
                    {Boolean(bus.is_pabna_crossing) && (
                      <span className="text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded text-[10px] font-medium">অতিক্রমকারী</span>
                    )}
                  </div>
                </div>

                {/* Name */}
                <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-800 transition-colors leading-snug">
                  {bus.name_bn}
                </h3>

                {/* Start & End */}
                <div className="text-xs space-y-1 text-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0"></span>
                    <span className="font-medium truncate">{bus.start_point}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium truncate">{bus.end_point}</span>
                  </div>
                </div>

                {/* Intermediate stops */}
                {bus.intermediate_stops && (
                  <p className="text-[11px] text-slate-500 line-clamp-1">
                    স্টপেজ: {bus.intermediate_stops}
                  </p>
                )}

                {/* Crossing highlight if applicable */}
                {Boolean(bus.is_pabna_crossing) && bus.crossing_pabna_stoppages && (
                  <div className="p-2 bg-amber-50 rounded-lg text-[11px] text-amber-900">
                    <span className="font-semibold">পাবনায় স্টপ: </span>
                    {bus.crossing_pabna_stoppages}
                  </div>
                )}

                {/* Fare & verified info */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">ভাড়া</span>
                    <span className="font-bold text-slate-900">{bus.fare_info || 'কাউন্টার নির্ধারিত'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px]">যাচাই অবস্থা</span>
                    <span className="text-emerald-700 font-medium flex items-center gap-1 justify-end text-[11px]">
                      <ShieldCheck className="w-3 h-3" />
                      যাচাইকৃত
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom phone & details trigger */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                {bus.counter_phone ? (
                  <a
                    href={`tel:${bus.counter_phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 font-sans"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{bus.counter_phone}</span>
                  </a>
                ) : (
                  <span className="text-xs text-slate-400">কাউন্টার বুকিং</span>
                )}

                <span className="text-xs font-semibold text-slate-700 group-hover:text-emerald-800 flex items-center gap-1">
                  <span>পূর্ণ তথ্য</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
