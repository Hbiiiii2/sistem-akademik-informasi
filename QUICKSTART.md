# ⚡ Quick Start Guide

## 🚀 Jalankan Dalam 3 Langkah

### Step 1: Pastikan MongoDB Running
```bash
mongosh
# Jika bisa masuk, close dengan Ctrl+C
```

### Step 2: Install & Configure
```bash
npm install
# .env.local sudah ready, tidak perlu konfigurasi tambahan
```

### Step 3: Start Project
```bash
# RECOMMENDED - Run both at once
npm run dev:all

# OR - Run separately
# Terminal 1:
npm run dev:server

# Terminal 2:
npm run dev
```

## ✅ Done!
Buka: **http://localhost:3000**

---

## 📋 Troubleshooting

### MongoDB tidak bisa diakses?
```
Error: connect ECONNREFUSED
```
**Solusi**: 
- Windows: Cek Services > MongoDB Server
- macOS/Linux: `brew services start mongodb-community`

### Port 5000 sudah terpakai?
Edit `.env.local`: `PORT=5001`

### Dependency issues?
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 🔗 Links
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- API Health: http://localhost:5000/api/health
- MongoDB: mongodb://localhost:27017/sistem-akademik

---

**Full documentation**: Baca `SETUP_MONGODB.md`
