# Sistem Akademik - Local MongoDB Setup Guide

Project sistem akademik yang telah dimigrasi dari Firebase ke MongoDB lokal dengan Express backend.

## 📋 Prerequisites

Sebelum memulai, pastikan Anda sudah menginstall:

- **Node.js** (v16+) - [Download](https://nodejs.org/)
- **MongoDB** (Community Edition) - [Download](https://www.mongodb.com/try/download/community)
- **Git** (optional)

## 🚀 Setup Instructions

### 1. Install MongoDB Lokal

#### Windows:
1. Download MongoDB Community Edition dari https://www.mongodb.com/try/download/community
2. Jalankan installer (.msi)
3. Pilih "Install MongoDB as a Service" (recommended)
4. Selesaikan instalasi

**Verifikasi MongoDB sudah running:**
```bash
# Buka Command Prompt/PowerShell
mongosh
```

Jika muncul MongoDB shell, berarti MongoDB sudah running dengan baik.

#### macOS (menggunakan Homebrew):
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

#### Linux (Ubuntu/Debian):
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

### 2. Setup Project

```bash
# 1. Masuk ke direktori project
cd c:\laragon\www\big-Data\sistem-akademik-akademik

# 2. Install dependencies
npm install

# 3. Copy file .env.local dan sesuaikan jika perlu
# File .env.local sudah tersedia dengan konfigurasi default
```

### 3. Konfigurasi Environment

Buka file `.env.local` dan pastikan konfigurasi sudah sesuai:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/sistem-akademik

# Server Configuration  
PORT=5000

# API Base URL (untuk frontend)
VITE_API_BASE_URL=http://localhost:5000/api

# Gemini API Key (jika diperlukan)
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Jalankan Project

#### **Option A: Jalankan Frontend dan Backend secara terpisah**

**Terminal 1 - Jalankan Backend Server:**
```bash
npm run dev:server
```
Output: `🚀 Server running on http://localhost:5000`

**Terminal 2 - Jalankan Frontend:**
```bash
npm run dev
```
Output: Server berjalan di `http://localhost:3000`

#### **Option B: Jalankan keduanya sekaligus (recommended)**
```bash
npm run dev:all
```
Akan membuka 2 proses: Backend (5000) dan Frontend (3000)

## 📊 MongoDB Database Structure

Aplikasi akan secara otomatis membuat collections berikut:

### Collections:

#### **mahasiswa**
```json
{
  "_id": ObjectId,
  "nama": "string",
  "nim": "string (unique)",
  "jurusan": "string",
  "semester": "number",
  "email": "string",
  "nomor_hp": "string",
  "status": "Aktif|Cuti|Lulus|Keluar",
  "createdAt": "date",
  "updatedAt": "date"
}
```

#### **dosen**
```json
{
  "_id": ObjectId,
  "nama": "string",
  "nip": "string (unique)",
  "email": "string",
  "nomor_hp": "string",
  "bidang": "string",
  "status": "Aktif|Cuti|Pensiun",
  "createdAt": "date",
  "updatedAt": "date"
}
```

#### **matakuliah**
```json
{
  "_id": ObjectId,
  "kode": "string (unique)",
  "nama": "string",
  "sks": "number",
  "semester": "number",
  "dosen_id": "ObjectId (ref: dosen)",
  "createdAt": "date",
  "updatedAt": "date"
}
```

#### **kelas**
```json
{
  "_id": ObjectId,
  "nama": "string",
  "matakuliah_id": "ObjectId (ref: matakuliah)",
  "dosen_id": "ObjectId (ref: dosen)",
  "kapasitas": "number",
  "ruangan": "string",
  "semester": "number",
  "createdAt": "date",
  "updatedAt": "date"
}
```

#### **jadwal**
```json
{
  "_id": ObjectId,
  "kelas_id": "ObjectId (ref: kelas)",
  "hari": "string",
  "jam_mulai": "string (HH:mm)",
  "jam_selesai": "string (HH:mm)",
  "ruangan": "string",
  "createdAt": "date",
  "updatedAt": "date"
}
```

## 🔌 API Endpoints

Semua endpoint menggunakan base URL: `http://localhost:5000/api`

### Mahasiswa
- `GET /api/mahasiswa` - Dapatkan semua mahasiswa
- `POST /api/mahasiswa` - Tambah mahasiswa baru
- `GET /api/mahasiswa/:id` - Dapatkan detail mahasiswa
- `PUT /api/mahasiswa/:id` - Update mahasiswa
- `DELETE /api/mahasiswa/:id` - Hapus mahasiswa

### Dosen
- `GET /api/dosen` - Dapatkan semua dosen
- `POST /api/dosen` - Tambah dosen baru
- `GET /api/dosen/:id` - Dapatkan detail dosen
- `PUT /api/dosen/:id` - Update dosen
- `DELETE /api/dosen/:id` - Hapus dosen

### Matakuliah
- `GET /api/matakuliah` - Dapatkan semua mata kuliah
- `POST /api/matakuliah` - Tambah mata kuliah baru
- `GET /api/matakuliah/:id` - Dapatkan detail mata kuliah
- `PUT /api/matakuliah/:id` - Update mata kuliah
- `DELETE /api/matakuliah/:id` - Hapus mata kuliah

### Kelas
- `GET /api/kelas` - Dapatkan semua kelas
- `POST /api/kelas` - Tambah kelas baru
- `GET /api/kelas/:id` - Dapatkan detail kelas
- `PUT /api/kelas/:id` - Update kelas
- `DELETE /api/kelas/:id` - Hapus kelas

### Jadwal
- `GET /api/jadwal` - Dapatkan semua jadwal
- `POST /api/jadwal` - Tambah jadwal baru
- `GET /api/jadwal/:id` - Dapatkan detail jadwal
- `PUT /api/jadwal/:id` - Update jadwal
- `DELETE /api/jadwal/:id` - Hapus jadwal

### Health Check
- `GET /api/health` - Verifikasi server status

## 🛠️ Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solusi:**
- Pastikan MongoDB service sudah running
- Windows: Cek di Services > MongoDB Server
- macOS/Linux: `brew services list` atau `sudo systemctl status mongod`

### Port 5000 sudah digunakan
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solusi:**
- Gunakan port lain dengan mengubah `.env.local`: `PORT=5001`
- Atau terminate proses yang menggunakan port 5000

### Node modules missing
```bash
rm -rf node_modules package-lock.json
npm install
```

### Clear MongoDB Database
```bash
mongosh
use sistem-akademik
db.dropDatabase()
exit
```

## 📁 Project Structure

```
sistem-akademik-akademik/
├── src/
│   ├── components/       # React components
│   ├── views/           # Page views (Dashboard, Mahasiswa, etc)
│   ├── lib/
│   │   ├── api.ts       # API client untuk MongoDB backend
│   │   └── utils.ts     # Utility functions
│   ├── App.tsx
│   └── main.tsx
├── server.ts            # Express backend server
├── .env.local           # Environment variables
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
└── package.json         # Project dependencies
```

## 📦 npm Scripts

```bash
npm run dev              # Jalankan frontend only
npm run dev:server       # Jalankan backend server only
npm run dev:all          # Jalankan frontend + backend
npm run build            # Build untuk production
npm run preview          # Preview build
npm run lint             # TypeScript lint check
npm run clean            # Clear dist dan server.js
```

## ✅ Verifikasi Setup

1. **Buka browser:** `http://localhost:3000`
2. **Test API:**
   ```bash
   curl http://localhost:5000/api/health
   # Response: {"status":"OK","timestamp":"2024-01-01T00:00:00.000Z"}
   ```
3. **MongoDB Connection:**
   ```bash
   mongosh
   use sistem-akademik
   show collections
   ```

## 🔐 Important Notes

- Jangan share file `.env.local` yang berisi credentials
- MongoDB lokal hanya untuk development, gunakan MongoDB Atlas atau hosted solution untuk production
- Pastikan MongoDB sudah running sebelum menjalankan backend server
- Default port: Frontend (3000), Backend (5000), MongoDB (27017)

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)

## 🆘 Need Help?

Jika mengalami masalah:
1. Cek log di terminal untuk error messages
2. Verifikasi MongoDB running: `mongosh`
3. Clear node_modules dan install ulang
4. Restart aplikasi dan MongoDB service

---

**Happy Coding! 🎉**
