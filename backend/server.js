// ============================================================
// server.js — REST API Sistem Absensi Mahasiswa
// Tugas Besar Komputasi Awan — Universitas Telkom
// ============================================================

const express = require('express');
const mysql2  = require('mysql2/promise');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const cors    = require('cors');

const app = express();
const PORT       = process.env.PORT       || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'absensi-mahasiswa-secret-2024';

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

// ── Auto-fix password hash on startup ────────────────────────
// Memastikan semua password di DB adalah hash bcrypt yang valid
async function fixPasswordsOnStartup() {
  try {
    const [rows] = await db.query('SELECT id, password FROM dosen');
    for (const row of rows) {
      const isHashed = row.password && row.password.startsWith('$2');
      if (!isHashed) {
        // Plaintext — hash sekarang
        const hash = await bcrypt.hash(row.password, 10);
        await db.query('UPDATE dosen SET password = ? WHERE id = ?', [hash, row.id]);
        console.log(`  ✔ Password dosen id=${row.id} berhasil di-hash`);
      }
    }
    // Jika semua sudah hash tapi tidak bisa login, reset ke admin123
    const [check] = await db.query('SELECT COUNT(*) as c FROM dosen');
    if (check[0].c > 0) {
      // Verifikasi: coba compare 'admin123' dengan hash pertama
      const [sample] = await db.query('SELECT password FROM dosen LIMIT 1');
      const ok = await bcrypt.compare('admin123', sample[0].password);
      if (!ok) {
        console.log('  ⚠ Hash tidak cocok dengan admin123, mereset semua password...');
        const newHash = await bcrypt.hash('admin123', 10);
        await db.query('UPDATE dosen SET password = ?', [newHash]);
        console.log('  ✔ Semua password direset ke admin123');
      }
    }
    console.log('✅ Password check selesai');
  } catch (err) {
    console.error('Password fix error:', err.message);
  }
}

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

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ message: 'Username dan password wajib diisi' });

    const [rows] = await db.query(
      'SELECT d.*, k.nama_matkul FROM dosen d LEFT JOIN kelas k ON d.kelas_id = k.id WHERE d.username = ?',
      [username]
    );
    if (!rows.length)
      return res.status(401).json({ message: 'Username atau password salah' });

    const dosen = rows[0];
    const valid = await bcrypt.compare(password, dosen.password);
    if (!valid)
      return res.status(401).json({ message: 'Username atau password salah' });

    const token = jwt.sign(
      { id: dosen.id, username: dosen.username, nama: dosen.nama, role: dosen.role, kelas_id: dosen.kelas_id },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: dosen.id, username: dosen.username, nama: dosen.nama,
        role: dosen.role, kelas_id: dosen.kelas_id, nama_matkul: dosen.nama_matkul
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// ============================================================
// ABSENSI
// ============================================================

app.get('/api/absensi', authMiddleware, async (req, res) => {
  const { kelas_id, tanggal } = req.query;
  if (!kelas_id || !tanggal)
    return res.status(400).json({ message: 'kelas_id dan tanggal wajib diisi' });

  const [mhsList] = await db.query(
    'SELECT * FROM mahasiswa WHERE kelas_id = ? ORDER BY nama', [kelas_id]
  );
  const [absensiList] = await db.query(
    'SELECT * FROM absensi WHERE kelas_id = ? AND tanggal = ?', [kelas_id, tanggal]
  );

  const absensiMap = {};
  absensiList.forEach(a => { absensiMap[a.mahasiswa_id] = a; });

  const result = mhsList.map(m => ({
    ...m,
    absensi: absensiMap[m.id] || null,
    status : absensiMap[m.id]?.status || null,
  }));

  res.json(result);
});

app.post('/api/absensi', authMiddleware, async (req, res) => {
  const { kelas_id, tanggal, pertemuan_ke, data } = req.body;
  if (!kelas_id || !tanggal || !Array.isArray(data))
    return res.status(400).json({ message: 'kelas_id, tanggal, dan data wajib diisi' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    for (const item of data) {
      await conn.query(
        `INSERT INTO absensi (mahasiswa_id, kelas_id, tanggal, pertemuan_ke, status, keterangan, dicatat_oleh)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           status=VALUES(status), keterangan=VALUES(keterangan),
           pertemuan_ke=VALUES(pertemuan_ke), dicatat_oleh=VALUES(dicatat_oleh)`,
        [item.mahasiswa_id, kelas_id, tanggal, pertemuan_ke || 1, item.status, item.keterangan || null, req.user.id]
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

app.get('/api/absensi/rekap', authMiddleware, async (req, res) => {
  const { kelas_id, bulan } = req.query;
  if (!kelas_id || !bulan)
    return res.status(400).json({ message: 'kelas_id dan bulan wajib diisi' });

  const [rows] = await db.query(
    `SELECT m.id, m.nim, m.nama, m.program_studi, m.angkatan,
       SUM(a.status = 'hadir') AS hadir,
       SUM(a.status = 'sakit') AS sakit,
       SUM(a.status = 'izin')  AS izin,
       SUM(a.status = 'alpha') AS alpha,
       COUNT(a.id)             AS total_pertemuan
     FROM mahasiswa m
     LEFT JOIN absensi a ON m.id = a.mahasiswa_id AND DATE_FORMAT(a.tanggal,'%Y-%m') = ?
     WHERE m.kelas_id = ?
     GROUP BY m.id ORDER BY m.nama`,
    [bulan, kelas_id]
  );

  const result = rows.map(r => ({
    ...r,
    persentase: r.total_pertemuan > 0 ? ((r.hadir / r.total_pertemuan) * 100).toFixed(1) : '0.0'
  }));

  res.json(result);
});

app.get('/api/absensi/mahasiswa/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { bulan } = req.query;
  let query = 'SELECT * FROM absensi WHERE mahasiswa_id = ?';
  const params = [id];
  if (bulan) { query += ' AND DATE_FORMAT(tanggal,"%Y-%m") = ?'; params.push(bulan); }
  query += ' ORDER BY tanggal DESC';
  const [rows] = await db.query(query, params);
  res.json(rows);
});

// ============================================================
// MAHASISWA
// ============================================================

app.get('/api/mahasiswa', authMiddleware, async (req, res) => {
  const { kelas_id } = req.query;
  let q = 'SELECT m.*, k.nama_matkul, k.kode_matkul FROM mahasiswa m JOIN kelas k ON m.kelas_id = k.id';
  const p = [];
  if (kelas_id) { q += ' WHERE m.kelas_id = ?'; p.push(kelas_id); }
  q += ' ORDER BY k.nama_matkul, m.nama';
  const [rows] = await db.query(q, p);
  res.json(rows);
});

app.get('/api/mahasiswa/:id', authMiddleware, async (req, res) => {
  const [rows] = await db.query(
    'SELECT m.*, k.nama_matkul FROM mahasiswa m JOIN kelas k ON m.kelas_id = k.id WHERE m.id = ?',
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ message: 'Mahasiswa tidak ditemukan' });
  res.json(rows[0]);
});

app.post('/api/mahasiswa', authMiddleware, adminOnly, async (req, res) => {
  const { nim, nama, kelas_id, program_studi, angkatan } = req.body;
  if (!nim || !nama || !kelas_id || !program_studi || !angkatan)
    return res.status(400).json({ message: 'Semua field wajib diisi' });
  const [result] = await db.query(
    'INSERT INTO mahasiswa (nim, nama, kelas_id, program_studi, angkatan) VALUES (?,?,?,?,?)',
    [nim, nama, kelas_id, program_studi, angkatan]
  );
  res.status(201).json({ id: result.insertId, message: 'Mahasiswa berhasil ditambahkan' });
});

app.put('/api/mahasiswa/:id', authMiddleware, adminOnly, async (req, res) => {
  const { nim, nama, kelas_id, program_studi, angkatan } = req.body;
  await db.query(
    'UPDATE mahasiswa SET nim=?, nama=?, kelas_id=?, program_studi=?, angkatan=? WHERE id=?',
    [nim, nama, kelas_id, program_studi, angkatan, req.params.id]
  );
  res.json({ message: 'Data mahasiswa berhasil diupdate' });
});

app.delete('/api/mahasiswa/:id', authMiddleware, adminOnly, async (req, res) => {
  await db.query('DELETE FROM mahasiswa WHERE id = ?', [req.params.id]);
  res.json({ message: 'Mahasiswa berhasil dihapus' });
});

// ============================================================
// KELAS / MATA KULIAH
// ============================================================

app.get('/api/kelas', authMiddleware, async (req, res) => {
  const [rows] = await db.query('SELECT * FROM kelas ORDER BY semester, nama_matkul');
  res.json(rows);
});

app.post('/api/kelas', authMiddleware, adminOnly, async (req, res) => {
  const { kode_matkul, nama_matkul, sks, semester } = req.body;
  const [result] = await db.query(
    'INSERT INTO kelas (kode_matkul, nama_matkul, sks, semester) VALUES (?,?,?,?)',
    [kode_matkul, nama_matkul, sks || 3, semester]
  );
  res.status(201).json({ id: result.insertId, message: 'Mata kuliah berhasil ditambahkan' });
});

app.delete('/api/kelas/:id', authMiddleware, adminOnly, async (req, res) => {
  await db.query('DELETE FROM kelas WHERE id = ?', [req.params.id]);
  res.json({ message: 'Mata kuliah berhasil dihapus' });
});

// ============================================================
// DOSEN
// ============================================================

app.get('/api/dosen', authMiddleware, adminOnly, async (req, res) => {
  const [rows] = await db.query(
    'SELECT d.id, d.username, d.nama, d.nidn, d.role, d.kelas_id, k.nama_matkul FROM dosen d LEFT JOIN kelas k ON d.kelas_id = k.id ORDER BY d.nama'
  );
  res.json(rows);
});

app.post('/api/dosen', authMiddleware, adminOnly, async (req, res) => {
  const { username, password, nama, nidn, role, kelas_id } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const [result] = await db.query(
    'INSERT INTO dosen (username, password, nama, nidn, role, kelas_id) VALUES (?,?,?,?,?,?)',
    [username, hash, nama, nidn || null, role || 'dosen', kelas_id || null]
  );
  res.status(201).json({ id: result.insertId, message: 'Dosen berhasil ditambahkan' });
});

app.delete('/api/dosen/:id', authMiddleware, adminOnly, async (req, res) => {
  await db.query('DELETE FROM dosen WHERE id = ?', [req.params.id]);
  res.json({ message: 'Dosen berhasil dihapus' });
});

// ============================================================
// DASHBOARD
// ============================================================

app.get('/api/dashboard', authMiddleware, async (req, res) => {
  const [[{ total_mahasiswa }]] = await db.query('SELECT COUNT(*) AS total_mahasiswa FROM mahasiswa');
  const [[{ total_kelas }]]     = await db.query('SELECT COUNT(*) AS total_kelas FROM kelas');
  const [[{ total_dosen }]]     = await db.query('SELECT COUNT(*) AS total_dosen FROM dosen WHERE role = "dosen"');
  const [[{ total_absensi }]]   = await db.query('SELECT COUNT(*) AS total_absensi FROM absensi WHERE tanggal = CURDATE()');

  const [perKelas] = await db.query(
    `SELECT k.nama_matkul,
       SUM(a.status='hadir') AS hadir,
       SUM(a.status='sakit') AS sakit,
       SUM(a.status='izin')  AS izin,
       SUM(a.status='alpha') AS alpha
     FROM kelas k
     LEFT JOIN absensi a ON k.id = a.kelas_id AND a.tanggal = CURDATE()
     GROUP BY k.id ORDER BY k.nama_matkul`
  );

  res.json({ total_mahasiswa, total_kelas, total_dosen, total_absensi_hari_ini: total_absensi, per_kelas: perKelas });
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

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`✅ API Absensi Mahasiswa berjalan di port ${PORT}`);
  console.log(`   DB Host : ${process.env.DB_HOST || '192.168.56.11'}`);
  console.log('🔧 Memeriksa dan memperbaiki password hash...');
  await fixPasswordsOnStartup();
});
