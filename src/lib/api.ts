import type { 
  Bus, BusCompany, Route, Counter, CorrectionRequest, 
  AuditLog, DashboardStats 
} from '../types/index.ts';

// Helper to convert numbers to Bengali digits
export function toBnDigits(num: number | string | undefined | null): string {
  if (num === undefined || num === null) return '';
  const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, d => bn[Number(d)]);
}

// Helper to normalize input for dual language search
export function normalizeBnEn(input: string): string {
  if (!input) return '';
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  let res = input.trim();
  for (let i = 0; i < 10; i++) {
    res = res.replaceAll(bnDigits[i], String(i));
  }
  return res.toLowerCase();
}

// Token management in localStorage for authorization headers fallback
const TOKEN_KEY = 'pabna_admin_token';

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// Generic fetch wrapper
async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
    credentials: 'include' // allow cookies
  });

  if (!res.ok) {
    let errorMsg = 'অনুরোধ ব্যর্থ হয়েছে';
    try {
      const data = await res.json();
      errorMsg = data.message_bn || data.error_bn || data.message || data.error || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }

  return res.json();
}

// Public API
export const api = {
  // Stats
  getStats: () => fetchApi<{ totalBuses: number; crossingBuses: number; totalRoutes: number; totalCounters: number; totalCompanies: number }>('/api/stats'),

  // Buses
  getBuses: (params: {
    search?: string;
    bus_type?: string;
    is_ac?: string;
    company_id?: string;
    is_pabna_crossing?: string;
    verified_only?: string;
    limit?: string;
  } = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.bus_type) query.set('bus_type', params.bus_type);
    if (params.is_ac !== undefined) query.set('is_ac', params.is_ac);
    if (params.company_id) query.set('company_id', params.company_id);
    if (params.is_pabna_crossing !== undefined) query.set('is_pabna_crossing', params.is_pabna_crossing);
    if (params.verified_only) query.set('verified_only', params.verified_only);
    if (params.limit) query.set('limit', params.limit);
    return fetchApi<{ total: number; data: Bus[] }>(`/api/buses?${query.toString()}`);
  },

  getBusById: (id: string) => fetchApi<Bus>(`/api/buses/${id}`),

  // Routes
  getRoutes: (params: { type?: string; search?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.type) query.set('type', params.type);
    if (params.search) query.set('search', params.search);
    return fetchApi<Route[]>(`/api/routes?${query.toString()}`);
  },

  getRouteById: (id: string) => fetchApi<Route & { buses: Bus[] }>(`/api/routes/${id}`),

  // Companies
  getCompanies: () => fetchApi<BusCompany[]>('/api/companies'),
  getCompanyById: (id: string) => fetchApi<BusCompany & { buses: Bus[]; counters: Counter[] }>(`/api/companies/${id}`),

  // Counters
  getCounters: (params: { upazila?: string; company_id?: string; search?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.upazila) query.set('upazila', params.upazila);
    if (params.company_id) query.set('company_id', params.company_id);
    if (params.search) query.set('search', params.search);
    return fetchApi<Counter[]>(`/api/counters?${query.toString()}`);
  },

  // Submit correction
  submitCorrection: (data: Partial<CorrectionRequest>) => 
    fetchApi<{ success: boolean; id: string; message_bn: string }>('/api/corrections', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Admin Auth
  adminLogin: (credentials: { username: string; password: string }) =>
    fetchApi<{ success: boolean; token: string; user: any; message_bn: string }>('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),

  adminLogout: () =>
    fetchApi<{ success: boolean; message_bn: string }>('/api/admin/logout', { method: 'POST' }),

  adminMe: () => fetchApi<{ user: any }>('/api/admin/me'),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    fetchApi<{ success: boolean; message_bn: string }>('/api/admin/change-password', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Admin Dashboard
  getDashboardStats: () => fetchApi<DashboardStats>('/api/admin/dashboard'),

  // Admin Bus CRUD
  getAdminBuses: (params: { status?: string; type?: string; company?: string; search?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.type) query.set('type', params.type);
    if (params.company) query.set('company', params.company);
    if (params.search) query.set('search', params.search);
    return fetchApi<Bus[]>(`/api/admin/buses?${query.toString()}`);
  },

  createBus: (data: Partial<Bus>) =>
    fetchApi<{ success: boolean; id: string; message_bn: string }>('/api/admin/buses', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateBus: (id: string, data: Partial<Bus>) =>
    fetchApi<{ success: boolean; message_bn: string }>(`/api/admin/buses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  deleteBus: (id: string, hardDelete: boolean = false) =>
    fetchApi<{ success: boolean; message_bn: string }>(`/api/admin/buses/${id}?hardDelete=${hardDelete}`, {
      method: 'DELETE'
    }),

  toggleBusStatus: (id: string, status: 'published' | 'draft') =>
    fetchApi<{ success: boolean; message_bn: string }>(`/api/admin/buses/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),

  // Admin Routes CRUD
  getAdminRoutes: () => fetchApi<Route[]>('/api/admin/routes'),
  createRoute: (data: Partial<Route>) =>
    fetchApi<{ success: boolean; id: string; message_bn: string }>('/api/admin/routes', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateRoute: (id: string, data: Partial<Route>) =>
    fetchApi<{ success: boolean; message_bn: string }>(`/api/admin/routes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteRoute: (id: string) =>
    fetchApi<{ success: boolean; message_bn: string }>(`/api/admin/routes/${id}`, {
      method: 'DELETE'
    }),

  // Admin Companies
  createCompany: (data: Partial<BusCompany>) =>
    fetchApi<{ success: boolean; id: string; message_bn: string }>('/api/admin/companies', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateCompany: (id: string, data: Partial<BusCompany>) =>
    fetchApi<{ success: boolean; message_bn: string }>(`/api/admin/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteCompany: (id: string) =>
    fetchApi<{ success: boolean; message_bn: string }>(`/api/admin/companies/${id}`, {
      method: 'DELETE'
    }),

  // Admin Counters
  createCounter: (data: Partial<Counter>) =>
    fetchApi<{ success: boolean; id: string; message_bn: string }>('/api/admin/counters', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateCounter: (id: string, data: Partial<Counter>) =>
    fetchApi<{ success: boolean; message_bn: string }>(`/api/admin/counters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteCounter: (id: string) =>
    fetchApi<{ success: boolean; message_bn: string }>(`/api/admin/counters/${id}`, {
      method: 'DELETE'
    }),

  // Admin Corrections
  getCorrections: (status?: string) => {
    const q = status ? `?status=${status}` : '';
    return fetchApi<CorrectionRequest[]>(`/api/admin/corrections${q}`);
  },
  updateCorrection: (id: string, status: string, admin_notes?: string) =>
    fetchApi<{ success: boolean; message_bn: string }>(`/api/admin/corrections/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, admin_notes })
    }),

  // Admin Audit logs
  getAuditLogs: () => fetchApi<AuditLog[]>('/api/admin/audit-logs'),

  // CSV import
  importCsv: (type: string, csvContent: string, previewOnly: boolean = false) =>
    fetchApi<{ success: boolean; message_bn?: string; importedCount?: number; preview?: boolean; totalRows?: number; validRows?: number; errors?: string[]; sample?: any[] }>(`/api/admin/import/csv/${type}`, {
      method: 'POST',
      body: JSON.stringify({ csvContent, previewOnly })
    })
};
