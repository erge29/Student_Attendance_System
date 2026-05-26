// ============================================================
// server.js — REST API Sistem Absensi Siswa
// Tugas Besar Komputasi Awan — Universitas Telkom
// ============================================================

const express = require('express');
const mysql2  = require('mysql2/promise');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const cors    = require('cors');

const app = express();
const PORT      = process.env.PORT      || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'absensi-secret-key-2024';

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Database Pool ─────────────────────────────────────────────
const db = mysql2.createPool({
  host    : process.env.DB_HOST || '192.168.56.11',
  user    : process.env.DB_USER || 'absensi_user',
  password: process.env.DB_PASS || 'absensi123',
  database: process.env.DB_NAME || 'db_absensi',
  waitForConnections: true,
  connectionLimit   : 10,
});

// ── Auth Middleware ───────────────────────────────────────────
function authMiddleware(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ message: 'Token tidak ditemukan' });
  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Token tidak valid' });
  }
}

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin')
    return res.status(403).json({ message: 'Hanya admin yang bisa mengakses ini' });
  next();
}

// ============================================================
// AUTH
// ============================================================

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: 'Username dan password wajib diisi' });

  const [rows] = await db.query(
    'SELECT g.*, k.nama_kelas FROM guru g LEFT JOIN kelas k ON g.kelas_id = k.id WHERE g.username = ?',
    [username]
  );
  if (!rows.length)
    return res.status(401).json({ message: 'Username atau password salah' });

  const guru = rows[0];
  const valid = await bcrypt.compare(password, guru.password);
  if (!valid)
    return res.status(401).json({ message: 'Username atau password salah' });

  const token = jwt.sign(
    { id: guru.id, username: guru.username, nama: guru.nama, role: guru.role, kelas_id: guru.kelas_id },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({
    token,
    user: { id: guru.id, username: guru.username, nama: guru.nama, role: guru.role, kelas_id: guru.kelas_id, nama_kelas: guru.nama_kelas }
  });
});

// GET /api/auth/me
app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// ============================================================
// ABSENSI
// ============================================================

// GET /api/absensi?kelas_id=&tanggal=
app.get('/api/absensi', authMiddleware, async (req, res) => {
  const { kelas_id, tanggal } = req.query;
  if (!kelas_id || !tanggal)
    return res.status(400).json({ message: 'kelas_id dan tanggal wajib diisi' });

  const [siswaList] = await db.query(
    'SELECT * FROM siswa WHERE kelas_id = ? ORDER BY nama', [kelas_id]
  );
  const [absensiList] = await db.query(
    'SELECT * FROM absensi WHERE kelas_id = ? AND tanggal = ?', [kelas_id, tanggal]
  );

  const absensiMap = {};
  absensiList.forEach(a => { absensiMap[a.siswa_id] = a; });

  const result = siswaList.map(s => ({
    ...s,
    absensi: absensiMap[s.id] || null,
    status : absensiMap[s.id]?.status || null,
  }));

  res.json(result);
});

// POST /api/absensi — simpan/update batch absensi
app.post('/api/absensi', authMiddleware, async (req, res) => {
  const { kelas_id, tanggal, data } = req.body;
  if (!kelas_id || !tanggal || !Array.isArray(data))
    return res.status(400).json({ message: 'kelas_id, tanggal, dan data wajib diisi' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    for (const item of data) {
      await conn.query(
        `INSERT INTO absensi (siswa_id, kelas_id, tanggal, status, keterangan, dicatat_oleh)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE status=VALUES(status), keterangan=VALUES(keterangan), dicatat_oleh=VALUES(dicatat_oleh)`,
        [item.siswa_id, kelas_id, tanggal, item.status, item.keterangan || null, req.user.id]
      );
    }
    await conn.commit();
    res.json({ message: 'Absensi berhasil disimpan' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: 'Gagal menyimpan absensi', error: err.message });
  } finally {
    conn.release();
  }
});

// GET /api/absensi/rekap?kelas_id=&bulan=YYYY-MM
app.get('/api/absensi/rekap', authMiddleware, async (req, res) => {
  const { kelas_id, bulan } = req.query;
  if (!kelas_id || !bulan)
    return res.status(400).json({ message: 'kelas_id dan bulan wajib diisi' });

  const [rows] = await db.query(
    `SELECT s.id, s.nis, s.nama,
       SUM(a.status = 'hadir') AS hadir,
       SUM(a.status = 'sakit') AS sakit,
       SUM(a.status = 'izin')  AS izin,
       SUM(a.status = 'alpha') AS alpha,
       COUNT(a.id)             AS total_hari
     FROM siswa s
     LEFT JOIN absensi a ON s.id = a.siswa_id AND DATE_FORMAT(a.tanggal,'%Y-%m') = ?
     WHERE s.kelas_id = ?
     GROUP BY s.id ORDER BY s.nama`,
    [bulan, kelas_id]
  );

  const result = rows.map(r => ({
    ...r,
    persentase: r.total_hari > 0 ? ((r.hadir / r.total_hari) * 100).toFixed(1) : '0.0'
  }));

  res.json(result);
});

// GET /api/absensi/siswa/:id?bulan=YYYY-MM
app.get('/api/absensi/siswa/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { bulan } = req.query;

  let query = 'SELECT * FROM absensi WHERE siswa_id = ?';
  const params = [id];
  if (bulan) { query += ' AND DATE_FORMAT(tanggal,"%Y-%m") = ?'; params.push(bulan); }
  query += ' ORDER BY tanggal DESC';

  const [rows] = await db.query(query, params);
  res.json(rows);
});

// ============================================================
// SISWA (Admin only: POST/PUT/DELETE)
// ============================================================

app.get('/api/siswa', authMiddleware, async (req, res) => {
  const { kelas_id } = req.query;
  let q = 'SELECT s.*, k.nama_kelas FROM siswa s JOIN kelas k ON s.kelas_id = k.id';
  const p = [];
  if (kelas_id) { q += ' WHERE s.kelas_id = ?'; p.push(kelas_id); }
  q += ' ORDER BY k.nama_kelas, s.nama';
  const [rows] = await db.query(q, p);
  res.json(rows);
});

app.get('/api/siswa/:id', authMiddleware, async (req, res) => {
  const [rows] = await db.query(
    'SELECT s.*, k.nama_kelas FROM siswa s JOIN kelas k ON s.kelas_id = k.id WHERE s.id = ?',
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ message: 'Siswa tidak ditemukan' });
  res.json(rows[0]);
});

app.post('/api/siswa', authMiddleware, adminOnly, async (req, res) => {
  const { nis, nama, kelas_id, jenis_kelamin } = req.body;
  if (!nis || !nama || !kelas_id || !jenis_kelamin)
    return res.status(400).json({ message: 'Semua field wajib diisi' });
  const [result] = await db.query(
    'INSERT INTO siswa (nis, nama, kelas_id, jenis_kelamin) VALUES (?,?,?,?)',
    [nis, nama, kelas_id, jenis_kelamin]
  );
  res.status(201).json({ id: result.insertId, message: 'Siswa berhasil ditambahkan' });
});

app.put('/api/siswa/:id', authMiddleware, adminOnly, async (req, res) => {
  const { nis, nama, kelas_id, jenis_kelamin } = req.body;
  await db.query(
    'UPDATE siswa SET nis=?, nama=?, kelas_id=?, jenis_kelamin=? WHERE id=?',
    [nis, nama, kelas_id, jenis_kelamin, req.params.id]
  );
  res.json({ message: 'Data siswa berhasil diupdate' });
});

app.delete('/api/siswa/:id', authMiddleware, adminOnly, async (req, res) => {
  await db.query('DELETE FROM siswa WHERE id = ?', [req.params.id]);
  res.json({ message: 'Siswa berhasil dihapus' });
});

// ============================================================
// KELAS
// ============================================================

app.get('/api/kelas', authMiddleware, async (req, res) => {
  const [rows] = await db.query('SELECT * FROM kelas ORDER BY tingkat, nama_kelas');
  res.json(rows);
});

app.post('/api/kelas', authMiddleware, adminOnly, async (req, res) => {
  const { nama_kelas, tingkat } = req.body;
  const [result] = await db.query(
    'INSERT INTO kelas (nama_kelas, tingkat) VALUES (?,?)', [nama_kelas, tingkat]
  );
  res.status(201).json({ id: result.insertId, message: 'Kelas berhasil ditambahkan' });
});

app.delete('/api/kelas/:id', authMiddleware, adminOnly, async (req, res) => {
  await db.query('DELETE FROM kelas WHERE id = ?', [req.params.id]);
  res.json({ message: 'Kelas berhasil dihapus' });
});

// ============================================================
// GURU
// ============================================================

app.get('/api/guru', authMiddleware, adminOnly, async (req, res) => {
  const [rows] = await db.query(
    'SELECT g.id, g.username, g.nama, g.role, g.kelas_id, k.nama_kelas FROM guru g LEFT JOIN kelas k ON g.kelas_id = k.id ORDER BY g.nama'
  );
  res.json(rows);
});

app.post('/api/guru', authMiddleware, adminOnly, async (req, res) => {
  const { username, password, nama, role, kelas_id } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const [result] = await db.query(
    'INSERT INTO guru (username, password, nama, role, kelas_id) VALUES (?,?,?,?,?)',
    [username, hash, nama, role || 'guru', kelas_id || null]
  );
  res.status(201).json({ id: result.insertId, message: 'Guru berhasil ditambahkan' });
});

app.delete('/api/guru/:id', authMiddleware, adminOnly, async (req, res) => {
  await db.query('DELETE FROM guru WHERE id = ?', [req.params.id]);
  res.json({ message: 'Guru berhasil dihapus' });
});

// ============================================================
// DASHBOARD
// ============================================================

app.get('/api/dashboard', authMiddleware, async (req, res) => {
  const [[{ total_siswa }]]  = await db.query('SELECT COUNT(*) AS total_siswa FROM siswa');
  const [[{ total_kelas }]]  = await db.query('SELECT COUNT(*) AS total_kelas FROM kelas');
  const [[{ total_guru }]]   = await db.query('SELECT COUNT(*) AS total_guru FROM guru WHERE role = "guru"');
  const [[{ total_absensi }]]= await db.query('SELECT COUNT(*) AS total_absensi FROM absensi WHERE tanggal = CURDATE()');

  const [perKelas] = await db.query(
    `SELECT k.nama_kelas,
       SUM(a.status='hadir') AS hadir,
       SUM(a.status='sakit') AS sakit,
       SUM(a.status='izin')  AS izin,
       SUM(a.status='alpha') AS alpha
     FROM kelas k
     LEFT JOIN absensi a ON k.id = a.kelas_id AND a.tanggal = CURDATE()
     GROUP BY k.id ORDER BY k.nama_kelas`
  );

  res.json({ total_siswa, total_kelas, total_guru, total_absensi_hari_ini: total_absensi, per_kelas: perKelas });
});

// ============================================================
// HEALTH CHECK
// ============================================================

app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', timestamp: new Date() });
  } catch {
    res.status(500).json({ status: 'error', db: 'disconnected' });
  }
});

// ── Start Server ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ API Absensi berjalan di port ${PORT}`);
  console.log(`   DB Host : ${process.env.DB_HOST || '192.168.56.11'}`);
});
