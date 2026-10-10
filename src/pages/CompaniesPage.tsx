import React, { useState, useEffect } from 'react';
import { Building2, Phone, Globe, Bus, ShieldCheck, ChevronRight } from 'lucide-react';
import type { BusCompany } from '../types/index.ts';
import { api, toBnDigits } from '../lib/api.ts';

interface CompaniesPageProps {
  onNavigateTab: (tab: string, filterParams?: any) => void;
}

export const CompaniesPage: React.FC<CompaniesPageProps> = ({ onNavigateTab }) => {
  const [companies, setCompanies] = useState<BusCompany[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCompanies()
      .then(setCompanies)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          বাস কোম্পানি ও পরিবহন সংস্থা
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          পাবনা জেলায় অনুমোদিত ও চলাচলকারী আন্তজেলা ও লোকাল বাস কোম্পানি প্রোফাইল।
        </p>
      </div>

      {loading ? (
        <div className="p-16 text-center text-sm text-slate-500 bg-white rounded-2xl border border-slate-200">
          কোম্পানি তালিকা লোড হচ্ছে...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {companies.map((comp) => (
            <div
              key={comp.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:border-emerald-600 hover:shadow-xs transition-all space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    অনুমোদিত
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">{comp.name_bn}</h3>
                  <p className="text-xs text-slate-400 font-sans">{comp.name_en}</p>
                </div>

                {comp.description && (
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {comp.description}
                  </p>
                )}

                <div className="text-xs space-y-1.5 pt-2 border-t border-slate-100 text-slate-600">
                  {comp.head_office && (
                    <div>
                      <strong className="text-slate-800">প্রধান কার্যালয়: </strong>
                      <span>{comp.head_office}</span>
                    </div>
                  )}
                  {comp.contact_number && (
                    <div className="flex items-center gap-2">
                      <strong className="text-slate-800">যোগাযোগ: </strong>
                      <a href={`tel:${comp.contact_number}`} className="text-emerald-700 font-sans font-semibold">
                        {comp.contact_number}
                      </a>
                    </div>
                  )}
                  {comp.website && (
                    <div className="flex items-center gap-1.5 pt-1">
                      <Globe className="w-3 h-3 text-slate-400" />
                      <a
                        href={comp.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-700 hover:underline text-[11px] truncate"
                      >
                        {comp.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-mono tabular-nums">
                  {toBnDigits(comp.bus_count || 0)} টি নিবন্ধিত বাস
                </span>
                <button
                  onClick={() => onNavigateTab('buses', { company_id: comp.id })}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                >
                  <span>বাসসমূহ দেখুন</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
