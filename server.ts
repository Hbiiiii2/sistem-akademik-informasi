/**
 * Express Backend Server untuk Sistem Akademik
 * MongoDB Integration
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import axios from 'axios';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sistem-akademik';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    status: err.status || 500
  });
});

// MongoDB Connection
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Models
const mahasiswaSchema = new mongoose.Schema({
  nama: { type: String, required: true },
  nim: { type: String, required: true, unique: true },
  jurusan: { type: String, required: true },
  semester: { type: Number, required: true },
  email: { type: String, required: true },
  nomor_hp: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Aktif', 'Cuti', 'Lulus', 'Keluar'],
    default: 'Aktif'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const dosenSchema = new mongoose.Schema({
  nama: { type: String, required: true },
  nip: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  nomor_hp: { type: String, required: true },
  bidang: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Aktif', 'Cuti', 'Pensiun'],
    default: 'Aktif'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const matakuliahSchema = new mongoose.Schema({
  kode: { type: String, required: true, unique: true },
  nama: { type: String, required: true },
  sks: { type: Number, required: true },
  semester: { type: Number, required: true },
  dosen_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Dosen' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const kelasSchema = new mongoose.Schema({
  nama: { type: String, required: true },
  matakuliah_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Matakuliah', required: true },
  dosen_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Dosen', required: true },
  kapasitas: { type: Number, required: true },
  ruangan: { type: String, required: true },
  semester: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const jadwalSchema = new mongoose.Schema({
  kelas_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Kelas', required: true },
  hari: { type: String, required: true },
  jam_mulai: { type: String, required: true },
  jam_selesai: { type: String, required: true },
  ruangan: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Mahasiswa = mongoose.model('Mahasiswa', mahasiswaSchema);
const Dosen = mongoose.model('Dosen', dosenSchema);
const Matakuliah = mongoose.model('Matakuliah', matakuliahSchema);
const Kelas = mongoose.model('Kelas', kelasSchema);
const Jadwal = mongoose.model('Jadwal', jadwalSchema);

// User/Auth Schema for OAuth
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  googleId: { type: String, unique: true, sparse: true },
  picture: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// JWT Utilities
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production';

const generateToken = (userId: string, userEmail: string, userName: string) => {
  return jwt.sign(
    { id: userId, email: userEmail, name: userName },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

const verifyTokenMiddleware = (req: Request & { user?: any }, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Routes - Mahasiswa
app.get('/api/mahasiswa', async (req: Request, res: Response) => {
  try {
    const mahasiswa = await Mahasiswa.find().sort({ createdAt: -1 });
    res.json(mahasiswa);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch mahasiswa' });
  }
});

app.post('/api/mahasiswa', async (req: Request, res: Response) => {
  try {
    const mahasiswa = new Mahasiswa(req.body);
    await mahasiswa.save();
    res.status(201).json(mahasiswa);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/mahasiswa/:id', async (req: Request, res: Response) => {
  try {
    const mahasiswa = await Mahasiswa.findById(req.params.id);
    if (!mahasiswa) return res.status(404).json({ error: 'Not found' });
    res.json(mahasiswa);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch mahasiswa' });
  }
});

app.put('/api/mahasiswa/:id', async (req: Request, res: Response) => {
  try {
    const mahasiswa = await Mahasiswa.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!mahasiswa) return res.status(404).json({ error: 'Not found' });
    res.json(mahasiswa);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/mahasiswa/:id', async (req: Request, res: Response) => {
  try {
    const mahasiswa = await Mahasiswa.findByIdAndDelete(req.params.id);
    if (!mahasiswa) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete mahasiswa' });
  }
});

// Routes - Dosen
app.get('/api/dosen', async (req: Request, res: Response) => {
  try {
    const dosen = await Dosen.find().sort({ nama: 1 });
    res.json(dosen);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dosen' });
  }
});

app.post('/api/dosen', async (req: Request, res: Response) => {
  try {
    const dosen = new Dosen(req.body);
    await dosen.save();
    res.status(201).json(dosen);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/dosen/:id', async (req: Request, res: Response) => {
  try {
    const dosen = await Dosen.findById(req.params.id);
    if (!dosen) return res.status(404).json({ error: 'Not found' });
    res.json(dosen);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dosen' });
  }
});

app.put('/api/dosen/:id', async (req: Request, res: Response) => {
  try {
    const dosen = await Dosen.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!dosen) return res.status(404).json({ error: 'Not found' });
    res.json(dosen);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/dosen/:id', async (req: Request, res: Response) => {
  try {
    const dosen = await Dosen.findByIdAndDelete(req.params.id);
    if (!dosen) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete dosen' });
  }
});

// Routes - Matakuliah
app.get('/api/matakuliah', async (req: Request, res: Response) => {
  try {
    const matakuliah = await Matakuliah.find().populate('dosen_id').sort({ nama: 1 });
    res.json(matakuliah);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch matakuliah' });
  }
});

app.post('/api/matakuliah', async (req: Request, res: Response) => {
  try {
    const matakuliah = new Matakuliah(req.body);
    await matakuliah.save();
    await matakuliah.populate('dosen_id');
    res.status(201).json(matakuliah);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/matakuliah/:id', async (req: Request, res: Response) => {
  try {
    const matakuliah = await Matakuliah.findById(req.params.id).populate('dosen_id');
    if (!matakuliah) return res.status(404).json({ error: 'Not found' });
    res.json(matakuliah);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch matakuliah' });
  }
});

app.put('/api/matakuliah/:id', async (req: Request, res: Response) => {
  try {
    const matakuliah = await Matakuliah.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    ).populate('dosen_id');
    if (!matakuliah) return res.status(404).json({ error: 'Not found' });
    res.json(matakuliah);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/matakuliah/:id', async (req: Request, res: Response) => {
  try {
    const matakuliah = await Matakuliah.findByIdAndDelete(req.params.id);
    if (!matakuliah) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete matakuliah' });
  }
});

// Routes - Kelas
app.get('/api/kelas', async (req: Request, res: Response) => {
  try {
    const kelas = await Kelas.find().populate(['matakuliah_id', 'dosen_id']).sort({ nama: 1 });
    res.json(kelas);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch kelas' });
  }
});

app.post('/api/kelas', async (req: Request, res: Response) => {
  try {
    const kelas = new Kelas(req.body);
    await kelas.save();
    await kelas.populate(['matakuliah_id', 'dosen_id']);
    res.status(201).json(kelas);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/kelas/:id', async (req: Request, res: Response) => {
  try {
    const kelas = await Kelas.findById(req.params.id).populate(['matakuliah_id', 'dosen_id']);
    if (!kelas) return res.status(404).json({ error: 'Not found' });
    res.json(kelas);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch kelas' });
  }
});

app.put('/api/kelas/:id', async (req: Request, res: Response) => {
  try {
    const kelas = await Kelas.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    ).populate(['matakuliah_id', 'dosen_id']);
    if (!kelas) return res.status(404).json({ error: 'Not found' });
    res.json(kelas);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/kelas/:id', async (req: Request, res: Response) => {
  try {
    const kelas = await Kelas.findByIdAndDelete(req.params.id);
    if (!kelas) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete kelas' });
  }
});

// Routes - Jadwal
app.get('/api/jadwal', async (req: Request, res: Response) => {
  try {
    const jadwal = await Jadwal.find().populate('kelas_id').sort({ hari: 1, jam_mulai: 1 });
    res.json(jadwal);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch jadwal' });
  }
});

app.post('/api/jadwal', async (req: Request, res: Response) => {
  try {
    const jadwal = new Jadwal(req.body);
    await jadwal.save();
    await jadwal.populate('kelas_id');
    res.status(201).json(jadwal);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/jadwal/:id', async (req: Request, res: Response) => {
  try {
    const jadwal = await Jadwal.findById(req.params.id).populate('kelas_id');
    if (!jadwal) return res.status(404).json({ error: 'Not found' });
    res.json(jadwal);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch jadwal' });
  }
});

app.put('/api/jadwal/:id', async (req: Request, res: Response) => {
  try {
    const jadwal = await Jadwal.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    ).populate('kelas_id');
    if (!jadwal) return res.status(404).json({ error: 'Not found' });
    res.json(jadwal);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/jadwal/:id', async (req: Request, res: Response) => {
  try {
    const jadwal = await Jadwal.findByIdAndDelete(req.params.id);
    if (!jadwal) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete jadwal' });
  }
});

// ==================== Auth Routes ====================

// OAuth callback - exchange code for token
app.post('/api/auth/google/callback', async (req: Request, res: Response) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code required' });
    }

    // Exchange code for token with Google
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: process.env.VITE_GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: `${process.env.OAUTH_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback'}`,
    });

    const { access_token } = tokenResponse.data;

    // Get user info from Google
    const userInfoResponse = await axios.get(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    const { id: googleId, email, name, picture } = userInfoResponse.data;

    // Find or create user
    let user = await User.findOne({ googleId });

    if (!user) {
      user = await User.create({
        googleId,
        email,
        name,
        picture,
      });
    } else {
      // Update user info
      user.name = name;
      user.picture = picture;
      await user.save();
    }

    // Generate JWT token
    const jwtToken = generateToken(user._id.toString(), user.email, user.name);

    res.json({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      picture: user.picture,
      token: jwtToken,
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Verify token
app.get('/api/auth/verify', verifyTokenMiddleware as any, async (req: Request & { user?: any }, res: Response) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const jwtToken = generateToken(user._id.toString(), user.email, user.name);

    res.json({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      picture: user.picture,
      token: jwtToken,
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Development/local login (quick test) - accepts username/password and returns JWT
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // Simple local check (ONLY FOR DEVELOPMENT)
    if (username === 'admin' && password === 'admin') {
      // find or create dev user
      let user = await User.findOne({ email: 'admin@local' });
      if (!user) {
        user = await User.create({
          email: 'admin@local',
          name: 'Admin (Local)',
          googleId: null,
          picture: null,
        });
      }

      const jwtToken = generateToken(user._id.toString(), user.email, user.name);

      return res.json({
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        picture: user.picture,
        token: jwtToken,
      });
    }

    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (error) {
    console.error('Dev login error:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
});

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
