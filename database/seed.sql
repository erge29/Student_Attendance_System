-- ============================================
-- SEED: Data Awal Sistem Absensi Siswa
-- ============================================

USE db_absensi;

-- Data Kelas
INSERT INTO kelas (nama_kelas, tingkat) VALUES
  ('X IPA 1', 'X'),
  ('X IPA 2', 'X'),
  ('XI IPS 1', 'XI'),
  ('XII IPA 1', 'XII')
ON DUPLICATE KEY UPDATE nama_kelas = VALUES(nama_kelas);

-- Data Guru (password: admin123 -> bcrypt hash)
-- Hash di-generate dengan bcrypt rounds=10
INSERT INTO guru (username, password, nama, role, kelas_id) VALUES
  ('admin',  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh.g', 'Administrator', 'admin', NULL),
  ('budi',   '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh.g', 'Budi Santoso',  'guru',  1),
  ('siti',   '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh.g', 'Siti Rahayu',   'guru',  2),
  ('andi',   '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh.g', 'Andi Pratama',  'guru',  3)
ON DUPLICATE KEY UPDATE nama = VALUES(nama);

-- Data Siswa Kelas X IPA 1 (kelas_id=1)
INSERT INTO siswa (nis, nama, kelas_id, jenis_kelamin) VALUES
  ('2401001', 'Ahmad Fauzi',       1, 'L'),
  ('2401002', 'Bella Safitri',     1, 'P'),
  ('2401003', 'Candra Wijaya',     1, 'L'),
  ('2401004', 'Dewi Puspita',      1, 'P'),
  ('2401005', 'Eko Prasetyo',      1, 'L'),
  ('2401006', 'Fatimah Zahra',     1, 'P'),
  ('2401007', 'Galih Permana',     1, 'L'),
  ('2401008', 'Hana Kusuma',       1, 'P'),
  ('2401009', 'Ivan Hermawan',     1, 'L'),
  ('2401010', 'Jihan Aulia',       1, 'P')
ON DUPLICATE KEY UPDATE nama = VALUES(nama);

-- Data Siswa Kelas X IPA 2 (kelas_id=2)
INSERT INTO siswa (nis, nama, kelas_id, jenis_kelamin) VALUES
  ('2402001', 'Kevin Nanda',       2, 'L'),
  ('2402002', 'Laila Putri',       2, 'P'),
  ('2402003', 'Malik Saputra',     2, 'L'),
  ('2402004', 'Nina Octavia',      2, 'P'),
  ('2402005', 'Oscar Firmansyah',  2, 'L'),
  ('2402006', 'Putri Handayani',   2, 'P'),
  ('2402007', 'Qori Ananda',       2, 'L'),
  ('2402008', 'Rina Marlina',      2, 'P'),
  ('2402009', 'Sandi Kurniawan',   2, 'L'),
  ('2402010', 'Tika Rahmawati',    2, 'P')
ON DUPLICATE KEY UPDATE nama = VALUES(nama);

-- Data Siswa Kelas XI IPS 1 (kelas_id=3)
INSERT INTO siswa (nis, nama, kelas_id, jenis_kelamin) VALUES
  ('2301001', 'Umar Faruq',        3, 'L'),
  ('2301002', 'Vina Melani',       3, 'P'),
  ('2301003', 'Wahyu Setiawan',    3, 'L'),
  ('2301004', 'Xena Novita',       3, 'P'),
  ('2301005', 'Yusuf Aditya',      3, 'L'),
  ('2301006', 'Zahra Cantika',     3, 'P'),
  ('2301007', 'Arif Budiman',      3, 'L'),
  ('2301008', 'Bunga Lestari',     3, 'P')
ON DUPLICATE KEY UPDATE nama = VALUES(nama);

-- Contoh data absensi bulan Mei 2025
INSERT INTO absensi (siswa_id, kelas_id, tanggal, status, dicatat_oleh) VALUES
  (1, 1, '2025-05-01', 'hadir', 2),
  (2, 1, '2025-05-01', 'hadir', 2),
  (3, 1, '2025-05-01', 'sakit', 2),
  (4, 1, '2025-05-01', 'hadir', 2),
  (5, 1, '2025-05-01', 'izin',  2),
  (1, 1, '2025-05-02', 'hadir', 2),
  (2, 1, '2025-05-02', 'hadir', 2),
  (3, 1, '2025-05-02', 'hadir', 2),
  (4, 1, '2025-05-02', 'alpha', 2),
  (5, 1, '2025-05-02', 'hadir', 2)
ON DUPLICATE KEY UPDATE status = VALUES(status);
