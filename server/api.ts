import express, { Request, Response } from 'express';
import { getDatabase, saveDatabase, logAudit, normalizeSearchTerm } from './db.ts';
import { 
  hashPassword, verifyPassword, createSessionToken, 
  requireAdminAuth, AuthenticatedRequest 
} from './auth.ts';
import type { 
  Bus, BusCompany, Route, RouteStop, Counter, 
  CorrectionRequest, AuditLog, DashboardStats 
} from '../src/types/index.ts';

const router = express.Router();

// Helper to convert SQL query result to array of objects
function queryAll<T = any>(sql: string, params: any[] = []): T[] {
  const db = (router as any).db;
  if (!db) return [];
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows: T[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return rows;
}

function queryOne<T = any>(sql: string, params: any[] = []): T | null {
  const rows = queryAll<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

// Attach DB to router middleware
router.use(async (req, res, next) => {
  try {
    (router as any).db = await getDatabase();
    next();
  } catch (err) {
    res.status(500).json({ error: 'Database connection failed', details: String(err) });
  }
});

// ==========================================
// 1. PUBLIC STATS & OVERVIEW
// ==========================================
router.get('/stats', (req, res) => {
  const totalBuses = queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM buses WHERE status = 'published' AND deleted_at IS NULL`)?.count || 0;
  const crossingBuses = queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM buses WHERE is_pabna_crossing = 1 AND status = 'published' AND deleted_at IS NULL`)?.count || 0;
  const totalRoutes = queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM routes WHERE status = 'published' AND deleted_at IS NULL`)?.count || 0;
  const totalCounters = queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM counters WHERE status = 'published' AND deleted_at IS NULL`)?.count || 0;
  const totalCompanies = queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM bus_companies WHERE status = 'published'`)?.count || 0;

  res.json({
    totalBuses,
    crossingBuses,
    totalRoutes,
    totalCounters,
    totalCompanies
  });
});

// ==========================================
// 2. PUBLIC BUSES ENDPOINTS
// ==========================================
router.get('/buses', (req, res) => {
  const { 
    search, bus_type, is_ac, company_id, 
    start_point, end_point, is_pabna_crossing, 
    verified_only, page = '1', limit = '50' 
  } = req.query;

  let sql = `
    SELECT b.*, c.name_bn as company_name_bn, c.name_en as company_name_en, c.logo_url as company_logo
    FROM buses b
    LEFT JOIN bus_companies c ON b.company_id = c.id
    WHERE b.status = 'published' AND b.deleted_at IS NULL
  `;
  const params: any[] = [];

  if (bus_type && bus_type !== 'all') {
    sql += ` AND b.bus_type = ?`;
    params.push(bus_type);
  }

  if (is_ac !== undefined && is_ac !== '' && is_ac !== 'all') {
    sql += ` AND b.is_ac = ?`;
    params.push(Number(is_ac));
  }

  if (company_id && company_id !== 'all') {
    sql += ` AND b.company_id = ?`;
    params.push(company_id);
  }

  if (is_pabna_crossing !== undefined && is_pabna_crossing !== '') {
    sql += ` AND b.is_pabna_crossing = ?`;
    params.push(Number(is_pabna_crossing));
  }

  if (verified_only === 'true' || verified_only === '1') {
    sql += ` AND b.verification_status = 'verified'`;
  }

  // Dual search: match in Bangla name, English name, start point, end point, stops, or company name
  if (search && String(search).trim() !== '') {
    const term = `%${String(search).trim()}%`;
    sql += ` AND (
      b.name_bn LIKE ? OR b.name_en LIKE ? OR 
      b.start_point LIKE ? OR b.end_point LIKE ? OR 
      b.intermediate_stops LIKE ? OR c.name_bn LIKE ? OR c.name_en LIKE ? OR
      b.crossing_pabna_stoppages LIKE ?
    )`;
    params.push(term, term, term, term, term, term, term, term);
  }

  sql += ` ORDER BY b.is_pabna_crossing ASC, b.name_bn ASC`;

  const buses = queryAll<Bus>(sql, params);
  res.json({
    total: buses.length,
    page: Number(page),
    data: buses
  });
});

router.get('/buses/:id', (req, res) => {
  const { id } = req.params;
  const bus = queryOne<Bus>(`
    SELECT b.*, c.name_bn as company_name_bn, c.name_en as company_name_en, 
           c.contact_number as company_phone, c.hotline as company_hotline, c.website as company_website
    FROM buses b
    LEFT JOIN bus_companies c ON b.company_id = c.id
    WHERE b.id = ? AND b.deleted_at IS NULL
  `, [id]);

  if (!bus) {
    return res.status(404).json({ error_bn: 'বাসের তথ্য পাওয়া যায়নি।' });
  }

  // Get associated routes
  const routes = queryAll<Route>(`
    SELECT r.* 
    FROM routes r
    INNER JOIN bus_route_assignments bra ON r.id = bra.route_id
    WHERE bra.bus_id = ? AND r.deleted_at IS NULL
  `, [id]);

  // For each route, fetch its ordered stops
  for (const r of routes) {
    r.stops = queryAll<RouteStop>(`
      SELECT * FROM route_stops 
      WHERE route_id = ? 
      ORDER BY stop_order ASC
    `, [r.id]);
  }
  bus.routes = routes;

  // Get associated counters
  bus.counters = queryAll<Counter>(`
    SELECT c.* 
    FROM counters c
    INNER JOIN counter_bus_assignments cba ON c.id = cba.counter_id
    WHERE cba.bus_id = ? AND c.deleted_at IS NULL
  `, [id]);

  res.json(bus);
});

// ==========================================
// 3. PUBLIC ROUTES ENDPOINTS
// ==========================================
router.get('/routes', (req, res) => {
  const { type, search } = req.query;
  let sql = `SELECT * FROM routes WHERE status = 'published' AND deleted_at IS NULL`;
  const params: any[] = [];

  if (type && type !== 'all') {
    sql += ` AND route_type = ?`;
    params.push(type);
  }

  if (search && String(search).trim() !== '') {
    const term = `%${String(search).trim()}%`;
    sql += ` AND (route_name_bn LIKE ? OR route_name_en LIKE ? OR start_location LIKE ? OR end_location LIKE ?)`;
    params.push(term, term, term, term);
  }

  sql += ` ORDER BY route_name_bn ASC`;
  const routes = queryAll<Route>(sql, params);

  // Attach stop counts & bus counts
  for (const r of routes) {
    r.stops = queryAll<RouteStop>(`SELECT * FROM route_stops WHERE route_id = ? ORDER BY stop_order ASC`, [r.id]);
    r.buses_count = queryOne<{ count: number }>(`
      SELECT COUNT(*) as count 
      FROM bus_route_assignments bra
      JOIN buses b ON bra.bus_id = b.id
      WHERE bra.route_id = ? AND b.status = 'published' AND b.deleted_at IS NULL
    `, [r.id])?.count || 0;
  }

  res.json(routes);
});

router.get('/routes/:id', (req, res) => {
  const { id } = req.params;
  const route = queryOne<Route>(`SELECT * FROM routes WHERE id = ? AND deleted_at IS NULL`, [id]);
  if (!route) {
    return res.status(404).json({ error_bn: 'রুটের তথ্য পাওয়া যায়নি।' });
  }

  route.stops = queryAll<RouteStop>(`SELECT * FROM route_stops WHERE route_id = ? ORDER BY stop_order ASC`, [id]);
  const buses = queryAll<Bus>(`
    SELECT b.*, c.name_bn as company_name_bn
    FROM buses b
    JOIN bus_route_assignments bra ON b.id = bra.bus_id
    LEFT JOIN bus_companies c ON b.company_id = c.id
    WHERE bra.route_id = ? AND b.status = 'published' AND b.deleted_at IS NULL
  `, [id]);

  res.json({ ...route, buses });
});

// ==========================================
// 4. PUBLIC COMPANIES ENDPOINTS
// ==========================================
router.get('/companies', (req, res) => {
  const companies = queryAll<BusCompany>(`SELECT * FROM bus_companies WHERE status = 'published' ORDER BY name_bn ASC`);
  for (const c of companies) {
    c.bus_count = queryOne<{ count: number }>(`
      SELECT COUNT(*) as count FROM buses 
      WHERE company_id = ? AND status = 'published' AND deleted_at IS NULL
    `, [c.id])?.count || 0;
  }
  res.json(companies);
});

router.get('/companies/:id', (req, res) => {
  const { id } = req.params;
  const company = queryOne<BusCompany>(`SELECT * FROM bus_companies WHERE id = ?`, [id]);
  if (!company) {
    return res.status(404).json({ error_bn: 'কোম্পানি পাওয়া যায়নি।' });
  }

  const buses = queryAll<Bus>(`
    SELECT * FROM buses 
    WHERE company_id = ? AND status = 'published' AND deleted_at IS NULL
    ORDER BY name_bn ASC
  `, [id]);

  const counters = queryAll<Counter>(`
    SELECT * FROM counters 
    WHERE company_id = ? AND status = 'published' AND deleted_at IS NULL
    ORDER BY upazila ASC, name_bn ASC
  `, [id]);

  res.json({ ...company, buses, counters });
});

// ==========================================
// 5. PUBLIC COUNTERS ENDPOINTS
// ==========================================
router.get('/counters', (req, res) => {
  const { upazila, company_id, search } = req.query;
  let sql = `
    SELECT c.*, cmp.name_bn as company_name_bn 
    FROM counters c
    LEFT JOIN bus_companies cmp ON c.company_id = cmp.id
    WHERE c.status = 'published' AND c.deleted_at IS NULL
  `;
  const params: any[] = [];

  if (upazila && upazila !== 'all') {
    sql += ` AND c.upazila = ?`;
    params.push(upazila);
  }

  if (company_id && company_id !== 'all') {
    sql += ` AND c.company_id = ?`;
    params.push(company_id);
  }

  if (search && String(search).trim() !== '') {
    const term = `%${String(search).trim()}%`;
    sql += ` AND (c.name_bn LIKE ? OR c.address LIKE ? OR c.phone LIKE ? OR cmp.name_bn LIKE ?)`;
    params.push(term, term, term, term);
  }

  sql += ` ORDER BY c.upazila ASC, c.name_bn ASC`;
  const counters = queryAll<Counter>(sql, params);
  res.json(counters);
});

// ==========================================
// 6. PUBLIC CORRECTION REQUEST SUBMISSION
// ==========================================
router.post('/corrections', (req, res) => {
  const { 
    bus_or_route_name, entity_type = 'bus', entity_id, 
    incorrect_info, proposed_correction, proof_link, 
    submitter_name, submitter_phone, submitter_comments 
  } = req.body;

  if (!bus_or_route_name || !incorrect_info || !proposed_correction) {
    return res.status(400).json({ 
      success: false, 
      message_bn: 'বাস বা রুটের নাম, ভুল তথ্য এবং সঠিক প্রস্তাব পূরণ করা আবশ্যক।' 
    });
  }

  const id = 'REQ-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
  const now = new Date().toISOString();
  const db = (router as any).db;

  db.run(`
    INSERT INTO correction_requests (
      id, bus_or_route_name, entity_type, entity_id, incorrect_info, proposed_correction,
      proof_link, submitter_name, submitter_phone, submitter_comments, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)
  `, [
    id, bus_or_route_name, entity_type, entity_id || null, incorrect_info, proposed_correction,
    proof_link || null, submitter_name || null, submitter_phone || null, submitter_comments || null, now, now
  ]);

  saveDatabase();

  logAudit(
    submitter_name || 'পাবলিক ব্যবহারকারী',
    'SUBMIT_CORRECTION',
    'correction_requests',
    id,
    bus_or_route_name,
    `সংশোধনের অনুরোধ জমা পড়েছে: ${incorrect_info.substring(0, 40)}...`,
    req.ip || '127.0.0.1'
  );

  res.json({
    success: true,
    id,
    message_bn: 'আপনার সংশোধনের অনুরোধ সফলভাবে জমা দেওয়া হয়েছে। অ্যাডমিন টিম যাচাই করে ব্যবস্থা নেবেন। ধন্যবাদ!'
  });
});

// ==========================================
// 7. ADMIN AUTHENTICATION
// ==========================================
router.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ 
      success: false, 
      message_bn: 'ব্যবহারকারীর নাম ও পাসওয়ার্ড প্রদান করুন।' 
    });
  }

  const user = queryOne<any>(`SELECT * FROM admin_users WHERE username = ? AND is_active = 1`, [username.trim()]);
  if (!user || !verifyPassword(password, user.password_hash, user.salt)) {
    return res.status(401).json({ 
      success: false, 
      message_bn: 'ব্যবহারকারীর নাম অথবা পাসওয়ার্ড সঠিক নয়।' 
    });
  }

  const token = createSessionToken(user.id, user.username, user.role);
  const now = new Date().toISOString();
  const db = (router as any).db;
  db.run(`UPDATE admin_users SET last_login_at = ? WHERE id = ?`, [now, user.id]);
  saveDatabase();

  // Set HTTP-only cookie
  res.cookie('admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  logAudit(
    user.username,
    'LOGIN',
    'auth',
    user.id,
    user.full_name,
    'অ্যাডমিন প্যানেলে সফল লগইন সম্পন্ন হয়েছে।',
    req.ip || '127.0.0.1',
    user.id
  );

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      full_name: user.full_name
    },
    message_bn: 'স্বাগতম! আপনি সফলভাবে অ্যাডমিন প্যানেলে প্রবেশ করেছেন।'
  });
});

router.post('/admin/logout', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  res.clearCookie('admin_session');
  if (req.user) {
    logAudit(
      req.user.username,
      'LOGOUT',
      'auth',
      req.user.userId,
      'লগআউট',
      'অ্যাডমিন সেশন সফলভাবে সমাপ্ত হয়েছে।',
      req.ip || '127.0.0.1',
      req.user.userId
    );
  }
  res.json({ success: true, message_bn: 'সফলভাবে লগআউট সম্পন্ন হয়েছে।' });
});

router.get('/admin/me', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const user = queryOne<any>(`SELECT id, username, email, role, full_name, created_at, last_login_at FROM admin_users WHERE id = ?`, [req.user?.userId]);
  if (!user) {
    return res.status(404).json({ error_bn: 'অ্যাডমিন অ্যাকাউন্ট পাওয়া যায়নি।' });
  }
  res.json({ user });
});

router.post('/admin/change-password', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ 
      success: false, 
      message_bn: 'বর্তমান পাসওয়ার্ড এবং কমপক্ষে ৬ অক্ষরের নতুন পাসওয়ার্ড দিন।' 
    });
  }

  const user = queryOne<any>(`SELECT * FROM admin_users WHERE id = ?`, [req.user?.userId]);
  if (!user || !verifyPassword(currentPassword, user.password_hash, user.salt)) {
    return res.status(400).json({ 
      success: false, 
      message_bn: 'বর্তমান পাসওয়ার্ড সঠিক নয়।' 
    });
  }

  const { hash, salt } = hashPassword(newPassword);
  const now = new Date().toISOString();
  const db = (router as any).db;
  db.run(`UPDATE admin_users SET password_hash = ?, salt = ?, updated_at = ? WHERE id = ?`, [hash, salt, now, user.id]);
  saveDatabase();

  logAudit(
    user.username,
    'CHANGE_PASSWORD',
    'auth',
    user.id,
    user.full_name,
    'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে।',
    req.ip || '127.0.0.1',
    user.id
  );

  res.json({ success: true, message_bn: 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে।' });
});

// ==========================================
// 8. ADMIN DASHBOARD STATS
// ==========================================
router.get('/admin/dashboard', requireAdminAuth, (req, res) => {
  const totalBuses = queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM buses WHERE deleted_at IS NULL`)?.count || 0;
  const publishedBuses = queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM buses WHERE status = 'published' AND deleted_at IS NULL`)?.count || 0;
  const draftBuses = queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM buses WHERE status = 'draft' AND deleted_at IS NULL`)?.count || 0;
  const crossingBuses = queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM buses WHERE is_pabna_crossing = 1 AND deleted_at IS NULL`)?.count || 0;
  
  const totalCompanies = queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM bus_companies`)?.count || 0;
  const totalRoutes = queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM routes WHERE deleted_at IS NULL`)?.count || 0;
  const totalCounters = queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM counters WHERE deleted_at IS NULL`)?.count || 0;

  const unverifiedCount = queryOne<{ count: number }>(`
    SELECT (
      (SELECT COUNT(*) FROM buses WHERE verification_status != 'verified' AND deleted_at IS NULL) +
      (SELECT COUNT(*) FROM counters WHERE verification_status != 'verified' AND deleted_at IS NULL) +
      (SELECT COUNT(*) FROM routes WHERE verification_status != 'verified' AND deleted_at IS NULL)
    ) as count
  `)?.count || 0;

  const pendingCorrections = queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM correction_requests WHERE status IN ('new', 'in_review')`)?.count || 0;
  const recentLogs = queryAll<AuditLog>(`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10`);
  const recentBuses = queryAll<Bus>(`
    SELECT b.*, c.name_bn as company_name_bn 
    FROM buses b 
    LEFT JOIN bus_companies c ON b.company_id = c.id
    WHERE b.deleted_at IS NULL 
    ORDER BY b.updated_at DESC LIMIT 8
  `);

  const stats: DashboardStats = {
    totalBuses,
    publishedBuses,
    draftBuses,
    crossingBuses,
    totalCompanies,
    totalRoutes,
    totalCounters,
    unverifiedCount,
    pendingCorrections,
    recentLogs,
    recentBuses
  };

  res.json(stats);
});

// ==========================================
// 9. ADMIN BUS MANAGEMENT (CRUD)
// ==========================================
router.get('/admin/buses', requireAdminAuth, (req, res) => {
  const { status, type, company, search } = req.query;
  let sql = `
    SELECT b.*, c.name_bn as company_name_bn 
    FROM buses b
    LEFT JOIN bus_companies c ON b.company_id = c.id
    WHERE b.deleted_at IS NULL
  `;
  const params: any[] = [];

  if (status && status !== 'all') {
    sql += ` AND b.status = ?`;
    params.push(status);
  }
  if (type && type !== 'all') {
    sql += ` AND b.bus_type = ?`;
    params.push(type);
  }
  if (company && company !== 'all') {
    sql += ` AND b.company_id = ?`;
    params.push(company);
  }
  if (search && String(search).trim() !== '') {
    const term = `%${String(search).trim()}%`;
    sql += ` AND (b.name_bn LIKE ? OR b.name_en LIKE ? OR b.start_point LIKE ? OR b.end_point LIKE ?)`;
    params.push(term, term, term, term);
  }

  sql += ` ORDER BY b.updated_at DESC`;
  const buses = queryAll<Bus>(sql, params);
  res.json(buses);
});

router.post('/admin/buses', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const b = req.body;
  if (!b.name_bn || !b.start_point || !b.end_point) {
    return res.status(400).json({ 
      success: false, 
      message_bn: 'বাসের বাংলা নাম, যাত্রা শুরুর স্থান এবং গন্তব্য প্রদান আবশ্যক।' 
    });
  }

  const id = b.id || ('BUS-PAB-' + Math.floor(100 + Math.random() * 900));
  const now = new Date().toISOString();
  const db = (router as any).db;

  try {
    db.run(`
      INSERT INTO buses (
        id, name_bn, name_en, company_id, bus_type, is_ac, seat_class,
        start_point, end_point, intermediate_stops, operating_days, departure_times,
        counter_name, counter_phone, fare_info, fare_verified, image_url,
        information_source, verification_status, verified_date, verified_by,
        status, additional_notes, is_pabna_crossing, crossing_entry_point,
        crossing_pabna_stoppages, crossing_exit_point, allows_boarding_in_pabna,
        is_direct_route, is_active_route, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, b.name_bn, b.name_en || b.name_bn, b.company_id || null, b.bus_type || 'intercity',
      Number(b.is_ac) || 0, b.seat_class || 'Economy / Chair Coach',
      b.start_point, b.end_point, b.intermediate_stops || '',
      b.operating_days || 'প্রতিদিন', b.departure_times || '',
      b.counter_name || '', b.counter_phone || '', b.fare_info || '',
      b.fare_verified ? 1 : 0, b.image_url || '',
      b.information_source || 'অ্যাডমিন প্যানেল এন্ট্রি',
      b.verification_status || 'verified',
      b.verified_date || now.split('T')[0],
      b.verified_by || req.user?.username || 'অ্যাডমিন',
      b.status || 'published', b.additional_notes || '',
      b.is_pabna_crossing ? 1 : 0, b.crossing_entry_point || null,
      b.crossing_pabna_stoppages || null, b.crossing_exit_point || null,
      b.allows_boarding_in_pabna ? 1 : 0,
      b.is_direct_route ? 1 : 0,
      b.is_active_route ? 1 : 0,
      now, now
    ]);

    // Handle route assignment if provided
    if (b.route_id) {
      db.run(`INSERT OR REPLACE INTO bus_route_assignments (id, bus_id, route_id) VALUES (?, ?, ?)`,
        ['BRA-' + Date.now().toString(36), id, b.route_id]);
    }

    saveDatabase();

    logAudit(
      req.user?.username || 'অ্যাডমিন',
      'CREATE',
      'buses',
      id,
      b.name_bn,
      `নতুন বাস যোগ করা হয়েছে: ${b.name_bn} (${b.start_point} ⇄ ${b.end_point})`,
      req.ip || '127.0.0.1',
      req.user?.userId
    );

    res.json({ 
      success: true, 
      id, 
      message_bn: 'বাসের তথ্য সফলভাবে ডেটাবেসে সংরক্ষণ করা হয়েছে।' 
    });
  } catch (err) {
    res.status(500).json({ error: String(err), message_bn: 'সংরক্ষণে ত্রুটি হয়েছে।' });
  }
});

router.put('/admin/buses/:id', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const b = req.body;
  const now = new Date().toISOString();
  const db = (router as any).db;

  const existing = queryOne<Bus>(`SELECT * FROM buses WHERE id = ?`, [id]);
  if (!existing) {
    return res.status(404).json({ message_bn: 'বাস পাওয়া যায়নি।' });
  }

  try {
    db.run(`
      UPDATE buses SET
        name_bn = ?, name_en = ?, company_id = ?, bus_type = ?, is_ac = ?, seat_class = ?,
        start_point = ?, end_point = ?, intermediate_stops = ?, operating_days = ?, departure_times = ?,
        counter_name = ?, counter_phone = ?, fare_info = ?, fare_verified = ?, image_url = ?,
        information_source = ?, verification_status = ?, verified_date = ?, verified_by = ?,
        status = ?, additional_notes = ?, is_pabna_crossing = ?, crossing_entry_point = ?,
        crossing_pabna_stoppages = ?, crossing_exit_point = ?, allows_boarding_in_pabna = ?,
        is_direct_route = ?, is_active_route = ?, updated_at = ?
      WHERE id = ?
    `, [
      b.name_bn, b.name_en || b.name_bn, b.company_id || null, b.bus_type || 'intercity',
      Number(b.is_ac) || 0, b.seat_class || 'Economy / Chair Coach',
      b.start_point, b.end_point, b.intermediate_stops || '',
      b.operating_days || 'প্রতিদিন', b.departure_times || '',
      b.counter_name || '', b.counter_phone || '', b.fare_info || '',
      b.fare_verified ? 1 : 0, b.image_url || '',
      b.information_source || 'অ্যাডমিন প্যানেল আপডেট',
      b.verification_status || 'verified',
      b.verified_date || now.split('T')[0],
      b.verified_by || req.user?.username || 'অ্যাডমিন',
      b.status || 'published', b.additional_notes || '',
      b.is_pabna_crossing ? 1 : 0, b.crossing_entry_point || null,
      b.crossing_pabna_stoppages || null, b.crossing_exit_point || null,
      b.allows_boarding_in_pabna ? 1 : 0,
      b.is_direct_route ? 1 : 0,
      b.is_active_route ? 1 : 0,
      now, id
    ]);

    saveDatabase();

    logAudit(
      req.user?.username || 'অ্যাডমিন',
      'UPDATE',
      'buses',
      id,
      b.name_bn,
      `বাসের তথ্য হালনাগাদ করা হয়েছে: ${b.name_bn}`,
      req.ip || '127.0.0.1',
      req.user?.userId
    );

    res.json({ success: true, message_bn: 'বাসের তথ্য সফলভাবে হালনাগাদ করা হয়েছে।' });
  } catch (err) {
    res.status(500).json({ error: String(err), message_bn: 'হালনাগাদে ত্রুটি হয়েছে।' });
  }
});

router.delete('/admin/buses/:id', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { hardDelete } = req.query;
  const now = new Date().toISOString();
  const db = (router as any).db;

  const bus = queryOne<Bus>(`SELECT * FROM buses WHERE id = ?`, [id]);
  if (!bus) {
    return res.status(404).json({ message_bn: 'বাস পাওয়া যায়নি।' });
  }

  if (hardDelete === 'true') {
    db.run(`DELETE FROM bus_route_assignments WHERE bus_id = ?`, [id]);
    db.run(`DELETE FROM counter_bus_assignments WHERE bus_id = ?`, [id]);
    db.run(`DELETE FROM buses WHERE id = ?`, [id]);
  } else {
    // Soft delete
    db.run(`UPDATE buses SET deleted_at = ?, status = 'inactive' WHERE id = ?`, [now, id]);
  }

  saveDatabase();

  logAudit(
    req.user?.username || 'অ্যাডমিন',
    'DELETE',
    'buses',
    id,
    bus.name_bn,
    hardDelete === 'true' ? `স্থায়ীভাবে মুছে ফেলা হয়েছে: ${bus.name_bn}` : `সফট ডিলিট (আর্কাইভ) করা হয়েছে: ${bus.name_bn}`,
    req.ip || '127.0.0.1',
    req.user?.userId
  );

  res.json({ success: true, message_bn: 'বাসের তথ্য সফলভাবে মুছে ফেলা হয়েছে।' });
});

router.patch('/admin/buses/:id/status', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const now = new Date().toISOString();
  const db = (router as any).db;

  const bus = queryOne<Bus>(`SELECT * FROM buses WHERE id = ?`, [id]);
  if (!bus) return res.status(404).json({ message_bn: 'বাস পাওয়া যায়নি।' });

  db.run(`UPDATE buses SET status = ?, updated_at = ? WHERE id = ?`, [status, now, id]);
  saveDatabase();

  logAudit(
    req.user?.username || 'অ্যাডমিন',
    status === 'published' ? 'PUBLISH' : 'UNPUBLISH',
    'buses',
    id,
    bus.name_bn,
    `বাসের স্ট্যাটাস পরিবর্তিত: ${status}`,
    req.ip || '127.0.0.1',
    req.user?.userId
  );

  res.json({ success: true, message_bn: `বাসের স্ট্যাটাস ${status === 'published' ? 'প্রকাশিত' : 'খসড়া'} করা হয়েছে।` });
});

// ==========================================
// 10. ADMIN ROUTE MANAGEMENT
// ==========================================
router.get('/admin/routes', requireAdminAuth, (req, res) => {
  const routes = queryAll<Route>(`SELECT * FROM routes WHERE deleted_at IS NULL ORDER BY updated_at DESC`);
  for (const r of routes) {
    r.stops = queryAll<RouteStop>(`SELECT * FROM route_stops WHERE route_id = ? ORDER BY stop_order ASC`, [r.id]);
  }
  res.json(routes);
});

router.post('/admin/routes', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const r = req.body;
  if (!r.route_name_bn || !r.start_location || !r.end_location) {
    return res.status(400).json({ message_bn: 'রুটের নাম, শুরু ও গন্তব্য আবশ্যক।' });
  }

  const id = r.id || ('RT-' + Math.floor(100 + Math.random() * 900));
  const now = new Date().toISOString();
  const db = (router as any).db;

  db.run(`
    INSERT INTO routes (
      id, route_name_bn, route_name_en, route_type, start_location, end_location,
      via_districts, via_upazilas, entry_point_pabna, exit_point_pabna, direction,
      distance_km, estimated_duration, verification_status, information_source, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    id, r.route_name_bn, r.route_name_en || r.route_name_bn, r.route_type || 'long_distance',
    r.start_location, r.end_location, r.via_districts || '', r.via_upazilas || '',
    r.entry_point_pabna || '', r.exit_point_pabna || '', r.direction || 'both_ways',
    Number(r.distance_km) || 0, r.estimated_duration || '',
    r.verification_status || 'verified', r.information_source || 'অ্যাডমিন রুট এন্ট্রি',
    r.status || 'published', now, now
  ]);

  // Insert stops if provided
  if (Array.isArray(r.stops)) {
    for (let i = 0; i < r.stops.length; i++) {
      const s = r.stops[i];
      const stopId = 'ST-' + Date.now().toString(36) + '-' + i;
      db.run(`
        INSERT INTO route_stops (
          id, route_id, stop_name_bn, stop_name_en, stop_order, district, upazila,
          is_in_pabna, is_boarding_allowed, lat, lng, fare_from_start
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        stopId, id, s.stop_name_bn, s.stop_name_en || '', i + 1, s.district || 'পাবনা',
        s.upazila || '', s.is_in_pabna ? 1 : 0, s.is_boarding_allowed ? 1 : 0,
        Number(s.lat) || 0, Number(s.lng) || 0, Number(s.fare_from_start) || 0
      ]);
    }
  }

  saveDatabase();

  logAudit(
    req.user?.username || 'অ্যাডমিন',
    'CREATE',
    'routes',
    id,
    r.route_name_bn,
    `নতুন রুট তৈরি করা হয়েছে: ${r.route_name_bn}`,
    req.ip || '127.0.0.1',
    req.user?.userId
  );

  res.json({ success: true, id, message_bn: 'রুট সফলভাবে তৈরি করা হয়েছে।' });
});

router.put('/admin/routes/:id', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const r = req.body;
  const now = new Date().toISOString();
  const db = (router as any).db;

  const existing = queryOne<Route>(`SELECT * FROM routes WHERE id = ?`, [id]);
  if (!existing) return res.status(404).json({ message_bn: 'রুট পাওয়া যায়নি।' });

  db.run(`
    UPDATE routes SET
      route_name_bn = ?, route_name_en = ?, route_type = ?, start_location = ?, end_location = ?,
      via_districts = ?, via_upazilas = ?, entry_point_pabna = ?, exit_point_pabna = ?, direction = ?,
      distance_km = ?, estimated_duration = ?, verification_status = ?, information_source = ?,
      status = ?, updated_at = ?
    WHERE id = ?
  `, [
    r.route_name_bn, r.route_name_en || r.route_name_bn, r.route_type || 'long_distance',
    r.start_location, r.end_location, r.via_districts || '', r.via_upazilas || '',
    r.entry_point_pabna || '', r.exit_point_pabna || '', r.direction || 'both_ways',
    Number(r.distance_km) || 0, r.estimated_duration || '',
    r.verification_status || 'verified', r.information_source || 'অ্যাডমিন আপডেট',
    r.status || 'published', now, id
  ]);

  if (Array.isArray(r.stops)) {
    db.run(`DELETE FROM route_stops WHERE route_id = ?`, [id]);
    for (let i = 0; i < r.stops.length; i++) {
      const s = r.stops[i];
      const stopId = s.id || ('ST-' + Date.now().toString(36) + '-' + i);
      db.run(`
        INSERT INTO route_stops (
          id, route_id, stop_name_bn, stop_name_en, stop_order, district, upazila,
          is_in_pabna, is_boarding_allowed, lat, lng, fare_from_start
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        stopId, id, s.stop_name_bn, s.stop_name_en || '', i + 1, s.district || 'পাবনা',
        s.upazila || '', s.is_in_pabna ? 1 : 0, s.is_boarding_allowed ? 1 : 0,
        Number(s.lat) || 0, Number(s.lng) || 0, Number(s.fare_from_start) || 0
      ]);
    }
  }

  saveDatabase();

  logAudit(
    req.user?.username || 'অ্যাডমিন',
    'UPDATE',
    'routes',
    id,
    r.route_name_bn,
    `রুট হালনাগাদ করা হয়েছে: ${r.route_name_bn}`,
    req.ip || '127.0.0.1',
    req.user?.userId
  );

  res.json({ success: true, message_bn: 'রুট ও স্টপেজ সফলভাবে হালনাগাদ করা হয়েছে।' });
});

router.delete('/admin/routes/:id', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const now = new Date().toISOString();
  const db = (router as any).db;

  const route = queryOne<Route>(`SELECT * FROM routes WHERE id = ?`, [id]);
  if (!route) return res.status(404).json({ message_bn: 'রুট পাওয়া যায়নি।' });

  db.run(`UPDATE routes SET deleted_at = ?, status = 'inactive' WHERE id = ?`, [now, id]);
  saveDatabase();

  logAudit(
    req.user?.username || 'অ্যাডমিন',
    'DELETE',
    'routes',
    id,
    route.route_name_bn,
    `রুট ডিলিট করা হয়েছে: ${route.route_name_bn}`,
    req.ip || '127.0.0.1',
    req.user?.userId
  );

  res.json({ success: true, message_bn: 'রুট সফলভাবে মুছে ফেলা হয়েছে।' });
});

// ==========================================
// 11. ADMIN COMPANY & COUNTER MANAGEMENT
// ==========================================
router.post('/admin/companies', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const c = req.body;
  if (!c.name_bn) return res.status(400).json({ message_bn: 'কোম্পানির বাংলা নাম আবশ্যক।' });

  // Prevent duplicate company names
  const existing = queryOne(`SELECT * FROM bus_companies WHERE name_bn = ?`, [c.name_bn.trim()]);
  if (existing) {
    return res.status(400).json({ message_bn: 'এই নামের কোম্পানি ইতোমধ্যে বিদ্যমান রয়েছে।' });
  }

  const id = c.id || ('COMP-' + Math.floor(100 + Math.random() * 900));
  const now = new Date().toISOString();
  const db = (router as any).db;

  db.run(`
    INSERT INTO bus_companies (
      id, name_bn, name_en, logo_url, description, head_office, contact_number,
      hotline, website, verification_status, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    id, c.name_bn, c.name_en || c.name_bn, c.logo_url || '', c.description || '',
    c.head_office || '', c.contact_number || '', c.hotline || '', c.website || '',
    c.verification_status || 'verified', c.status || 'published', now, now
  ]);

  saveDatabase();

  logAudit(
    req.user?.username || 'অ্যাডমিন',
    'CREATE',
    'bus_companies',
    id,
    c.name_bn,
    `নতুন বাস কোম্পানি যোগ করা হয়েছে: ${c.name_bn}`,
    req.ip || '127.0.0.1',
    req.user?.userId
  );

  res.json({ success: true, id, message_bn: 'কোম্পানি সফলভাবে যোগ করা হয়েছে।' });
});

router.put('/admin/companies/:id', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const c = req.body;
  const now = new Date().toISOString();
  const db = (router as any).db;

  db.run(`
    UPDATE bus_companies SET
      name_bn = ?, name_en = ?, logo_url = ?, description = ?, head_office = ?,
      contact_number = ?, hotline = ?, website = ?, verification_status = ?, status = ?, updated_at = ?
    WHERE id = ?
  `, [
    c.name_bn, c.name_en || c.name_bn, c.logo_url || '', c.description || '',
    c.head_office || '', c.contact_number || '', c.hotline || '', c.website || '',
    c.verification_status || 'verified', c.status || 'published', now, id
  ]);

  saveDatabase();

  logAudit(
    req.user?.username || 'অ্যাডমিন',
    'UPDATE',
    'bus_companies',
    id,
    c.name_bn,
    `কোম্পানি হালনাগাদ করা হয়েছে: ${c.name_bn}`,
    req.ip || '127.0.0.1',
    req.user?.userId
  );

  res.json({ success: true, message_bn: 'কোম্পানির তথ্য হালনাগাদ হয়েছে।' });
});

router.delete('/admin/companies/:id', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const db = (router as any).db;
  const c = queryOne<BusCompany>(`SELECT * FROM bus_companies WHERE id = ?`, [id]);
  if (!c) return res.status(404).json({ message_bn: 'কোম্পানি পাওয়া যায়নি।' });

  db.run(`DELETE FROM bus_companies WHERE id = ?`, [id]);
  saveDatabase();

  logAudit(
    req.user?.username || 'অ্যাডমিন',
    'DELETE',
    'bus_companies',
    id,
    c.name_bn,
    `কোম্পানি মুছে ফেলা হয়েছে: ${c.name_bn}`,
    req.ip || '127.0.0.1',
    req.user?.userId
  );

  res.json({ success: true, message_bn: 'কোম্পানি মুছে ফেলা হয়েছে।' });
});

// Counter CRUD
router.post('/admin/counters', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const c = req.body;
  if (!c.name_bn || !c.address || !c.phone || !c.upazila) {
    return res.status(400).json({ message_bn: 'কাউন্টারের নাম, ঠিকানা, উপজেলা ও ফোন নম্বর আবশ্যক।' });
  }

  const id = c.id || ('CNT-' + Math.floor(100 + Math.random() * 900));
  const now = new Date().toISOString();
  const db = (router as any).db;

  db.run(`
    INSERT INTO counters (
      id, name_bn, name_en, company_id, address, district, upazila,
      area_name, phone, alt_phone, google_maps_url, lat, lng, opening_hours,
      is_phone_verified, verification_status, verified_date, information_source,
      status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    id, c.name_bn, c.name_en || c.name_bn, c.company_id || null, c.address,
    c.district || 'পাবনা', c.upazila, c.area_name || '', c.phone, c.alt_phone || '',
    c.google_maps_url || '', Number(c.lat) || 0, Number(c.lng) || 0, c.opening_hours || '',
    c.is_phone_verified ? 1 : 0, c.verification_status || 'verified',
    c.verified_date || now.split('T')[0], c.information_source || 'অ্যাডমিন এন্ট্রি',
    c.status || 'published', now, now
  ]);

  saveDatabase();

  logAudit(
    req.user?.username || 'অ্যাডমিন',
    'CREATE',
    'counters',
    id,
    c.name_bn,
    `নতুন কাউন্টার যোগ করা হয়েছে: ${c.name_bn} (${c.upazila})`,
    req.ip || '127.0.0.1',
    req.user?.userId
  );

  res.json({ success: true, id, message_bn: 'কাউন্টার সফলভাবে যোগ করা হয়েছে।' });
});

router.put('/admin/counters/:id', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const c = req.body;
  const now = new Date().toISOString();
  const db = (router as any).db;

  db.run(`
    UPDATE counters SET
      name_bn = ?, name_en = ?, company_id = ?, address = ?, district = ?, upazila = ?,
      area_name = ?, phone = ?, alt_phone = ?, google_maps_url = ?, lat = ?, lng = ?,
      opening_hours = ?, is_phone_verified = ?, verification_status = ?, verified_date = ?,
      information_source = ?, status = ?, updated_at = ?
    WHERE id = ?
  `, [
    c.name_bn, c.name_en || c.name_bn, c.company_id || null, c.address,
    c.district || 'পাবনা', c.upazila, c.area_name || '', c.phone, c.alt_phone || '',
    c.google_maps_url || '', Number(c.lat) || 0, Number(c.lng) || 0,
    c.opening_hours || '', c.is_phone_verified ? 1 : 0, c.verification_status || 'verified',
    c.verified_date || now.split('T')[0], c.information_source || 'অ্যাডমিন আপডেট',
    c.status || 'published', now, id
  ]);

  saveDatabase();

  logAudit(
    req.user?.username || 'অ্যাডমিন',
    'UPDATE',
    'counters',
    id,
    c.name_bn,
    `কাউন্টার তথ্য হালনাগাদ করা হয়েছে: ${c.name_bn}`,
    req.ip || '127.0.0.1',
    req.user?.userId
  );

  res.json({ success: true, message_bn: 'কাউন্টারের তথ্য হালনাগাদ করা হয়েছে।' });
});

router.delete('/admin/counters/:id', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const db = (router as any).db;
  const c = queryOne<Counter>(`SELECT * FROM counters WHERE id = ?`, [id]);
  if (!c) return res.status(404).json({ message_bn: 'কাউন্টার পাওয়া যায়নি।' });

  db.run(`DELETE FROM counters WHERE id = ?`, [id]);
  saveDatabase();

  logAudit(
    req.user?.username || 'অ্যাডমিন',
    'DELETE',
    'counters',
    id,
    c.name_bn,
    `কাউন্টার মুছে ফেলা হয়েছে: ${c.name_bn}`,
    req.ip || '127.0.0.1',
    req.user?.userId
  );

  res.json({ success: true, message_bn: 'কাউন্টার সফলভাবে মুছে ফেলা হয়েছে।' });
});

// ==========================================
// 12. ADMIN CORRECTION REQUESTS MANAGEMENT
// ==========================================
router.get('/admin/corrections', requireAdminAuth, (req, res) => {
  const { status } = req.query;
  let sql = `SELECT * FROM correction_requests`;
  const params: any[] = [];
  if (status && status !== 'all') {
    sql += ` WHERE status = ?`;
    params.push(status);
  }
  sql += ` ORDER BY created_at DESC`;
  const items = queryAll<CorrectionRequest>(sql, params);
  res.json(items);
});

router.patch('/admin/corrections/:id', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { status, admin_notes } = req.body;
  const now = new Date().toISOString();
  const db = (router as any).db;

  const reqItem = queryOne<CorrectionRequest>(`SELECT * FROM correction_requests WHERE id = ?`, [id]);
  if (!reqItem) return res.status(404).json({ message_bn: 'অনুরোধ পাওয়া যায়নি।' });

  db.run(`
    UPDATE correction_requests 
    SET status = ?, admin_notes = ?, updated_at = ? 
    WHERE id = ?
  `, [status, admin_notes || null, now, id]);

  saveDatabase();

  logAudit(
    req.user?.username || 'অ্যাডমিন',
    'RESOLVE_CORRECTION',
    'correction_requests',
    id,
    reqItem.bus_or_route_name,
    `সংশোধনের অনুরোধের স্ট্যাটাস পরিবর্তিত: ${status}`,
    req.ip || '127.0.0.1',
    req.user?.userId
  );

  res.json({ success: true, message_bn: 'অনুরোধের অবস্থা হালনাগাদ করা হয়েছে।' });
});

// ==========================================
// 13. AUDIT LOGS
// ==========================================
router.get('/admin/audit-logs', requireAdminAuth, (req, res) => {
  const logs = queryAll<AuditLog>(`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100`);
  res.json(logs);
});

// ==========================================
// 14. DATA IMPORT & EXPORT (CSV / JSON)
// ==========================================
router.get('/admin/export/json', requireAdminAuth, (req, res) => {
  const buses = queryAll(`SELECT * FROM buses WHERE deleted_at IS NULL`);
  const routes = queryAll(`SELECT * FROM routes WHERE deleted_at IS NULL`);
  const route_stops = queryAll(`SELECT * FROM route_stops`);
  const companies = queryAll(`SELECT * FROM bus_companies`);
  const counters = queryAll(`SELECT * FROM counters WHERE deleted_at IS NULL`);

  const backup = {
    exported_at: new Date().toISOString(),
    version: '1.0',
    data: {
      bus_companies: companies,
      buses,
      routes,
      route_stops,
      counters
    }
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="pabna_bus_guide_backup.json"');
  res.send(JSON.stringify(backup, null, 2));
});

router.get('/admin/export/csv/:type', requireAdminAuth, (req, res) => {
  const { type } = req.params;
  let rows: any[] = [];
  let filename = `pabna_${type}_${Date.now()}.csv`;

  if (type === 'buses') {
    rows = queryAll(`
      SELECT b.id, b.name_bn, b.name_en, c.name_bn as company_name, b.bus_type, b.is_ac,
             b.seat_class, b.start_point, b.end_point, b.departure_times, b.fare_info,
             b.counter_phone, b.verification_status, b.status, b.is_pabna_crossing
      FROM buses b
      LEFT JOIN bus_companies c ON b.company_id = c.id
      WHERE b.deleted_at IS NULL
    `);
  } else if (type === 'routes') {
    rows = queryAll(`SELECT id, route_name_bn, route_name_en, route_type, start_location, end_location, distance_km, estimated_duration, status FROM routes WHERE deleted_at IS NULL`);
  } else if (type === 'counters') {
    rows = queryAll(`SELECT id, name_bn, upazila, address, phone, alt_phone, opening_hours, verification_status, status FROM counters WHERE deleted_at IS NULL`);
  } else if (type === 'companies') {
    rows = queryAll(`SELECT id, name_bn, name_en, head_office, contact_number, hotline, website, status FROM bus_companies`);
  } else {
    return res.status(400).send('Invalid export type');
  }

  if (rows.length === 0) {
    return res.send('');
  }

  const headers = Object.keys(rows[0]);
  const csvLines = [
    headers.join(','),
    ...rows.map(row => 
      headers.map(h => {
        const val = row[h] === null || row[h] === undefined ? '' : String(row[h]).replace(/"/g, '""');
        return `"${val}"`;
      }).join(',')
    )
  ];

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send('\uFEFF' + csvLines.join('\n')); // \uFEFF UTF-8 BOM for Excel Bengali rendering
});

router.post('/admin/import/csv/:type', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const { type } = req.params;
  const { csvContent, previewOnly } = req.body;

  if (!csvContent || typeof csvContent !== 'string') {
    return res.status(400).json({ success: false, message_bn: 'CSV ফাইল সামগ্রী প্রদান করুন।' });
  }

  const lines = csvContent.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) {
    return res.status(400).json({ success: false, message_bn: 'CSV ফাইলে কোনো ডেটা পাওয়া যায়নি।' });
  }

  // Parse CSV header
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const parsedRows: any[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    // Regex to handle comma separated values with quotes
    const values = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(',');
    const row: any = {};
    headers.forEach((h, idx) => {
      let val = values[idx] || '';
      val = val.trim().replace(/^"|"$/g, '').replace(/""/g, '"');
      row[h] = val;
    });

    if (type === 'buses' && (!row.name_bn || !row.start_point || !row.end_point)) {
      errors.push(`সারি ${i}: বাসের নাম বা প্রারম্ভ/গন্তব্য অনুপস্থিত।`);
    } else {
      parsedRows.push(row);
    }
  }

  if (previewOnly) {
    return res.json({
      success: true,
      preview: true,
      totalRows: lines.length - 1,
      validRows: parsedRows.length,
      errors,
      sample: parsedRows.slice(0, 5)
    });
  }

  // Execute database transaction
  const db = (router as any).db;
  const now = new Date().toISOString();
  let importedCount = 0;

  try {
    if (type === 'buses') {
      for (const row of parsedRows) {
        const id = row.id || ('BUS-PAB-' + Math.floor(100 + Math.random() * 900));
        db.run(`
          INSERT OR REPLACE INTO buses (
            id, name_bn, name_en, company_id, bus_type, is_ac, seat_class,
            start_point, end_point, departure_times, fare_info, counter_phone,
            verification_status, status, is_pabna_crossing, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          id, row.name_bn, row.name_en || row.name_bn, row.company_id || null,
          row.bus_type || 'intercity', Number(row.is_ac) || 0, row.seat_class || 'Economy',
          row.start_point, row.end_point, row.departure_times || '', row.fare_info || '',
          row.counter_phone || '', row.verification_status || 'verified',
          row.status || 'published', Number(row.is_pabna_crossing) || 0, now, now
        ]);
        importedCount++;
      }
    }

    saveDatabase();

    logAudit(
      req.user?.username || 'অ্যাডমিন',
      'IMPORT',
      type,
      'CSV-IMPORT',
      `${type} CSV আমদানি`,
      `মোট ${importedCount} টি রেকর্ড সফলভাবে ডেটাবেসে আমদানি করা হয়েছে।`,
      req.ip || '127.0.0.1',
      req.user?.userId
    );

    res.json({
      success: true,
      importedCount,
      errors,
      message_bn: `সফলভাবে ${importedCount} টি রেকর্ড ডেটাবেসে আমদানি করা হয়েছে।`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err), message_bn: 'আমদানিতে ব্যর্থতা ঘটেছে।' });
  }
});

export default router;
