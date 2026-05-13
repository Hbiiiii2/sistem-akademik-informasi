<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Sistem Akademik - MongoDB Version

Aplikasi Sistem Akademik dengan MongoDB sebagai database lokal dan Express sebagai backend server.

**Migrasi dari Firebase ke MongoDB lokal**

## 📋 Prerequisites

- **Node.js** v16+ 
- **MongoDB** (Community Edition)

## 🚀 Quick Start

### 1. Persiapan MongoDB

Pastikan MongoDB sudah terinstall dan running di komputer Anda.

```bash
# Verifikasi MongoDB running
mongosh
# Tekan Ctrl+C untuk exit
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Konfigurasi Environment

File `.env.local` sudah tersedia dengan default config:
```env
MONGODB_URI=mongodb://localhost:27017/sistem-akademik
PORT=5000
VITE_API_BASE_URL=http://localhost:5000/api
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Jalankan Aplikasi

**Option A: Frontend dan Backend terpisah**
```bash
# Terminal 1 - Backend
npm run dev:server

# Terminal 2 - Frontend  
npm run dev
```

**Option B: Jalankan keduanya (recommended)**
```bash
npm run dev:all
```

Aplikasi akan berjalan di:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Database: mongodb://localhost:27017/sistem-akademik

## 📚 Documentation

Untuk dokumentasi lengkap setup MongoDB dan API endpoints, lihat:
👉 **[SETUP_MONGODB.md](./SETUP_MONGODB.md)**

## 🔌 Available Routes

- `/` - Dashboard
- `/mahasiswa` - Mahasiswa Management
- `/dosen` - Dosen Management  
- `/matakuliah` - Mata Kuliah Management
- `/kelas` - Kelas Management
- `/jadwal` - Jadwal Management

## 🛠️ Available Scripts

```bash
npm run dev              # Frontend only
npm run dev:server       # Backend server only
npm run dev:all          # Frontend + Backend
npm run build            # Build for production
npm run preview          # Preview build
npm run lint             # TypeScript check
npm run clean            # Clean dist & build
```

## 📊 Project Structure

```
├── src/
│   ├── components/      # React components
│   ├── views/          # Page components
│   ├── lib/
│   │   ├── api.ts      # MongoDB API client
│   │   └── utils.ts    # Utilities
│   └── App.tsx
├── server.ts           # Express backend
├── .env.local          # Environment config
└── package.json
```

## 🔐 Backend Architecture

- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **API Style:** RESTful

## ✅ Testing

Verifikasi setup:
```bash
# Check API health
curl http://localhost:5000/api/health

# Check MongoDB
mongosh
use sistem-akademik
show collections
```

## 📖 API Documentation

Lihat [SETUP_MONGODB.md](./SETUP_MONGODB.md#-api-endpoints) untuk lengkap API endpoints.

## 🆘 Troubleshooting

Untuk solusi masalah common, lihat [SETUP_MONGODB.md](./SETUP_MONGODB.md#-troubleshooting).

---

**Original AI Studio App:** https://ai.studio/apps/9bb5edf5-d6c2-4676-8531-f348116eeb40

**Updated to MongoDB Local:** 2024
