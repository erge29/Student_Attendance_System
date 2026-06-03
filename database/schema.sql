-- ============================================
-- SCHEMA: Sistem Absensi Mahasiswa
-- ============================================

CREATE DATABASE IF NOT EXISTS db_absensi;
USE db_absensi;

-- Tabel Kelas / Mata Kuliah
CREATE TABLE IF NOT EXISTS kelas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kode_matkul VARCHAR(20) NOT NULL UNIQUE,
  nama_matkul VARCHAR(100) NOT NULL,
  sks INT DEFAULT 3,
  semester VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Dosen
CREATE TABLE IF NOT EXISTS dosen (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  nama VARCHAR(100) NOT NULL,
  nidn VARCHAR(20),
  role ENUM('admin', 'dosen') DEFAULT 'dosen',
  kelas_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE SET NULL
);

-- Tabel Mahasiswa
CREATE TABLE IF NOT EXISTS mahasiswa (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nim VARCHAR(20) NOT NULL UNIQUE,
  nama VARCHAR(100) NOT NULL,
  kelas_id INT NOT NULL,
  program_studi VARCHAR(100) NOT NULL,
  angkatan YEAR NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE CASCADE
);

-- Tabel Absensi
CREATE TABLE IF NOT EXISTS absensi (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mahasiswa_id INT NOT NULL,
  kelas_id INT NOT NULL,
  tanggal DATE NOT NULL,
  pertemuan_ke INT DEFAULT 1,
  status ENUM('hadir', 'sakit', 'izin', 'alpha') NOT NULL DEFAULT 'hadir',
  keterangan TEXT,
  dicatat_oleh INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_absensi (mahasiswa_id, kelas_id, tanggal),
  FOREIGN KEY (mahasiswa_id) REFERENCES mahasiswa(id) ON DELETE CASCADE,
  FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE CASCADE,
  FOREIGN KEY (dicatat_oleh) REFERENCES dosen(id) ON DELETE SET NULL
);
