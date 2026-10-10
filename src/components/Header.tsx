import React, { useState } from 'react';
import { Bus, MapPin, Phone, ShieldCheck, Menu, X, Lock, Route as RouteIcon, Search, AlertCircle } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenCorrection: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onTabChange, onOpenCorrection }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'হোম' },
    { id: 'buses', label: 'বাস ডিরেক্টরি' },
    { id: 'routes-map', label: 'রুট ও ম্যাপ' },
    { id: 'counters', label: 'কাউন্টারসমূহ' },
    { id: 'companies', label: 'বাস কোম্পানি' },
  ];

  const handleNav = (tabId: string) => {
    onTabChange(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Top Notice Bar */}
      <div className="bg-emerald-800 text-white text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            <span className="truncate">পাবনা জেলার বাস মালিক সমিতি ও স্থানীয় কাউন্টার যাচাইকৃত ডিজিটাল ডিরেক্টরি</span>
          </div>
          <button 
            onClick={onOpenCorrection}
            className="text-xs hover:text-emerald-200 underline shrink-0 cursor-pointer hidden sm:inline-block"
          >
            তথ্য সংশোধন অনুরোধ
          </button>
        </div>
      </div>

      {/* Main Top Bar Contract: Brand - 4-5 Nav Links - 1 Primary Action */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          
          {/* Zone 1: Brand Wordmark */}
          <button 
            onClick={() => handleNav('home')}
            className="flex items-center gap-3 text-left shrink-0 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center text-white shadow-xs group-hover:bg-emerald-800 transition-colors">
              <Bus className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold text-slate-900 tracking-tight block leading-tight">
                পাবনা বাস গাইড
              </span>
              <span className="text-[11px] text-slate-500 font-medium block">
                Pabna Bus Transit Guide
              </span>
            </div>
          </button>

          {/* Zone 2: Clean Single-Line Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-700">
            {navLinks.map(link => (
              <button
                key={link.id}
                onClick={() => handleNav(link.id)}
                className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 ${
                  currentTab === link.id
                    ? 'text-emerald-700 font-bold border-b-2 border-emerald-700'
                    : 'text-slate-600 hover:text-emerald-800'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => handleNav('admin')}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                currentTab === 'admin'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>অ্যাডমিন প্যানেল</span>
            </button>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
              aria-label="মেনু খুলুন"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2 shadow-lg">
          {navLinks.map(link => (
            <button
              key={link.id}
              onClick={() => handleNav(link.id)}
              className={`block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
                currentTab === link.id
                  ? 'bg-emerald-50 text-emerald-800 font-bold'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {link.label}
            </button>
          ))}
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <button
              onClick={() => {
                onOpenCorrection();
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-medium text-emerald-800 bg-emerald-50 rounded-lg hover:bg-emerald-100"
            >
              <AlertCircle className="w-4 h-4" />
              <span>তথ্য সংশোধনের অনুরোধ পাঠান</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
