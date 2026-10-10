import React, { useState, useEffect } from 'react';
import { 
  Lock, LayoutDashboard, Bus, Route as RouteIcon, Building2, 
  PhoneCall, AlertTriangle, History, Download, Upload, 
  LogOut, Plus, Edit2, Trash2, CheckCircle2, XCircle, 
  Eye, EyeOff, Search, Save, Key, RefreshCw, FileText
} from 'lucide-react';
import { api, toBnDigits, setAuthToken, removeAuthToken, getAuthToken } from '../lib/api.ts';
import type { 
  Bus as BusType, BusCompany, Route, Counter, 
  CorrectionRequest, AuditLog, DashboardStats 
} from '../types/index.ts';

export const AdminPage: React.FC = () => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [usernameInput, setUsernameInput] = useState('admin');
  const [passwordInput, setPasswordInput] = useState('pabna2026admin');
  const [loginError, setLoginError] = useState('');

  // Active Admin Sub-tab
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'buses' | 'routes' | 'counters' | 'companies' | 'corrections' | 'import_export' | 'audit_logs'
  >('dashboard');

  // Data states
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [buses, setBuses] = useState<BusType[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [companies, setCompanies] = useState<BusCompany[]>([]);
  const [counters, setCounters] = useState<Counter[]>([]);
  const [corrections, setCorrections] = useState<CorrectionRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Modals & form states
  const [busModalOpen, setBusModalOpen] = useState(false);
  const [editingBus, setEditingBus] = useState<Partial<BusType> | null>(null);

  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Partial<Route> | null>(null);

  const [counterModalOpen, setCounterModalOpen] = useState(false);
  const [editingCounter, setEditingCounter] = useState<Partial<Counter> | null>(null);

  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Partial<BusCompany> | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: string; name: string } | null>(null);

  // CSV Import State
  const [csvContent, setCsvContent] = useState('');
  const [csvType, setCsvType] = useState('buses');
  const [csvPreview, setCsvPreview] = useState<any>(null);
  const [csvMsg, setCsvMsg] = useState('');

  // Password Change modal
  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwMsg, setPwMsg] = useState('');

  // Search in tabs
  const [adminSearch, setAdminSearch] = useState('');

  // Check auth status on mount
  useEffect(() => {
    api.adminMe()
      .then(res => {
        setIsAuthenticated(true);
        setAdminUser(res.user);
      })
      .catch(() => {
        setIsAuthenticated(false);
      })
      .finally(() => setAuthLoading(false));
  }, []);

  // Fetch data when authenticated and tab changes
  useEffect(() => {
    if (!isAuthenticated) return;
    refreshData();
  }, [isAuthenticated, activeTab]);

  const refreshData = () => {
    if (activeTab === 'dashboard') {
      api.getDashboardStats().then(setDashboardStats).catch(console.error);
    } else if (activeTab === 'buses') {
      api.getAdminBuses().then(setBuses).catch(console.error);
      api.getCompanies().then(setCompanies).catch(console.error);
      api.getAdminRoutes().then(setRoutes).catch(console.error);
    } else if (activeTab === 'routes') {
      api.getAdminRoutes().then(setRoutes).catch(console.error);
    } else if (activeTab === 'counters') {
      api.getCounters().then(setCounters).catch(console.error);
      api.getCompanies().then(setCompanies).catch(console.error);
    } else if (activeTab === 'companies') {
      api.getCompanies().then(setCompanies).catch(console.error);
    } else if (activeTab === 'corrections') {
      api.getCorrections().then(setCorrections).catch(console.error);
    } else if (activeTab === 'audit_logs') {
      api.getAuditLogs().then(setAuditLogs).catch(console.error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await api.adminLogin({ username: usernameInput, password: passwordInput });
      if (res.token) {
        setAuthToken(res.token);
      }
      setIsAuthenticated(true);
      setAdminUser(res.user);
    } catch (err: any) {
      setLoginError(err.message || 'ব্যবহারকারীর নাম বা পাসওয়ার্ড সঠিক নয়।');
    }
  };

  const handleLogout = async () => {
    try {
      await api.adminLogout();
    } catch {}
    removeAuthToken();
    setIsAuthenticated(false);
    setAdminUser(null);
  };

  // Bus Actions
  const handleSaveBus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBus) return;
    try {
      if (editingBus.id) {
        await api.updateBus(editingBus.id, editingBus);
      } else {
        await api.createBus(editingBus);
      }
      setBusModalOpen(false);
      setEditingBus(null);
      refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteConfirm) return;
    try {
      if (deleteConfirm.type === 'bus') {
        await api.deleteBus(deleteConfirm.id, true);
      } else if (deleteConfirm.type === 'route') {
        await api.deleteRoute(deleteConfirm.id);
      } else if (deleteConfirm.type === 'counter') {
        await api.deleteCounter(deleteConfirm.id);
      } else if (deleteConfirm.type === 'company') {
        await api.deleteCompany(deleteConfirm.id);
      }
      setDeleteConfirm(null);
      refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleBusStatus = async (bus: BusType) => {
    const newStatus = bus.status === 'published' ? 'draft' : 'published';
    await api.toggleBusStatus(bus.id, newStatus);
    refreshData();
  };

  // Route Actions
  const handleSaveRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoute) return;
    try {
      if (editingRoute.id) {
        await api.updateRoute(editingRoute.id, editingRoute);
      } else {
        await api.createRoute(editingRoute);
      }
      setRouteModalOpen(false);
      setEditingRoute(null);
      refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Counter Actions
  const handleSaveCounter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCounter) return;
    try {
      if (editingCounter.id) {
        await api.updateCounter(editingCounter.id, editingCounter);
      } else {
        await api.createCounter(editingCounter);
      }
      setCounterModalOpen(false);
      setEditingCounter(null);
      refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Company Actions
  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompany) return;
    try {
      if (editingCompany.id) {
        await api.updateCompany(editingCompany.id, editingCompany);
      } else {
        await api.createCompany(editingCompany);
      }
      setCompanyModalOpen(false);
      setEditingCompany(null);
      refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // CSV Import preview
  const handleCsvPreview = async () => {
    if (!csvContent) return;
    try {
      const res = await api.importCsv(csvType, csvContent, true);
      setCsvPreview(res);
      setCsvMsg('');
    } catch (err: any) {
      setCsvMsg(err.message);
    }
  };

  const handleCsvImportExecute = async () => {
    if (!csvContent) return;
    try {
      const res = await api.importCsv(csvType, csvContent, false);
      setCsvMsg(res.message_bn || 'আমদানি সম্পন্ন হয়েছে।');
      setCsvPreview(null);
      setCsvContent('');
    } catch (err: any) {
      setCsvMsg(err.message);
    }
  };

  // Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.changePassword({ currentPassword: currentPw, newPassword: newPw });
      setPwMsg(res.message_bn);
      setTimeout(() => {
        setPwModalOpen(false);
        setCurrentPw('');
        setNewPw('');
        setPwMsg('');
      }, 2000);
    } catch (err: any) {
      setPwMsg(err.message);
    }
  };

  // Loading indicator
  if (authLoading) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 text-center text-sm text-slate-500">
        অ্যাডমিন প্রমাণীকরণ যাচাই হচ্ছে...
      </div>
    );
  }

  // Login Screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-12 px-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">অ্যাডমিন প্রবেশদ্বার</h2>
            <p className="text-xs text-slate-500">
              পাবনা বাস গাইড পরিচালনা ও তথ্য সম্পাদনার নিরাপদ প্যানেল
            </p>
          </div>

          {loginError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">ব্যবহারকারীর নাম</label>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                required
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">পাসওয়ার্ড</label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                required
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg text-xs transition-colors cursor-pointer"
            >
              লগইন করুন
            </button>
          </form>

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 text-center">
            বুটস্ট্র্যাপ অ্যাডমিন এক্সেস: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">admin</code>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Admin Dashboard
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Admin Header Bar */}
      <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center font-bold">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold">পাবনা বাস গাইড — অ্যাডমিন প্যানেল</h1>
            <p className="text-xs text-slate-400">
              লগইন ব্যবহারকারী: <strong className="text-white">{adminUser?.full_name || adminUser?.username}</strong> ({adminUser?.role})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPwModalOpen(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Key className="w-3.5 h-3.5" />
            <span>পাসওয়ার্ড পরিবর্তন</span>
          </button>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 bg-red-950/80 hover:bg-red-900 text-red-200 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>লগআউট</span>
          </button>
        </div>
      </div>

      {/* Admin Sub Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs border-b border-slate-200">
        {[
          { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
          { id: 'buses', label: 'বাস ব্যবস্থাপনা', icon: Bus },
          { id: 'routes', label: 'রুট ব্যবস্থাপনা', icon: RouteIcon },
          { id: 'counters', label: 'কাউন্টার ব্যবস্থাপনা', icon: PhoneCall },
          { id: 'companies', label: 'কোম্পানি ব্যবস্থাপনা', icon: Building2 },
          { id: 'corrections', label: 'সংশোধনের অনুরোধ', icon: AlertTriangle },
          { id: 'import_export', label: 'আমদানি ও রপ্তানি', icon: Download },
          { id: 'audit_logs', label: 'পরিবর্তনের ইতিহাস', icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 font-medium rounded-t-lg transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-white border-t-2 border-emerald-600 text-emerald-800 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* 1. DASHBOARD TAB */}
      {/* ======================================================== */}
      {activeTab === 'dashboard' && dashboardStats && (
        <div className="space-y-6">
          {/* Real Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 text-xs">মোট নিবন্ধিত বাস</span>
              <span className="text-2xl font-bold text-slate-900 block tabular-nums font-mono">
                {toBnDigits(dashboardStats.totalBuses)}
              </span>
              <span className="text-[11px] text-emerald-700">
                প্রকাশিত: {toBnDigits(dashboardStats.publishedBuses)} · খসড়া: {toBnDigits(dashboardStats.draftBuses)}
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 text-xs">পাবনা অতিক্রমকারী বাস</span>
              <span className="text-2xl font-bold text-amber-800 block tabular-nums font-mono">
                {toBnDigits(dashboardStats.crossingBuses)}
              </span>
              <span className="text-[11px] text-slate-500">দাশুড়িয়া/পাকশী করিডোর</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 text-xs">সক্রিয় রুট ও কাউন্টার</span>
              <span className="text-2xl font-bold text-slate-900 block tabular-nums font-mono">
                {toBnDigits(dashboardStats.totalRoutes + dashboardStats.totalCounters)}
              </span>
              <span className="text-[11px] text-slate-500">
                রুট: {toBnDigits(dashboardStats.totalRoutes)} · কাউন্টার: {toBnDigits(dashboardStats.totalCounters)}
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 text-xs">অপেক্ষমাণ সংশোধন</span>
              <span className="text-2xl font-bold text-red-600 block tabular-nums font-mono">
                {toBnDigits(dashboardStats.pendingCorrections)}
              </span>
              <span className="text-[11px] text-slate-500">যাচাইহীন তথ্য: {toBnDigits(dashboardStats.unverifiedCount)}</span>
            </div>
          </div>

          {/* Quick Actions & Recent Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Recent Buses (7 cols) */}
            <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">সাম্প্রতিক বাসসমূহ</h3>
                <button
                  onClick={() => setActiveTab('buses')}
                  className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
                >
                  সব দেখুন
                </button>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {dashboardStats.recentBuses.map((b) => (
                  <div key={b.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <strong className="text-slate-900 block">{b.name_bn}</strong>
                      <span className="text-slate-500 text-[11px]">
                        {b.start_point} ⇄ {b.end_point}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                        b.status === 'published' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                      }`}>
                        {b.status === 'published' ? 'প্রকাশিত' : 'খসড়া'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Audit Timeline (5 cols) */}
            <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">অডিট লগ (কার্যক্রম)</h3>
                <button
                  onClick={() => setActiveTab('audit_logs')}
                  className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
                >
                  পূর্ণ ইতিহাস
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {dashboardStats.recentLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="p-2.5 bg-slate-50 rounded-lg space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">{log.action} · {log.entity_type}</span>
                      <span className="text-[10px] text-slate-400">{log.created_at.split('T')[0]}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-1">{log.details}</p>
                    <span className="text-[10px] text-emerald-800 font-medium">দ্বারা: {log.user_name}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. BUS MANAGEMENT TAB */}
      {/* ======================================================== */}
      {activeTab === 'buses' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                placeholder="বাসের নাম দিয়ে ফিল্টার করুন..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
            <button
              onClick={() => {
                setEditingBus({
                  name_bn: '',
                  name_en: '',
                  company_id: companies[0]?.id || '',
                  bus_type: 'intercity',
                  is_ac: 0,
                  seat_class: 'Economy / Chair Coach',
                  start_point: 'পাবনা কেন্দ্রীয় বাস টার্মিনাল',
                  end_point: 'ঢাকা গাবতলী',
                  intermediate_stops: '',
                  operating_days: 'প্রতিদিন',
                  departure_times: '',
                  counter_name: '',
                  counter_phone: '',
                  fare_info: '',
                  fare_verified: 1,
                  information_source: 'বাস মালিক সমিতি',
                  verification_status: 'verified',
                  status: 'published',
                  is_pabna_crossing: 0,
                  allows_boarding_in_pabna: 1,
                  is_direct_route: 1,
                  is_active_route: 1
                });
                setBusModalOpen(true);
              }}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন বাস যোগ করুন</span>
            </button>
          </div>

          {/* Buses Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                <tr>
                  <th className="p-3">আইডি</th>
                  <th className="p-3">বাসের নাম</th>
                  <th className="p-3">কোম্পানি</th>
                  <th className="p-3">রুট (শুরু ⇄ গন্তব্য)</th>
                  <th className="p-3">ধরন / এসি</th>
                  <th className="p-3">কাউন্টার ফোন</th>
                  <th className="p-3">স্ট্যাটাস</th>
                  <th className="p-3 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {buses
                  .filter(b => !adminSearch || b.name_bn.includes(adminSearch) || b.name_en?.toLowerCase().includes(adminSearch.toLowerCase()))
                  .map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 font-mono text-[11px] text-slate-500">{b.id}</td>
                      <td className="p-3 font-bold text-slate-900">{b.name_bn}</td>
                      <td className="p-3 text-slate-600">{b.company_name_bn || '—'}</td>
                      <td className="p-3 text-slate-700">{b.start_point} ⇄ {b.end_point}</td>
                      <td className="p-3">
                        <span className="block">{b.bus_type === 'intercity' ? 'দূরপাল্লা' : b.bus_type === 'pabna_crossing' ? 'অতিক্রমকারী' : 'লোকাল'}</span>
                        <span className="text-[10px] text-slate-500">{b.is_ac === 1 ? 'এসি' : 'নন-এসি'}</span>
                      </td>
                      <td className="p-3 font-sans font-semibold text-emerald-800">{b.counter_phone || '—'}</td>
                      <td className="p-3">
                        <button
                          onClick={() => handleToggleBusStatus(b)}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${
                            b.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {b.status === 'published' ? 'প্রকাশিত' : 'খসড়া'}
                        </button>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditingBus({ ...b });
                            setBusModalOpen(true);
                          }}
                          className="p-1 text-slate-600 hover:text-emerald-700 cursor-pointer"
                          title="সম্পাদনা"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ type: 'bus', id: b.id, name: b.name_bn })}
                          className="p-1 text-slate-400 hover:text-red-700 cursor-pointer"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. ROUTE MANAGEMENT TAB */}
      {/* ======================================================== */}
      {activeTab === 'routes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">সকল পরিবহন রুট</h3>
            <button
              onClick={() => {
                setEditingRoute({
                  route_name_bn: '',
                  route_name_en: '',
                  route_type: 'long_distance',
                  start_location: 'পাবনা',
                  end_location: 'ঢাকা',
                  via_districts: '',
                  via_upazilas: '',
                  entry_point_pabna: '',
                  exit_point_pabna: '',
                  direction: 'both_ways',
                  distance_km: 150,
                  estimated_duration: '৪ ঘণ্টা',
                  verification_status: 'verified',
                  status: 'published',
                  stops: []
                });
                setRouteModalOpen(true);
              }}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন রুট যোগ করুন</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {routes.map((r) => (
              <div key={r.id} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-slate-400">{r.id}</span>
                  <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded">
                    {r.route_type}
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-900">{r.route_name_bn}</h4>
                <div className="text-xs text-slate-600 space-y-1">
                  <div>শুরু: <strong>{r.start_location}</strong> ⇄ গন্তব্য: <strong>{r.end_location}</strong></div>
                  <div>দূরত্ব: {toBnDigits(r.distance_km)} কি.মি. · সময়: {r.estimated_duration}</div>
                  <div>মোট স্টপেজ: {toBnDigits(r.stops?.length || 0)} টি</div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-3 text-xs">
                  <button
                    onClick={() => {
                      setEditingRoute({ ...r });
                      setRouteModalOpen(true);
                    }}
                    className="text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>সম্পাদনা</span>
                  </button>
                  <button
                    onClick={() => setDeleteConfirm({ type: 'route', id: r.id, name: r.route_name_bn })}
                    className="text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>মুছে ফেলুন</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. COUNTER MANAGEMENT TAB */}
      {/* ======================================================== */}
      {activeTab === 'counters' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">সকল বাস কাউন্টার</h3>
            <button
              onClick={() => {
                setEditingCounter({
                  name_bn: '',
                  name_en: '',
                  company_id: companies[0]?.id || '',
                  address: '',
                  district: 'পাবনা',
                  upazila: 'পাবনা সদর',
                  area_name: '',
                  phone: '',
                  alt_phone: '',
                  google_maps_url: '',
                  opening_hours: 'সকাল ০৬:০০ – রাত ১১:০০',
                  is_phone_verified: 1,
                  verification_status: 'verified',
                  status: 'published'
                });
                setCounterModalOpen(true);
              }}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন কাউন্টার যোগ করুন</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                <tr>
                  <th className="p-3">কাউন্টার নাম</th>
                  <th className="p-3">উপজেলা</th>
                  <th className="p-3">ঠিকানা</th>
                  <th className="p-3">ফোন নম্বর</th>
                  <th className="p-3">যাচাইকৃত</th>
                  <th className="p-3 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {counters.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70">
                    <td className="p-3 font-bold text-slate-900">{c.name_bn}</td>
                    <td className="p-3 text-emerald-800 font-semibold">{c.upazila}</td>
                    <td className="p-3 text-slate-600">{c.address}</td>
                    <td className="p-3 font-sans font-semibold">{c.phone}</td>
                    <td className="p-3">
                      {Boolean(c.is_phone_verified) ? (
                        <span className="text-emerald-700 font-semibold">✓ হ্যাঁ</span>
                      ) : (
                        <span className="text-amber-700">যাচাইহীন</span>
                      )}
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => {
                          setEditingCounter({ ...c });
                          setCounterModalOpen(true);
                        }}
                        className="p-1 text-slate-600 hover:text-emerald-700 cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ type: 'counter', id: c.id, name: c.name_bn })}
                        className="p-1 text-slate-400 hover:text-red-700 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. COMPANY MANAGEMENT TAB */}
      {/* ======================================================== */}
      {activeTab === 'companies' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">বাস কোম্পানি ডিরেক্টরি</h3>
            <button
              onClick={() => {
                setEditingCompany({
                  name_bn: '',
                  name_en: '',
                  description: '',
                  head_office: 'পাবনা',
                  contact_number: '',
                  hotline: '',
                  website: '',
                  verification_status: 'verified',
                  status: 'published'
                });
                setCompanyModalOpen(true);
              }}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন কোম্পানি যোগ করুন</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.map((c) => (
              <div key={c.id} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-slate-900">{c.name_bn}</h4>
                  <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-semibold">
                    {c.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-sans">{c.name_en}</p>
                <div className="text-xs space-y-1 text-slate-600">
                  <div>অফিস: {c.head_office || '—'}</div>
                  <div>ফোন: <span className="font-sans font-semibold">{c.contact_number || '—'}</span></div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-3 text-xs">
                  <button
                    onClick={() => {
                      setEditingCompany({ ...c });
                      setCompanyModalOpen(true);
                    }}
                    className="text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>সম্পাদনা</span>
                  </button>
                  <button
                    onClick={() => setDeleteConfirm({ type: 'company', id: c.id, name: c.name_bn })}
                    className="text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>মুছে ফেলুন</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. CORRECTION REQUESTS TAB */}
      {/* ======================================================== */}
      {activeTab === 'corrections' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900">যাত্রীদের জমা দেওয়া তথ্য সংশোধনের অনুরোধ</h3>
          
          <div className="space-y-3">
            {corrections.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
                কোনো সংশোধনের অনুরোধ জমা নেই।
              </div>
            ) : (
              corrections.map((req) => (
                <div key={req.id} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <strong className="text-sm text-slate-900 block">{req.bus_or_route_name}</strong>
                      <span className="text-[11px] text-slate-400">অনুরোধ আইডি: {req.id} · তারিখ: {req.created_at.split('T')[0]}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={req.status}
                        onChange={async (e) => {
                          await api.updateCorrection(req.id, e.target.value);
                          refreshData();
                        }}
                        className="p-1.5 border border-slate-300 rounded-lg text-xs font-semibold"
                      >
                        <option value="new">নতুন (New)</option>
                        <option value="in_review">যাচাই চলছে (In Review)</option>
                        <option value="approved">অনুমোদিত (Approved)</option>
                        <option value="rejected">প্রত্যাখ্যাত (Rejected)</option>
                        <option value="resolved">সম্পন্ন (Resolved)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl">
                    <div>
                      <span className="text-red-700 font-semibold block">ভুল হিসেবে রিপোর্ট করা তথ্য:</span>
                      <p className="text-slate-800 mt-0.5">{req.incorrect_info}</p>
                    </div>
                    <div>
                      <span className="text-emerald-700 font-semibold block">সঠিক তথ্যের প্রস্তাব:</span>
                      <p className="text-slate-800 mt-0.5">{req.proposed_correction}</p>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-4">
                    <span>প্রেরক: <strong>{req.submitter_name || 'বেনামী যাত্রী'}</strong></span>
                    {req.submitter_phone && <span>ফোন: <span className="font-sans font-semibold">{req.submitter_phone}</span></span>}
                    {req.submitter_comments && <span>মন্তব্য: {req.submitter_comments}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. IMPORT & EXPORT TAB */}
      {/* ======================================================== */}
      {activeTab === 'import_export' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Export Section */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-emerald-700" />
                <h3 className="text-base font-bold text-slate-900">ডেটা রপ্তানি (CSV / JSON)</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                পাবনা বাস গাইডের পূর্ণ ডেটাবেস ব্যাকআপ অথবা এক্সেল ফাইল উপযোগী CSV ফরম্যাটে ডাউনলোড করুন।
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <a
                  href="/api/admin/export/csv/buses"
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-center font-bold text-slate-800 block cursor-pointer"
                >
                  বাস তালিকা (CSV)
                </a>
                <a
                  href="/api/admin/export/csv/routes"
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-center font-bold text-slate-800 block cursor-pointer"
                >
                  রুট তালিকা (CSV)
                </a>
                <a
                  href="/api/admin/export/csv/counters"
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-center font-bold text-slate-800 block cursor-pointer"
                >
                  কাউন্টার তালিকা (CSV)
                </a>
                <a
                  href="/api/admin/export/csv/companies"
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-center font-bold text-slate-800 block cursor-pointer"
                >
                  কোম্পানি তালিকা (CSV)
                </a>
              </div>

              <div className="pt-2">
                <a
                  href="/api/admin/export/json"
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold text-center block cursor-pointer"
                >
                  সম্পূর্ণ ডেটাবেস JSON ব্যাকআপ ডাউনলোড
                </a>
              </div>
            </div>

            {/* Import Section */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-700" />
                <h3 className="text-base font-bold text-slate-900">CSV থেকে তথ্য আমদানি</h3>
              </div>
              <p className="text-xs text-slate-600">
                CSV ফাইলের টেক্সট কপি করে নিচে পেস্ট করুন। আমদানির আগে প্রিভিউ ও ত্রুটি যাচাই হবে।
              </p>

              <div className="space-y-2 text-xs">
                <select
                  value={csvType}
                  onChange={(e) => setCsvType(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                >
                  <option value="buses">বাসের তথ্য (buses)</option>
                </select>

                <textarea
                  value={csvContent}
                  onChange={(e) => setCsvContent(e.target.value)}
                  rows={4}
                  placeholder="name_bn,name_en,start_point,end_point,departure_times,fare_info...&#10;পাবনা এক্সপ্রেস,Pabna Express,পাবনা,ঢাকা,সকাল ৭:০০,৬০০ টাকা"
                  className="w-full p-3 border border-slate-300 rounded-lg font-mono text-[11px]"
                />
              </div>

              {csvMsg && (
                <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs">
                  {csvMsg}
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCsvPreview}
                  className="px-4 py-2 border border-slate-300 text-slate-800 rounded-lg text-xs font-medium cursor-pointer"
                >
                  প্রিভিউ দেখুন
                </button>
                <button
                  type="button"
                  onClick={handleCsvImportExecute}
                  disabled={!csvContent}
                  className="px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  চূড়ান্ত আমদানি করুন
                </button>
              </div>

              {csvPreview && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                  <div>মোট সারি: {csvPreview.totalRows} টি, বৈধ: {csvPreview.validRows} টি</div>
                  {csvPreview.errors?.length > 0 && (
                    <div className="text-red-600 text-[11px]">ত্রুটি: {csvPreview.errors.join(', ')}</div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 8. AUDIT LOGS TAB */}
      {/* ======================================================== */}
      {activeTab === 'audit_logs' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900">সিস্টেম পরিবর্তনের পূর্ণ ইতিহাস (অডিট লগ)</h3>
          
          <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                <tr>
                  <th className="p-3">সময়</th>
                  <th className="p-3">ব্যবহারকারী</th>
                  <th className="p-3">অ্যাকশন</th>
                  <th className="p-3">বিভাগ</th>
                  <th className="p-3">বিবরণ</th>
                  <th className="p-3">আইপি</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="p-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {log.created_at.replace('T', ' ').substring(0, 19)}
                    </td>
                    <td className="p-3 font-semibold text-slate-900">{log.user_name}</td>
                    <td className="p-3">
                      <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{log.entity_type}</td>
                    <td className="p-3 text-slate-700 max-w-xs truncate" title={log.details}>
                      {log.details}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-400">{log.ip_address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* BUS CREATE / EDIT MODAL (ALL 19 FIELDS) */}
      {/* ======================================================== */}
      {busModalOpen && editingBus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="sticky top-0 bg-white p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {editingBus.id ? `বাস সম্পাদনা (${editingBus.id})` : 'নতুন বাস যোগ করুন'}
              </h3>
              <button
                onClick={() => setBusModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBus} className="p-5 space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">১. বাসের বাংলা নাম *</label>
                  <input
                    type="text"
                    value={editingBus.name_bn || ''}
                    onChange={(e) => setEditingBus({ ...editingBus, name_bn: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">২. বাসের ইংরেজি নাম</label>
                  <input
                    type="text"
                    value={editingBus.name_en || ''}
                    onChange={(e) => setEditingBus({ ...editingBus, name_en: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">৩. বাস কোম্পানি</label>
                  <select
                    value={editingBus.company_id || ''}
                    onChange={(e) => setEditingBus({ ...editingBus, company_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name_bn}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">৪. বাসের ধরন</label>
                  <select
                    value={editingBus.bus_type || 'intercity'}
                    onChange={(e) => setEditingBus({ ...editingBus, bus_type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="intercity">দূরপাল্লার বাস (Intercity)</option>
                    <option value="local">লোকাল বাস (Local)</option>
                    <option value="pabna_crossing">পাবনা অতিক্রমকারী (Crossing)</option>
                    <option value="regional">আঞ্চলিক বাস (Regional)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">৫. এসি অথবা নন-এসি</label>
                  <select
                    value={editingBus.is_ac ?? 0}
                    onChange={(e) => setEditingBus({ ...editingBus, is_ac: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value={0}>নন-এসি</option>
                    <option value={1}>এসি (AC)</option>
                    <option value={2}>এসি ও নন-এসি উভয়ই</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">৬. বাসের শ্রেণি (সিট ক্লাস)</label>
                  <input
                    type="text"
                    value={editingBus.seat_class || ''}
                    onChange={(e) => setEditingBus({ ...editingBus, seat_class: e.target.value })}
                    placeholder="Economy / Chair Coach"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">৭. যাত্রা শুরুর স্থান *</label>
                  <input
                    type="text"
                    value={editingBus.start_point || ''}
                    onChange={(e) => setEditingBus({ ...editingBus, start_point: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">৮. গন্তব্য স্থান *</label>
                  <input
                    type="text"
                    value={editingBus.end_point || ''}
                    onChange={(e) => setEditingBus({ ...editingBus, end_point: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">৯. মধ্যবর্তী স্টপেজ</label>
                <input
                  type="text"
                  value={editingBus.intermediate_stops || ''}
                  onChange={(e) => setEditingBus({ ...editingBus, intermediate_stops: e.target.value })}
                  placeholder="গাছপাড়া, রূপকথা মোড়, আতাইকুলা, কাশীনাথপুর..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">১০. চলাচলের দিন</label>
                  <input
                    type="text"
                    value={editingBus.operating_days || ''}
                    onChange={(e) => setEditingBus({ ...editingBus, operating_days: e.target.value })}
                    placeholder="প্রতিদিন"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">১১. সম্ভাব্য ছাড়ার সময়</label>
                  <input
                    type="text"
                    value={editingBus.departure_times || ''}
                    onChange={(e) => setEditingBus({ ...editingBus, departure_times: e.target.value })}
                    placeholder="সকাল ০৬:০০, ০৭:১৫, রাত ১০:৩০..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">১২. কাউন্টারের নাম</label>
                  <input
                    type="text"
                    value={editingBus.counter_name || ''}
                    onChange={(e) => setEditingBus({ ...editingBus, counter_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">১৩. কাউন্টারের ফোন নম্বর</label>
                  <input
                    type="text"
                    value={editingBus.counter_phone || ''}
                    onChange={(e) => setEditingBus({ ...editingBus, counter_phone: e.target.value })}
                    placeholder="০১৭xxxxxxxx"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">১৪. ভাড়ার তথ্য</label>
                  <input
                    type="text"
                    value={editingBus.fare_info || ''}
                    onChange={(e) => setEditingBus({ ...editingBus, fare_info: e.target.value })}
                    placeholder="৬০০ টাকা"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Pabna Crossing Corridor specific fields */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-950">পাবনা অতিক্রমকারী বাসের ক্ষেত্রসমূহ</span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-amber-900 font-semibold">
                    <input
                      type="checkbox"
                      checked={Boolean(editingBus.is_pabna_crossing)}
                      onChange={(e) => setEditingBus({ ...editingBus, is_pabna_crossing: e.target.checked ? 1 : 0 })}
                    />
                    <span>এই বাসটি পাবনা জেলা অতিক্রম করে</span>
                  </label>
                </div>

                {Boolean(editingBus.is_pabna_crossing) && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-slate-700 mb-0.5">পাবনায় প্রবেশের স্থান</label>
                      <input
                        type="text"
                        value={editingBus.crossing_entry_point || ''}
                        onChange={(e) => setEditingBus({ ...editingBus, crossing_entry_point: e.target.value })}
                        placeholder="কাশীনাথপুর / বনপাড়া"
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 mb-0.5">পাবনা মধ্যবর্তী স্টপ</label>
                      <input
                        type="text"
                        value={editingBus.crossing_pabna_stoppages || ''}
                        onChange={(e) => setEditingBus({ ...editingBus, crossing_pabna_stoppages: e.target.value })}
                        placeholder="দাশুড়িয়া মোড়"
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 mb-0.5">পাবনা হতে বের হওয়ার স্থান</label>
                      <input
                        type="text"
                        value={editingBus.crossing_exit_point || ''}
                        onChange={(e) => setEditingBus({ ...editingBus, crossing_exit_point: e.target.value })}
                        placeholder="পাকশী লালন শাহ সেতু"
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">১৬. তথ্যের উৎস</label>
                  <input
                    type="text"
                    value={editingBus.information_source || ''}
                    onChange={(e) => setEditingBus({ ...editingBus, information_source: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">১৭. যাচাইয়ের অবস্থা</label>
                  <select
                    value={editingBus.verification_status || 'verified'}
                    onChange={(e) => setEditingBus({ ...editingBus, verification_status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="verified">যাচাই করা হয়েছে (Verified)</option>
                    <option value="unverified">যাচাই করা হয়নি (Unverified)</option>
                    <option value="needs_reverification">পুনরায় যাচাই প্রয়োজন</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">১৯. প্রকাশের অবস্থা *</label>
                  <select
                    value={editingBus.status || 'published'}
                    onChange={(e) => setEditingBus({ ...editingBus, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="published">প্রকাশ করুন (Published)</option>
                    <option value="draft">খসড়া হিসেবে রাখুন (Draft)</option>
                    <option value="inactive">নিষ্ক্রিয় (Inactive)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">১৮. অতিরিক্ত তথ্য বা নির্দেশনা</label>
                <textarea
                  value={editingBus.additional_notes || ''}
                  onChange={(e) => setEditingBus({ ...editingBus, additional_notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setBusModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg cursor-pointer"
                >
                  {editingBus.status === 'draft' ? 'খসড়া সংরক্ষণ করুন' : 'প্রকাশ করুন'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ROUTE CREATE / EDIT MODAL */}
      {/* ======================================================== */}
      {routeModalOpen && editingRoute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">রুট ও স্টপেজ ব্যবস্থাপনা</h3>
              <button onClick={() => setRouteModalOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleSaveRoute} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">রুটের নাম (বাংলা) *</label>
                <input
                  type="text"
                  value={editingRoute.route_name_bn || ''}
                  onChange={(e) => setEditingRoute({ ...editingRoute, route_name_bn: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">যাত্রার শুরু *</label>
                  <input
                    type="text"
                    value={editingRoute.start_location || ''}
                    onChange={(e) => setEditingRoute({ ...editingRoute, start_location: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">গন্তব্য *</label>
                  <input
                    type="text"
                    value={editingRoute.end_location || ''}
                    onChange={(e) => setEditingRoute({ ...editingRoute, end_location: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">দূরত্ব (কি.মি.)</label>
                  <input
                    type="number"
                    value={editingRoute.distance_km || 0}
                    onChange={(e) => setEditingRoute({ ...editingRoute, distance_km: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">আনুমানিক সময়</label>
                  <input
                    type="text"
                    value={editingRoute.estimated_duration || ''}
                    onChange={(e) => setEditingRoute({ ...editingRoute, estimated_duration: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setRouteModalOpen(false)} className="px-4 py-2 border rounded-lg">বাতিল</button>
                <button type="submit" className="px-5 py-2 bg-emerald-700 text-white font-bold rounded-lg">সংরক্ষণ করুন</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* COUNTER CREATE / EDIT MODAL */}
      {/* ======================================================== */}
      {counterModalOpen && editingCounter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">কাউন্টার তথ্য ফরম</h3>
              <button onClick={() => setCounterModalOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleSaveCounter} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">কাউন্টারের নাম *</label>
                <input
                  type="text"
                  value={editingCounter.name_bn || ''}
                  onChange={(e) => setEditingCounter({ ...editingCounter, name_bn: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">উপজেলা *</label>
                  <select
                    value={editingCounter.upazila || 'পাবনা সদর'}
                    onChange={(e) => setEditingCounter({ ...editingCounter, upazila: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="পাবনা সদর">পাবনা সদর</option>
                    <option value="ঈশ্বরদী">ঈশ্বরদী</option>
                    <option value="সাঁথিয়া">সাঁথিয়া</option>
                    <option value="বেড়া">বেড়া</option>
                    <option value="চাটমোহর">চাটমোহর</option>
                    <option value="সুজানগর">সুজানগর</option>
                    <option value="ফরিদপুর">ফরিদপুর</option>
                    <option value="আটঘরিয়া">আটঘরিয়া</option>
                    <option value="ভাঙ্গুড়া">ভাঙ্গুড়া</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">ফোন নম্বর *</label>
                  <input
                    type="text"
                    value={editingCounter.phone || ''}
                    onChange={(e) => setEditingCounter({ ...editingCounter, phone: e.target.value })}
                    required
                    placeholder="০১৭xxxxxxxx"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">ঠিকানা *</label>
                <input
                  type="text"
                  value={editingCounter.address || ''}
                  onChange={(e) => setEditingCounter({ ...editingCounter, address: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">বিকল্প ফোন নম্বর</label>
                  <input
                    type="text"
                    value={editingCounter.alt_phone || ''}
                    onChange={(e) => setEditingCounter({ ...editingCounter, alt_phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">খোলার সময়</label>
                  <input
                    type="text"
                    value={editingCounter.opening_hours || ''}
                    onChange={(e) => setEditingCounter({ ...editingCounter, opening_hours: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="phoneVerified"
                  checked={Boolean(editingCounter.is_phone_verified)}
                  onChange={(e) => setEditingCounter({ ...editingCounter, is_phone_verified: e.target.checked ? 1 : 0 })}
                />
                <label htmlFor="phoneVerified" className="cursor-pointer font-medium">ফোন নম্বর সরেজমিন বা কল যাচাইকৃত</label>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setCounterModalOpen(false)} className="px-4 py-2 border rounded-lg">বাতিল</button>
                <button type="submit" className="px-5 py-2 bg-emerald-700 text-white font-bold rounded-lg">সংরক্ষণ করুন</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* COMPANY CREATE / EDIT MODAL */}
      {/* ======================================================== */}
      {companyModalOpen && editingCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">কোম্পানি তথ্য</h3>
              <button onClick={() => setCompanyModalOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleSaveCompany} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">কোম্পানির নাম (বাংলা) *</label>
                <input
                  type="text"
                  value={editingCompany.name_bn || ''}
                  onChange={(e) => setEditingCompany({ ...editingCompany, name_bn: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">ইংরেজি নাম</label>
                <input
                  type="text"
                  value={editingCompany.name_en || ''}
                  onChange={(e) => setEditingCompany({ ...editingCompany, name_en: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">প্রধান কার্যালয়</label>
                  <input
                    type="text"
                    value={editingCompany.head_office || ''}
                    onChange={(e) => setEditingCompany({ ...editingCompany, head_office: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">হটলাইন / নম্বর</label>
                  <input
                    type="text"
                    value={editingCompany.contact_number || ''}
                    onChange={(e) => setEditingCompany({ ...editingCompany, contact_number: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setCompanyModalOpen(false)} className="px-4 py-2 border rounded-lg">বাতিল</button>
                <button type="submit" className="px-5 py-2 bg-emerald-700 text-white font-bold rounded-lg">সংরক্ষণ করুন</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DELETE CONFIRMATION DIALOG */}
      {/* ======================================================== */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">আপনি কি নিশ্চিত?</h3>
            <p className="text-xs text-slate-600">
              আপনি <strong>"{deleteConfirm.name}"</strong> রেকর্ডটি স্থায়ীভাবে মুছে ফেলতে যাচ্ছেন। এই পরিবর্তনটি অডিট লগে সংরক্ষিত হবে।
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs cursor-pointer"
              >
                বাতিল
              </button>
              <button
                onClick={handleDeleteConfirmed}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                হ্যাঁ, মুছে ফেলুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PASSWORD CHANGE MODAL */}
      {/* ======================================================== */}
      {pwModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-xs">
            <h3 className="text-base font-bold text-slate-900">অ্যাডমিন পাসওয়ার্ড পরিবর্তন</h3>
            {pwMsg && <div className="p-2 bg-emerald-50 text-emerald-800 rounded">{pwMsg}</div>}
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">বর্তমান পাসওয়ার্ড</label>
                <input
                  type="password"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)</label>
                <input
                  type="password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setPwModalOpen(false)} className="px-3 py-1.5 border rounded-lg">বাতিল</button>
                <button type="submit" className="px-4 py-1.5 bg-emerald-700 text-white rounded-lg font-bold">পরিবর্তন করুন</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
