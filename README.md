# 📋 Sistem Absensi Siswa
**Tugas Besar Komputasi Awan — Universitas Telkom**  
Dosen: Dr. Budhi Irawan, S.Si., M.T (B.I.R)

---

## 📖 Deskripsi Aplikasi

Sistem Informasi Absensi Siswa berbasis **Cloud Computing** menggunakan arsitektur terdistribusi 3 Virtual Machine. Sistem ini memungkinkan guru mencatat kehadiran siswa secara digital, melihat rekap bulanan, serta admin dapat mengelola data siswa, kelas, dan guru.

**Fitur Utama:**
- Login dengan autentikasi JWT (role: admin & guru)
- Input absensi harian per kelas (hadir / sakit / izin / alpha)
- Rekap kehadiran bulanan dengan persentase kehadiran
- Manajemen data siswa, kelas, dan guru (admin only)
- Dashboard statistik kehadiran dengan grafik

---

## 🏗️ Arsitektur Sistem (3 Virtual Machine)

```
┌─────────────────────────────────────────────────────────┐
│                    Private Network                       │
│               192.168.56.0/24 (VirtualBox)              │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  VM-Database │  │  VM-Backend  │  │  VM-Frontend │  │
│  │192.168.56.11 │  │192.168.56.10 │  │192.168.56.12 │  │
│  │              │  │              │  │              │  │
│  │   MySQL 8.0  │◄─│  Node.js 18  │◄─│  Nginx       │  │
│  │  Port: 3306  │  │  Port: 3000  │  │  Port: 80    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
         ▲                    ▲                  ▲
    localhost:              localhost:         localhost:
      (internal)             3000               8012
                         (REST API)           (Web App)
```

---

## 🖥️ Fungsi Masing-Masing VM

| VM | IP | Software | Fungsi |
|---|---|---|---|
| **VM-Database** | 192.168.56.11 | MySQL 8.0 | Menyimpan seluruh data (siswa, guru, kelas, absensi) |
| **VM-Backend**  | 192.168.56.10 | Node.js 18 + Express | REST API, autentikasi JWT, logika bisnis |
| **VM-Frontend** | 192.168.56.12 | Nginx | Menyajikan halaman web (HTML/CSS/JS) |

---

## ⚙️ Teknologi yang Digunakan

| Komponen | Teknologi |
|---|---|
| Virtualisasi | VirtualBox + Vagrant |
| Provisioning | Ansible |
| OS VM | Ubuntu 22.04 LTS |
| Database | MySQL 8.0 |
| Backend | Node.js 18, Express, JWT, bcrypt, mysql2 |
| Frontend | HTML5, CSS3, Vanilla JavaScript, Chart.js, Nginx |

---

## 📁 Struktur Folder Proyek

```
sistem-absensi-siswa/
├── Vagrantfile              # Konfigurasi 3 VM (VirtualBox)
├── playbook.yml             # Ansible provisioning otomatis
├── README.md                # Dokumentasi ini
│
├── database/
│   ├── schema.sql           # Struktur tabel database
│   └── seed.sql             # Data awal (kelas, guru, siswa, absensi)
│
├── backend/
│   ├── server.js            # Entry point REST API (Express)
│   └── package.json         # Dependensi Node.js
│
└── frontend/
    └── index.html           # Single Page Application
```

---

## 🚀 Cara Instalasi dan Menjalankan

### Prasyarat
- [VirtualBox](https://www.virtualbox.org/) ≥ 6.1
- [Vagrant](https://www.vagrantup.com/) ≥ 2.3
- RAM minimal: **4 GB** (masing-masing VM menggunakan 1 GB)

### Langkah Instalasi

**1. Clone repositori**
```bash
git clone https://github.com/<username>/sistem-absensi-siswa.git
cd sistem-absensi-siswa
```

**2. Jalankan semua VM sekaligus**
```bash
vagrant up
```
> Proses pertama kali ±10-20 menit (download box + install dependency)

**3. Akses Aplikasi**

| Layanan | URL |
|---|---|
| 🌐 Web App (Frontend) | http://localhost:8012 |
| 🔌 REST API (Backend) | http://localhost:3000/api/health |

---

### Menjalankan Per VM (opsional)

```bash
# Hanya database
vagrant up database

# Hanya backend
vagrant up backend

# Hanya frontend
vagrant up frontend
```

### Perintah Vagrant Berguna

```bash
vagrant status          # Cek status VM
vagrant ssh database    # Masuk ke VM Database
vagrant ssh backend     # Masuk ke VM Backend
vagrant ssh frontend    # Masuk ke VM Frontend
vagrant halt            # Matikan semua VM
vagrant destroy -f      # Hapus semua VM
vagrant reload          # Restart semua VM
```

---

## 🔑 Akun Default (untuk Login)

| Username | Password | Role |
|---|---|---|
| `admin` | `admin123` | Admin (akses penuh) |
| `budi`  | `admin123` | Guru |
| `siti`  | `admin123` | Guru |
| `andi`  | `admin123` | Guru |

---

## 🌐 REST API Endpoints

### Auth
| Method | Endpoint | Deskripsi |
|---|---|---|
| POST | `/api/auth/login` | Login |
| GET  | `/api/auth/me`    | Info user aktif |

### Absensi
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET  | `/api/absensi?kelas_id=&tanggal=` | Data absensi per kelas & tanggal |
| POST | `/api/absensi` | Simpan/update absensi |
| GET  | `/api/absensi/rekap?kelas_id=&bulan=` | Rekap bulanan |
| GET  | `/api/absensi/siswa/:id?bulan=` | Riwayat per siswa |

### Data Master (Admin)
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET/POST | `/api/siswa` | Daftar / tambah siswa |
| GET/PUT/DELETE | `/api/siswa/:id` | Detail / edit / hapus siswa |
| GET/POST/DELETE | `/api/kelas` | Manajemen kelas |
| GET/POST/DELETE | `/api/guru` | Manajemen guru |
| GET | `/api/dashboard` | Statistik ringkasan |
| GET | `/api/health` | Health check |

---

## 🔧 Konfigurasi Jaringan VM

```
VM Database  → 192.168.56.11:3306  (MySQL, dapat diakses dari VM Backend)
VM Backend   → 192.168.56.10:3000  (API, di-forward ke localhost:3000)
VM Frontend  → 192.168.56.12:80    (Nginx, di-forward ke localhost:8012)
```

---

## 👥 Anggota Kelompok

| No | Nama | NIM | Bagian |
|---|---|---|---|
| 1 | [Nama Anggota 1] | [NIM] | VM Database |
| 2 | [Nama Anggota 2] | [NIM] | VM Backend  |
| 3 | [Nama Anggota 3] | [NIM] | VM Frontend |

---

## 📜 Lisensi
MIT License — Tugas Besar Komputasi Awan, Universitas Telkom 2024/2025
