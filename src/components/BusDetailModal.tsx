import React, { useState, useEffect } from 'react';
import { 
  X, Phone, MapPin, Clock, DollarSign, ShieldCheck, 
  Share2, AlertTriangle, Bus, Check, ArrowRight, Info, Compass
} from 'lucide-react';
import type { Bus as BusType } from '../types/index.ts';
import { api, toBnDigits } from '../lib/api.ts';

interface BusDetailModalProps {
  busId: string | null;
  onClose: () => void;
  onOpenCorrection: (busName: string, busId: string) => void;
}

export const BusDetailModal: React.FC<BusDetailModalProps> = ({
  busId,
  onClose,
  onOpenCorrection,
}) => {
  const [bus, setBus] = useState<BusType | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!busId) {
      setBus(null);
      return;
    }
    setLoading(true);
    api.getBusById(busId)
      .then(data => setBus(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [busId]);

  if (!busId) return null;

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200">
        
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md p-4 sm:p-5 border-b border-slate-200 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-emerald-800">
                {bus?.company_name_bn || 'বাস সার্ভিস'}
              </span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="text-xs text-slate-500">{bus?.id}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
              {bus?.name_bn || 'বাসের বিবরণ লোড হচ্ছে...'}
            </h2>
            {bus?.name_en && (
              <p className="text-xs text-slate-500 font-sans">{bus.name_en}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {loading || !bus ? (
          <div className="p-12 text-center text-sm text-slate-500">
            বাসের তথ্য লোড হচ্ছে...
          </div>
        ) : (
          <div className="p-5 sm:p-6 space-y-6 text-sm">
            
            {/* Route corridor card */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
                    শুরু
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">যাত্রার শুরু</span>
                    <strong className="text-base text-slate-900">{bus.start_point}</strong>
                  </div>
                </div>

                <div className="hidden sm:flex items-center text-slate-400">
                  <ArrowRight className="w-5 h-5" />
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-900 text-white flex items-center justify-center font-bold text-xs">
                    গন্তব্য
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">শেষ গন্তব্য</span>
                    <strong className="text-base text-slate-900">{bus.end_point}</strong>
                  </div>
                </div>
              </div>

              {bus.intermediate_stops && (
                <div className="mt-3 pt-3 border-t border-slate-200/60 text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">মধ্যবর্তী স্টপেজ: </span>
                  {bus.intermediate_stops}
                </div>
              )}
            </div>

            {/* Feature tags */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[11px]">কোচ টাইপ</span>
                <span className="font-semibold text-slate-800">
                  {bus.is_ac === 1 ? 'এসি (Air Conditioned)' : bus.is_ac === 2 ? 'এসি ও নন-এসি' : 'নন-এসি চেয়ার কোচ'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[11px]">সিট ক্লাস</span>
                <span className="font-semibold text-slate-800">{bus.seat_class || 'সাধারণ'}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[11px]">চলাচলের দিন</span>
                <span className="font-semibold text-slate-800">{bus.operating_days || 'প্রতিদিন'}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[11px]">রুটের ধরন</span>
                <span className="font-semibold text-slate-800">
                  {bus.bus_type === 'intercity' ? 'দূরপাল্লার বাস' :
                   bus.bus_type === 'pabna_crossing' ? 'পাবনা অতিক্রমকারী' :
                   bus.bus_type === 'local' ? 'লোকাল বাস' : 'আঞ্চলিক বাস'}
                </span>
              </div>
            </div>

            {/* Special Section: Pabna Crossing Details */}
            {Boolean(bus.is_pabna_crossing) && (
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2.5 text-xs text-amber-900">
                <div className="flex items-center gap-2 font-bold text-sm text-amber-950">
                  <Compass className="w-4 h-4 text-amber-700" />
                  <span>পাবনা জেলা অতিক্রমকারী বাস সংক্রান্ত বিশেষ তথ্য</span>
                </div>
                <p className="text-amber-800 leading-relaxed">
                  এই বাসটি পাবনা জেলার বাইরে থেকে এসে জেলা অতিক্রম করে যায়। পাবনা সীমানায় যাত্রীদের জন্য তথ্য:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="font-semibold text-amber-950">পাবনায় প্রবেশের স্থান: </span>
                    {bus.crossing_entry_point || 'দাশুড়িয়া / কাশীনাথপুর বাইপাস'}
                  </div>
                  <div>
                    <span className="font-semibold text-amber-950">পাবনা হতে বের হওয়ার স্থান: </span>
                    {bus.crossing_exit_point || 'পাকশী লালন শাহ সেতু'}
                  </div>
                  <div className="sm:col-span-2">
                    <span className="font-semibold text-amber-950">পাবনার যেসব স্থানে থামে: </span>
                    {bus.crossing_pabna_stoppages || 'দাশুড়িয়া গোলচত্বর মোড়'}
                  </div>
                  <div>
                    <span className="font-semibold text-amber-950">পাবনায় যাত্রী ওঠানামা: </span>
                    {bus.allows_boarding_in_pabna ? 'অনুমোদিত (সিট খালি থাকা সাপেক্ষে)' : 'অনুমতি নেই (নন-স্টপ অতিক্রমকারী)'}
                  </div>
                </div>
              </div>
            )}

            {/* Departure times */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                <Clock className="w-4 h-4 text-emerald-700" />
                <span>সম্ভাব্য ছাড়ার সময়সূচি</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed font-sans">
                {bus.departure_times || 'কাউন্টার থেকে জেনে নিন।'}
              </div>
            </div>

            {/* Fare & Counter Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-700" />
                    <span>ভাড়ার তালিকা</span>
                  </span>
                  {bus.fare_verified ? (
                    <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      যাচাইকৃত ভাড়া
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-700 font-medium">যাচাইহীন</span>
                  )}
                </div>
                <p className="text-base font-bold text-slate-900">
                  {bus.fare_info || 'কাউন্টারে নির্ধারিত'}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-emerald-700" />
                  <span>কাউন্টার ও বুকিং যোগাযোগ</span>
                </span>
                <p className="text-xs text-slate-800 font-medium truncate">
                  {bus.counter_name || 'পাবনা টার্মিনাল বুকিং কাউন্টার'}
                </p>
                {bus.counter_phone ? (
                  <a
                    href={`tel:${bus.counter_phone}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 font-sans"
                  >
                    <span>{bus.counter_phone}</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">সরাসরি কল</span>
                  </a>
                ) : (
                  <span className="text-xs text-slate-400">ফোন নম্বর অন্তর্ভুক্ত হয়নি</span>
                )}
              </div>
            </div>

            {/* Additional notes & verification status */}
            {bus.additional_notes && (
              <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">বিশেষ নির্দেশনা: </span>
                  {bus.additional_notes}
                </div>
              </div>
            )}

            {/* Data Source & Reliability */}
            <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-500 space-y-1">
              <div>
                <span className="font-semibold text-slate-700">তথ্যের উৎস: </span>
                {bus.information_source}
              </div>
              <div className="flex items-center gap-4">
                <span>
                  <strong className="text-slate-700">যাচাই অবস্থা: </strong>
                  {bus.verification_status === 'verified' ? 'সরেজমিন যাচাইকৃত' : 'নাগরিক রিপোর্ট / যাচাইাধীন'}
                </span>
                {bus.verified_date && (
                  <span>
                    <strong className="text-slate-700">সর্বশেষ আপডেট: </strong>
                    {bus.verified_date}
                  </span>
                )}
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={handleShare}
                className="px-3 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-xs flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copied ? 'লিংক কপি হয়েছে!' : 'লিংক শেয়ার'}</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenCorrection(bus.name_bn, bus.id);
                }}
                className="px-3.5 py-2 text-xs font-medium text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                <span>তথ্য ভুল? সংশোধনের অনুরোধ পাঠান</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
