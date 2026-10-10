import React from 'react';
import { Bus, MapPin, Phone, ShieldCheck, Mail, AlertTriangle } from 'lucide-react';

interface FooterProps {
  onTabChange: (tab: string) => void;
  onOpenCorrection: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onTabChange, onOpenCorrection }) => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-16 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800">
          
          {/* Col 1: About */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                <Bus className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold text-white">পাবনা বাস গাইড</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              পাবনা জেলার লোকাল, দূরপাল্লার ও আন্তজেলা বাস, কাউন্টার নম্বর ও সময়সূচির নির্ভুল ডিজিটাল নির্দেশিকা।
            </p>
            <div className="pt-2 text-xs text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>বাস্তব পরিবহন তথ্যের ভিত্তিতে প্রতিনিয়ত হালনাগাদ</span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">নেভিগেশন</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button onClick={() => onTabChange('home')} className="hover:text-emerald-400 transition-colors">
                  হোমপেজ
                </button>
              </li>
              <li>
                <button onClick={() => onTabChange('buses')} className="hover:text-emerald-400 transition-colors">
                  বাস অনুসন্ধান ও তালিকা
                </button>
              </li>
              <li>
                <button onClick={() => onTabChange('routes-map')} className="hover:text-emerald-400 transition-colors">
                  রুট ও ইন্টারঅ্যাক্টিভ ম্যাপ
                </button>
              </li>
              <li>
                <button onClick={() => onTabChange('counters')} className="hover:text-emerald-400 transition-colors">
                  উপজেলা ভিত্তিক বাস কাউন্টার
                </button>
              </li>
              <li>
                <button onClick={() => onTabChange('companies')} className="hover:text-emerald-400 transition-colors">
                  বাস কোম্পানি ডিরেক্টরি
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Popular Corridors */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">গুরুত্বপূর্ণ ট্রানজিট রুট</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>পাবনা ⇄ ঢাকা (গাবতলী / কল্যাণপুর)</li>
              <li>ঈশ্বরদী ⇄ ঢাকা (সরাসরি কোচ)</li>
              <li>পাবনা ⇄ রাজশাহী (দাশুড়িয়া হয়ে)</li>
              <li>পাবনা ⇄ কুষ্টিয়া (লালন শাহ সেতু)</li>
              <li>পাবনা অতিক্রমকারী ঢাকা-মেহেরপুর বাস</li>
              <li>চাটমোহর ⇄ ঢাকা এক্সপ্রেস</li>
            </ul>
          </div>

          {/* Col 4: Verification & Feedback */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">যাত্রী সহায়তা ও সংশোধন</h4>
            <p className="text-xs text-slate-400 mb-3">
              কোনো বাসের ভাড়া, সময় বা কাউন্টার নম্বরে ভুল থাকলে তথ্য সংশোধনের জন্য জানান।
            </p>
            <button
              onClick={onOpenCorrection}
              className="w-full py-2.5 px-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>ভুল তথ্য রিপোর্ট করুন</span>
            </button>
            <div className="mt-3 text-[11px] text-slate-400">
              জরুরি কাউন্টার অনুসন্ধান: পাবনা কেন্দ্রীয় টার্মিনাল
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© ২০২৬ পাবনা বাস গাইড (Pabna Bus Guide). সর্বস্বত্ব সংরক্ষিত।</p>
          <div className="flex items-center gap-4">
            <button onClick={() => onTabChange('admin')} className="hover:text-emerald-400 transition-colors">
              অ্যাডমিন পোর্টাল
            </button>
            <span aria-hidden="true">·</span>
            <span>SolaimanLipi ফন্ট সমৃদ্ধ ইউনিকোড বাংলা</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
