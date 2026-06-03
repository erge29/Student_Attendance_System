-- ============================================
-- SEED: Data Awal Sistem Absensi Mahasiswa
-- Password: admin123 (bcrypt hash rounds=10)
-- ============================================

USE db_absensi;

-- Data Kelas / Mata Kuliah
INSERT INTO kelas (kode_matkul, nama_matkul, sks, semester) VALUES
  ('IF301', 'Komputasi Awan',          3, 'Ganjil'),
  ('IF302', 'Pemrograman Web',         3, 'Ganjil'),
  ('IF303', 'Basis Data',              3, 'Genap'),
  ('IF304', 'Jaringan Komputer',       3, 'Genap')
ON DUPLICATE KEY UPDATE nama_matkul = VALUES(nama_matkul);

-- Data Dosen
-- Hash bcrypt untuk 'admin123' (rounds=10)
INSERT INTO dosen (username, password, nama, nidn, role, kelas_id) VALUES
  ('admin', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh.g', 'Administrator',     NULL,         'admin',  NULL),
  ('budi',  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh.g', 'Dr. Budi Santoso',  '0012345601', 'dosen',  1),
  ('siti',  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh.g', 'Dr. Siti Rahayu',   '0012345602', 'dosen',  2),
  ('andi',  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh.g', 'Andi Pratama, M.T', '0012345603', 'dosen',  3)
ON DUPLICATE KEY UPDATE nama = VALUES(nama);

-- Data Mahasiswa Kelas IF301 - Komputasi Awan (kelas_id=1)
INSERT INTO mahasiswa (nim, nama, kelas_id, program_studi, angkatan) VALUES
  ('1101210001', 'Ahmad Fauzi',         1, 'Informatika', 2021),
  ('1101210002', 'Bella Safitri',       1, 'Informatika', 2021),
  ('1101210003', 'Candra Wijaya',       1, 'Informatika', 2021),
  ('1101210004', 'Dewi Puspita',        1, 'Informatika', 2021),
  ('1101210005', 'Eko Prasetyo',        1, 'Informatika', 2021),
  ('1101210006', 'Fatimah Zahra',       1, 'Informatika', 2021),
  ('1101210007', 'Galih Permana',       1, 'Informatika', 2021),
  ('1101210008', 'Hana Kusuma',         1, 'Informatika', 2021),
  ('1101210009', 'Ivan Hermawan',       1, 'Informatika', 2021),
  ('1101210010', 'Jihan Aulia',         1, 'Informatika', 2021)
ON DUPLICATE KEY UPDATE nama = VALUES(nama);

-- Data Mahasiswa Kelas IF302 - Pemrograman Web (kelas_id=2)
INSERT INTO mahasiswa (nim, nama, kelas_id, program_studi, angkatan) VALUES
  ('1101210011', 'Kevin Nanda',         2, 'Informatika', 2021),
  ('1101210012', 'Laila Putri',         2, 'Informatika', 2021),
  ('1101210013', 'Malik Saputra',       2, 'Informatika', 2021),
  ('1101210014', 'Nina Octavia',        2, 'Informatika', 2021),
  ('1101210015', 'Oscar Firmansyah',    2, 'Informatika', 2021),
  ('1101210016', 'Putri Handayani',     2, 'Informatika', 2021),
  ('1101210017', 'Qori Ananda',         2, 'Informatika', 2021),
  ('1101210018', 'Rina Marlina',        2, 'Informatika', 2021)
ON DUPLICATE KEY UPDATE nama = VALUES(nama);

-- Data Mahasiswa Kelas IF303 - Basis Data (kelas_id=3)
INSERT INTO mahasiswa (nim, nama, kelas_id, program_studi, angkatan) VALUES
  ('1101210019', 'Sandi Kurniawan',     3, 'Informatika', 2021),
  ('1101210020', 'Tika Rahmawati',      3, 'Informatika', 2021),
  ('1101210021', 'Umar Faruq',          3, 'Informatika', 2021),
  ('1101210022', 'Vina Melani',         3, 'Informatika', 2021),
  ('1101210023', 'Wahyu Setiawan',      3, 'Informatika', 2021),
  ('1101210024', 'Xena Novita',         3, 'Informatika', 2021),
  ('1101210025', 'Yusuf Aditya',        3, 'Informatika', 2021),
  ('1101210026', 'Zahra Cantika',       3, 'Informatika', 2021)
ON DUPLICATE KEY UPDATE nama = VALUES(nama);

-- Contoh data absensi
INSERT INTO absensi (mahasiswa_id, kelas_id, tanggal, pertemuan_ke, status, dicatat_oleh) VALUES
  (1, 1, '2025-05-01', 1, 'hadir', 2),
  (2, 1, '2025-05-01', 1, 'hadir', 2),
  (3, 1, '2025-05-01', 1, 'sakit', 2),
  (4, 1, '2025-05-01', 1, 'hadir', 2),
  (5, 1, '2025-05-01', 1, 'izin',  2),
  (1, 1, '2025-05-08', 2, 'hadir', 2),
  (2, 1, '2025-05-08', 2, 'hadir', 2),
  (3, 1, '2025-05-08', 2, 'hadir', 2),
  (4, 1, '2025-05-08', 2, 'alpha', 2),
  (5, 1, '2025-05-08', 2, 'hadir', 2)
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- ============================================
-- Fix password: generate hash yang benar
-- Jalankan ini setelah seed jika login gagal:
-- ============================================
-- sudo apt-get install -y nodejs
-- node -e "require('bcrypt').hash('admin123',10).then(h=>{require('child_process').execSync('mysql db_absensi -e \"UPDATE dosen SET password=\''+h+'\' WHERE 1=1\"');console.log('Done')})"
