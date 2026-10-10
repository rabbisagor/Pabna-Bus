import React, { useState, useEffect } from 'react';
import { 
  Search, Bus, MapPin, Phone, ShieldCheck, ArrowRight, 
  Compass, AlertCircle, Clock, CheckCircle2, ChevronRight,
  TrendingUp, Users, ExternalLink
} from 'lucide-react';
import type { Bus as BusType, BusCompany } from '../types/index.ts';
import { api, toBnDigits } from '../lib/api.ts';

interface HomePageProps {
  onSelectBus: (busId: string) => void;
  onNavigateTab: (tab: string, filterParams?: any) => void;
  onOpenCorrection: (name?: string, id?: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onSelectBus,
  onNavigateTab,
  onOpenCorrection,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'long_distance' | 'local' | 'pabna_crossing' | 'ac'>('all');
  const [buses, setBuses] = useState<BusType[]>([]);
  const [companies, setCompanies] = useState<BusCompany[]>([]);
  const [stats, setStats] = useState({
    totalBuses: 0,
    crossingBuses: 0,
    totalRoutes: 0,
    totalCounters: 0,
    totalCompanies: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getBuses({ limit: '30' }),
      api.getCompanies(),
      api.getStats()
    ])
      .then(([busesRes, compData, statsData]) => {
        setBuses(busesRes.data || []);
        setCompanies(compData || []);
        setStats(statsData);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigateTab('buses', { search: searchTerm });
  };

  // Filter buses according to category tab
  const filteredBuses = buses.filter(bus => {
    if (activeCategory === 'long_distance') return bus.bus_type === 'intercity';
    if (activeCategory === 'local') return bus.bus_type === 'local';
    if (activeCategory === 'pabna_crossing') return Boolean(bus.is_pabna_crossing);
    if (activeCategory === 'ac') return bus.is_ac === 1 || bus.is_ac === 2;
    return true;
  });

  const popularRoutes = [
    { title: 'পাবনা ⇄ ঢাকা (গাবতলী/কল্যাণপুর)', distance: '১৬৫ কি.মি.', duration: '৪.৫ ঘণ্টা', query: 'ঢাকা' },
    { title: 'ঈশ্বরদী ⇄ ঢাকা (মহাখালী/গাবতলী)', distance: '১৯০ কি.মি.', duration: '৫ ঘণ্টা', query: 'ঈশ্বরদী' },
    { title: 'পাবনা ⇄ রাজশাহী (সরাসরি)', distance: '১০৫ কি.মি.', duration: '২.৫ ঘণ্টা', query: 'রাজশাহী' },
    { title: 'পাবনা ⇄ কুষ্টিয়া (লালন শাহ সেতু)', distance: '৪৮ কি.মি.', duration: '১ ঘণ্টা ১৫ মিনিট', query: 'কুষ্টিয়া' },
    { title: 'চাটমোহর ⇄ ঢাকা (সরাসরি)', distance: '১৭৫ কি.মি.', duration: '৪ ঘণ্টা ৪৫ মিনিট', query: 'চাটমোহর' },
    { title: 'পাবনা অতিক্রমকারী ঢাকা-মেহেরপুর', distance: 'দাশুড়িয়া স্টপ', duration: 'আন্তজেলা ট্রানজিট', query: 'কুষ্টিয়া' },
  ];

  return (
    <div className="space-y-12 pb-16">
      
      {/* Hero Section */}
      <section className="relative bg-slate-900 text-white rounded-2xl md:rounded-3xl overflow-hidden shadow-xl mx-4 sm:mx-6 lg:mx-8 mt-4">
        {/* Background Image Scrim */}
        <div className="absolute inset-0 z-0">
          <img
            src="/src/assets/images/pabna_bus_hero_1791650371932.jpg"
            alt="পাবনা বাস রুট ও পদ্মা সেতু দৃশ্য"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-35 filter brightness-90"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-900/80 to-transparent" />
        </div>

        <div className="relative z-10 max-w-4xl px-6 py-12 sm:py-16 md:py-20 lg:px-12 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-xs font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>পাবনা জেলা পরিবহন ডিরেক্টরি</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-white max-w-2xl text-balance">
            পাবনা জেলার সকল বাস ও রুটের তথ্য এক জায়গায়
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
            বাস, রুট, কাউন্টার ও যোগাযোগের তথ্য সহজেই খুঁজে নিন। দূরপাল্লা, লোকাল ও পাবনা অতিক্রমকারী সব বাস সার্ভিস।
          </p>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="max-w-2xl pt-2">
            <div className="bg-white p-2 rounded-xl sm:rounded-2xl shadow-lg flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex-1 flex items-center px-3 gap-2">
                <Search className="w-5 h-5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="বাসের নাম, গন্তব্য বা স্টপেজ লিখুন (যেমন: ঢাকা, কুষ্টিয়া, শ্যামলী)..."
                  className="w-full py-2 text-slate-900 text-sm focus:outline-none placeholder:text-slate-400"
                />
              </div>
              <button
                type="submit"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-medium px-6 py-3 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs whitespace-nowrap"
              >
                <span>বাস খুঁজুন</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-400 flex-wrap">
              <span className="text-slate-300">জনপ্রিয় সার্চ:</span>
              <button type="button" onClick={() => onNavigateTab('buses', { search: 'ঢাকা' })} className="hover:text-emerald-300 underline cursor-pointer">ঢাকা</button>
              <span>·</span>
              <button type="button" onClick={() => onNavigateTab('buses', { search: 'কুষ্টিয়া' })} className="hover:text-emerald-300 underline cursor-pointer">কুষ্টিয়া</button>
              <span>·</span>
              <button type="button" onClick={() => onNavigateTab('buses', { search: 'রাজশাহী' })} className="hover:text-emerald-300 underline cursor-pointer">রাজশাহী</button>
              <span>·</span>
              <button type="button" onClick={() => onNavigateTab('buses', { search: 'শ্যামলী' })} className="hover:text-emerald-300 underline cursor-pointer">শ্যামলী পরিবহন</button>
              <span>·</span>
              <button type="button" onClick={() => onNavigateTab('buses', { search: 'দাশুড়িয়া' })} className="hover:text-emerald-300 underline cursor-pointer">দাশুড়িয়া মোড়</button>
            </div>
          </form>

          {/* Quick Stats Strip */}
          <div className="pt-6 border-t border-slate-700/60 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-2xl font-bold text-white tabular-nums block font-mono">
                {toBnDigits(stats.totalBuses || 8)}
              </span>
              <span className="text-slate-400">নিবন্ধিত বাস</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-emerald-400 tabular-nums block font-mono">
                {toBnDigits(stats.crossingBuses || 2)}
              </span>
              <span className="text-slate-400">পাবনা অতিক্রমকারী</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-white tabular-nums block font-mono">
                {toBnDigits(stats.totalRoutes || 7)}
              </span>
              <span className="text-slate-400">প্রধান রুট</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-white tabular-nums block font-mono">
                {toBnDigits(stats.totalCounters || 7)}
              </span>
              <span className="text-slate-400">যাচাইকৃত কাউন্টার</span>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Corridor Quick Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">জনপ্রিয় বাস রুটসমূহ</h2>
            <p className="text-xs text-slate-500">পাবনার যাত্রীদের বহুল ব্যবহৃত সরাসরি ও ট্রানজিট রুট</p>
          </div>
          <button
            onClick={() => onNavigateTab('routes-map')}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
          >
            <span>সকল রুট ম্যাপ</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {popularRoutes.map((route, idx) => (
            <div
              key={idx}
              onClick={() => onNavigateTab('buses', { search: route.query })}
              className="p-4 bg-white rounded-xl border border-slate-200 hover:border-emerald-600 transition-all hover:shadow-xs cursor-pointer group flex items-start justify-between gap-3"
            >
              <div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                  {route.title}
                </h3>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
                  <span className="font-mono tabular-nums">{route.distance}</span>
                  <span aria-hidden="true">·</span>
                  <span>{route.duration}</span>
                </div>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 group-hover:bg-emerald-50 text-slate-400 group-hover:text-emerald-700 shrink-0">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Category Filter Tabs & Bus Cards Feed */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">বাসের তালিকা ও সময়সূচি</h2>
            <p className="text-xs text-slate-500">নিয়মিত চলাচলকারী বাস ও ভাড়ার তথ্য</p>
          </div>

          {/* Interactive filter tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto text-xs">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeCategory === 'all'
                  ? 'bg-white text-emerald-800 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              সকল বাস
            </button>
            <button
              onClick={() => setActiveCategory('long_distance')}
              className={`px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeCategory === 'long_distance'
                  ? 'bg-white text-emerald-800 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              দূরপাল্লার বাস
            </button>
            <button
              onClick={() => setActiveCategory('local')}
              className={`px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeCategory === 'local'
                  ? 'bg-white text-emerald-800 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              লোকাল বাস
            </button>
            <button
              onClick={() => setActiveCategory('pabna_crossing')}
              className={`px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeCategory === 'pabna_crossing'
                  ? 'bg-white text-emerald-800 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              পাবনা অতিক্রমকারী
            </button>
            <button
              onClick={() => setActiveCategory('ac')}
              className={`px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeCategory === 'ac'
                  ? 'bg-white text-emerald-800 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              এসি কোচ
            </button>
          </div>
        </div>

        {/* Bus Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBuses.slice(0, 6).map((bus) => (
            <div
              key={bus.id}
              onClick={() => onSelectBus(bus.id)}
              className="bg-white rounded-xl border border-slate-200 hover:border-emerald-600 hover:shadow-md transition-all p-5 flex flex-col justify-between cursor-pointer group"
            >
              <div className="space-y-3">
                
                {/* Top status & company */}
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

                {/* Bus Title */}
                <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-800 transition-colors leading-snug">
                  {bus.name_bn}
                </h3>

                {/* Route points */}
                <div className="text-xs space-y-1 text-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0"></span>
                    <span className="font-medium truncate">{bus.start_point}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium truncate">{bus.end_point}</span>
                  </div>
                </div>

                {/* Stoppages */}
                {bus.intermediate_stops && (
                  <p className="text-[11px] text-slate-500 line-clamp-1">
                    স্টপেজ: {bus.intermediate_stops}
                  </p>
                )}

                {/* Departure Schedule & Fare */}
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

              {/* Action footer */}
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
                  <span>বিস্তারিত</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* View all button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => onNavigateTab('buses')}
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-2"
          >
            <span>সকল বাসের তালিকা দেখুন ({toBnDigits(buses.length)} টি)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Special Feature: Pabna Crossing Corridor Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-700 text-white flex items-center justify-center shrink-0">
                <Compass className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  পাবনা জেলার ওপর দিয়ে অতিক্রমকারী আন্তজেলা বাস
                </h3>
                <p className="text-xs text-slate-600">
                  যেসব বাস পাবনার বাইরে থেকে শুরু হয়ে জেলা অতিক্রম করে (যেমন: ঢাকা ⇄ কুষ্টিয়া, রাজশাহী ⇄ খুলনা)
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('buses', { is_pabna_crossing: '1' })}
              className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              অতিক্রমকারী সব বাস দেখুন
            </button>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed">
            পাবনা জেলার অন্যতম প্রধান হাইওয়ে জংশন হলো <strong>দাশুড়িয়া গোলচত্বর</strong> এবং <strong>কাশীনাথপুর মোড়</strong>। ঢাকা থেকে কুষ্টিয়া, মেহেরপুর ও চুয়াডাঙ্গাগামী অধিকাংশ বাস বঙ্গবন্ধু সেতু হয়ে নাটোর/দাশুড়িয়া ও লালন শাহ সেতু দিয়ে পাবনা অতিক্রম করে। যাত্রীরা দাশুড়িয়া মোড় হতে এসব বাসে সহজে ওঠানামা করতে পারেন।
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3 bg-white/80 rounded-xl border border-amber-200">
              <strong className="block text-slate-900">পাবনায় প্রবেশের স্থান</strong>
              <span className="text-slate-600">কাশীনাথপুর বাইপাস অথবা নাটোর বনপাড়া সীমানা</span>
            </div>
            <div className="p-3 bg-white/80 rounded-xl border border-amber-200">
              <strong className="block text-slate-900">প্রধান ট্রানজিট স্টপ</strong>
              <span className="text-slate-600">দাশুড়িয়া তিনমাথা মোড় (ঈশ্বরদী) ও পাকশী টোলপ্লাজা</span>
            </div>
            <div className="p-3 bg-white/80 rounded-xl border border-amber-200">
              <strong className="block text-slate-900">পাবনা হতে প্রস্থানের স্থান</strong>
              <span className="text-slate-600">পাকশী লালন শাহ সেতু (কুষ্টিয়া সীমানা)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Upazila Counters Directory Spotlight */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">উপজেলা ভিত্তিক কাউন্টার ডিরেক্টরি</h2>
            <p className="text-xs text-slate-500">টিকিট বুকিং ও ছাড়ার সময় নিশ্চিত করতে সরাসরি কল করুন</p>
          </div>
          <button
            onClick={() => onNavigateTab('counters')}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
          >
            <span>সকল কাউন্টার</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {[
            { upazila: 'পাবনা সদর', label: 'গাছপাড়া ও রূপকথা মোড়', count: '৩ টি কাউন্টার' },
            { upazila: 'ঈশ্বরদী', label: 'টার্মিনাল ও দাশুড়িয়া মোড়', count: '২ টি কাউন্টার' },
            { upazila: 'সাঁথিয়া', label: 'কাশীনাথপুর ও আতাইকুলা', count: '১ টি হাব' },
            { upazila: 'চাটমোহর', label: 'নতুন বাজার বাসস্ট্যান্ড', count: '১ টি কাউন্টার' },
            { upazila: 'বেড়া', label: 'সিঅ্যান্ডবি মোড় ও পোর্ট', count: '১ টি কাউন্টার' },
            { upazila: 'সুজানগর', label: 'সুজানগর বাসস্ট্যান্ড', count: 'লোকাল সার্ভিস' },
            { upazila: 'ফরিদপুর', label: 'ডেমরা ও পৌরসভা স্ট্যান্ড', count: 'ঢাকা সংযোগ' },
            { upazila: 'আটঘরিয়া', label: 'আটঘরিয়া বাজার মোড়', count: 'লোকাল সার্ভিস' },
          ].map((item, i) => (
            <div
              key={i}
              onClick={() => onNavigateTab('counters', { upazila: item.upazila })}
              className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-emerald-600 transition-colors cursor-pointer group"
            >
              <span className="font-bold text-slate-900 group-hover:text-emerald-800 block">
                {item.upazila}
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">{item.label}</span>
              <span className="text-[10px] text-emerald-700 font-semibold block mt-1">{item.count}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Information Integrity & Report Box */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-100 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              আপনি কি কোনো বাসের ভুল সময় বা অসঠিক ফোন নম্বর লক্ষ্য করেছেন?
            </h3>
            <p className="text-xs text-slate-600 max-w-xl">
              পাবনা বাস গাইড সার্বক্ষণিক নির্ভুল পরিবহন তথ্য পরিবেশনে দায়বদ্ধ। কোনো তথ্য অসংগতি থাকলে অনুগ্রহ করে আমাদের জানান, আমাদের অ্যাডমিন টিম দ্রুত যাচাই করে হালনাগাদ করবেন।
            </p>
          </div>
          <button
            onClick={() => onOpenCorrection()}
            className="px-5 py-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-colors shrink-0 flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <AlertCircle className="w-4 h-4" />
            <span>সংশোধনের অনুরোধ পাঠান</span>
          </button>
        </div>
      </section>
    </div>
  );
};
