import React, { useState, useEffect } from 'react';
import { 
  Phone, MapPin, Search, ShieldCheck, Clock, 
  ExternalLink, CheckCircle, RotateCcw, AlertTriangle 
} from 'lucide-react';
import type { Counter, BusCompany } from '../types/index.ts';
import { api, toBnDigits } from '../lib/api.ts';

interface CountersPageProps {
  initialUpazila?: string;
  onOpenCorrection: (name?: string, id?: string) => void;
}

export const CountersPage: React.FC<CountersPageProps> = ({
  initialUpazila = 'all',
  onOpenCorrection,
}) => {
  const [counters, setCounters] = useState<Counter[]>([]);
  const [companies, setCompanies] = useState<BusCompany[]>([]);
  const [upazila, setUpazila] = useState(initialUpazila);
  const [companyId, setCompanyId] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const upazilaList = [
    'সকল উপজেলা',
    'পাবনা সদর',
    'ঈশ্বরদী',
    'সাঁথিয়া',
    'বেড়া',
    'চাটমোহর',
    'সুজানগর',
    'ফরিদপুর',
    'আটঘরিয়া',
    'ভাঙ্গুড়া',
  ];

  useEffect(() => {
    api.getCompanies().then(setCompanies).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    api.getCounters({
      upazila: upazila !== 'all' && upazila !== 'সকল উপজেলা' ? upazila : undefined,
      company_id: companyId !== 'all' ? companyId : undefined,
      search: searchTerm || undefined,
    })
      .then(setCounters)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [upazila, companyId, searchTerm]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Page Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          পাবনা জেলা বাস কাউন্টার ডিরেক্টরি
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          উপজেলা ভিত্তিক সকল বাস কাউন্টারের ঠিকানা, কল-ভেরিফাইড নম্বর ও অবস্থান।
        </p>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="কাউন্টারের নাম বা ঠিকানা..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {/* Upazila Select */}
          <div>
            <select
              value={upazila}
              onChange={(e) => setUpazila(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <option value="all">সকল উপজেলা</option>
              {upazilaList.slice(1).map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          {/* Company Select */}
          <div>
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
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-600">
        <span>মোট <strong>{toBnDigits(counters.length)}</strong> টি কাউন্টার পাওয়া গেছে</span>
      </div>

      {/* Counter Grid */}
      {loading ? (
        <div className="p-16 text-center text-sm text-slate-500 bg-white rounded-2xl border border-slate-200">
          কাউন্টার লোড হচ্ছে...
        </div>
      ) : counters.length === 0 ? (
        <div className="p-12 text-center space-y-3 bg-white rounded-2xl border border-slate-200">
          <Phone className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">কাউন্টার তথ্য পাওয়া যায়নি</h3>
          <p className="text-xs text-slate-500">ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন।</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {counters.map((cnt) => (
            <div
              key={cnt.id}
              className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between hover:border-emerald-600 hover:shadow-xs transition-all space-y-3"
            >
              <div className="space-y-2.5">
                
                {/* Upazila & Company */}
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-emerald-800">
                    {cnt.upazila} {cnt.area_name ? `· ${cnt.area_name}` : ''}
                  </span>
                  {Boolean(cnt.is_phone_verified) ? (
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      যাচাইকৃত নম্বর
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                      যাচাইহীন
                    </span>
                  )}
                </div>

                {/* Counter Name */}
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {cnt.name_bn}
                </h3>

                {/* Address */}
                <div className="text-xs text-slate-600 flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{cnt.address}</span>
                </div>

                {/* Opening Hours */}
                {cnt.opening_hours && (
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{cnt.opening_hours}</span>
                  </div>
                )}
              </div>

              {/* Call Buttons & Map Links */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <a
                  href={`tel:${cnt.phone}`}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5 font-sans"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{cnt.phone}</span>
                </a>

                {cnt.google_maps_url ? (
                  <a
                    href={cnt.google_maps_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 border border-slate-200 text-slate-600 hover:text-emerald-700 rounded-lg text-xs hover:bg-slate-50 transition-colors"
                    title="গুগল ম্যাপে দেখুন"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                ) : (
                  <button
                    onClick={() => onOpenCorrection(cnt.name_bn, cnt.id)}
                    className="text-[11px] text-slate-400 hover:text-amber-700"
                  >
                    নম্বর ভুল?
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
