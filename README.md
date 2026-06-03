Deskripsi Aplikasi Absensi Mahasiswa

Sistem Informasi Absensi Mahasiswa berbasis Cloud Computing menggunakan arsitektur 3 Virtual Machine. Sistem ini memungkinkan dosen mencatat kehadiran mahasiswa secara digital, melihat rekap per semester, serta admin dapat mengelola data mahasiswa, kelas, dan dosen.

Fitur Utama:
- Login dengan autentikasi JWT (role: admin & dosen)
- Input absensi harian per kelas (hadir / sakit / izin / alpha)
- Rekap kehadiran bulanan dengan persentase kehadiran
- Manajemen data mahasiswa, kelas, dan dosen (admin only)
- Dashboard statistik kehadiran dengan grafik

Arsitektur Sistem (3 Virtual Machine)

Private Network
192.168.56.0/24 (VirtualBox)

VM-Database
192.168.56.11
MySQL 8.0
Port: 3306

VM-Backend
192.168.56.10
Node.js 18
Port: 3000

VM-Frontend
192.168.56.12
Nginx
Port: 80

localhost: (internal)
localhost: 3000 (REST API)
localhost: 8012 (Web App)

Fungsi Masing-Masing VM

VM: VM-Database
IP: 192.168.56.11
Software: MySQL 8.0
Fungsi: Menyimpan seluruh data (mahasiswa, dosen, kelas, absensi)

VM: VM-Backend
IP: 192.168.56.10
Software: Node.js 18 + Express
Fungsi: REST API, autentikasi JWT, logika bisnis

VM: VM-Frontend
IP: 192.168.56.12
Software: Nginx
Fungsi: Menyajikan halaman web (HTML/CSS/JS)

Teknologi yang Digunakan

Virtualisasi: VirtualBox + Vagrant
Provisioning: Ansible
OS VM: Ubuntu 22.04 LTS
Database: MySQL 8.0
Backend: Node.js 18, Express, JWT, bcrypt, mysql2
Frontend: HTML5, CSS3, Vanilla JavaScript, Chart.js, Nginx

Struktur Folder Proyek

sistem-absensi-mahasiswa/
    Vagrantfile (Konfigurasi 3 VM (VirtualBox))
    playbook.yml (Ansible provisioning otomatis)
    README.md (Dokumentasi ini)
    database/
        schema.sql (Struktur tabel database)
        seed.sql (Data awal (kelas, dosen, mahasiswa, absensi))
    backend/
        server.js (Entry point REST API (Express))
        package.json (Dependensi Node.js)
    frontend/
        index.html (Single Page Application)

Cara Instalasi dan Menjalankan

Prasyarat
- VirtualBox lebih dari atau sama dengan 6.1
- Vagrant lebih dari atau sama dengan 2.3
- RAM minimal: 4 GB (masing-masing VM menggunakan 1 GB)

Langkah Instalasi

1. Clone repositori
git clone https://github.com/erge29/Student_Attendance_System.git
cd Student_Attendance_System
2. Jalankan VM
vagrant up

3. Akses Aplikasi

Web App (Frontend): http://localhost:8012
REST API (Backend): http://localhost:3000/api/health

Akun Default (untuk Login)

Username: admin, Password: admin123, Role: Admin (akses penuh)
Username: budi, Password: admin123, Role: Dosen
Username: siti, Password: admin123, Role: Dosen
Username: andi, Password: admin123, Role: Dosen

REST API Endpoints

Auth
POST /api/auth/login -> Login
GET /api/auth/me -> Info user aktif

Absensi
GET /api/absensi?kelas_id=&tanggal= -> Data absensi per kelas & tanggal
POST /api/absensi -> Simpan/update absensi
GET /api/absensi/rekap?kelas_id=&bulan= -> Rekap bulanan
GET /api/absensi/mahasiswa/:id?bulan= -> Riwayat per mahasiswa

Data Master (Admin)
GET/POST /api/mahasiswa -> Daftar / tambah mahasiswa
GET/PUT/DELETE /api/mahasiswa/:id -> Detail / edit / hapus mahasiswa
GET/POST/DELETE /api/kelas -> Manajemen kelas/matkul
GET/POST/DELETE /api/dosen -> Manajemen dosen
GET /api/dashboard -> Statistik ringkasan
GET /api/health -> Health check

Anggota Kelompok

1. Muhammad Rizki Bana Al Husein, 101032400089, Bagian: VM Database
2. Yoseph Riyanto Gonsalis Wain, 101032400043, Bagian: VM Backend
3. Ilham Kholid, 101032430033, Bagian: VM Frontend
