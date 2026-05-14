/**
 * Express Backend Server untuk Sistem Akademik
 * MongoDB storage via Mongoose
 */

import express, { Express, NextFunction, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import mongoose, { Schema } from 'mongoose';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;
const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sistem-akademik';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production';

const nowIso = () => new Date().toISOString();

const collectionSchema = new Schema({}, {
  strict: false,
  timestamps: true,
  versionKey: false,
});

const getCollectionModel = (modelName: string, collectionName: string) => {
  if (mongoose.models[modelName]) {
    return mongoose.model<any>(modelName);
  }

  return mongoose.model<any>(modelName, collectionSchema, collectionName);
};

const Mahasiswa = getCollectionModel('Mahasiswa', 'mahasiswa');
const Dosen = getCollectionModel('Dosen', 'dosen');
const Matakuliah = getCollectionModel('Matakuliah', 'matakuliah');
const Kelas = getCollectionModel('Kelas', 'kelas');
const Jadwal = getCollectionModel('Jadwal', 'jadwal');
const User = getCollectionModel('User', 'users');

const connectMongo = async () => {
  if (mongoose.connection.readyState === 1) return;

  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  });
};

const toPlain = (item: any) => {
  if (!item) return item;
  if (typeof item.toObject === 'function') {
    const plain = item.toObject();
    const { _id, ...rest } = plain;
    return { id: _id?.toString?.() ?? String(_id), ...rest };
  }
  const { _id, ...rest } = item;
  return { id: item.id ?? _id, ...rest };
};

const isValidObjectId = (id: string) => mongoose.Types.ObjectId.isValid(id);

const sendNotFound = (res: Response) => res.status(404).json({ error: 'Not found' });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    status: err.status || 500,
  });
});

const generateToken = (userId: string, userEmail: string, userName: string) => {
  return jwt.sign({ id: userId, email: userEmail, name: userName }, JWT_SECRET, { expiresIn: '24h' });
};

const verifyTokenMiddleware = (req: Request & { user?: any }, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Auth
app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (username === 'admin' && password === 'admin') {
    let user = await User.findOne({ email: 'admin@local' });

    if (!user) {
      user = await User.create({ email: 'admin@local', name: 'Admin (Local)', googleId: null, picture: null });
    }

    const payload = toPlain(user);

    return res.json({
      id: payload.id,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      token: generateToken(payload.id, payload.email, payload.name),
    });
  }

  return res.status(401).json({ error: 'Invalid credentials' });
});

app.get('/api/auth/verify', verifyTokenMiddleware as any, async (req: Request & { user?: any }, res: Response) => {
  return res.json({
    id: req.user.id,
    email: req.user.email,
    name: req.user.name,
    picture: null,
    token: generateToken(req.user.id, req.user.email, req.user.name),
  });
});

app.post('/api/auth/google/callback', async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Authorization code required' });

    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: process.env.VITE_GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: process.env.OAUTH_REDIRECT_URI || 'http://localhost:3000/auth/callback',
    });

    const accessToken = tokenResponse.data?.access_token;
    const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const { id: googleId, email, name, picture } = userInfoResponse.data;

    let user = await User.findOne({ $or: [{ googleId }, { email }] });
    if (!user) {
      user = await User.create({ googleId, email, name, picture });
    } else {
      user.googleId = googleId;
      user.email = email;
      user.name = name;
      user.picture = picture;
      user.updatedAt = nowIso();
      await user.save();
    }

    const payload = toPlain(user);

    return res.json({
      id: payload.id,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      token: generateToken(payload.id, payload.email, payload.name),
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
});

// Mahasiswa
app.get('/api/mahasiswa', async (_req: Request, res: Response) => {
  const items = await Mahasiswa.find().sort({ createdAt: -1 });
  res.json(items.map(toPlain));
});

app.post('/api/mahasiswa', async (req: Request, res: Response) => {
  try {
    const mahasiswa = await Mahasiswa.create(req.body);
    return res.status(201).json(toPlain(mahasiswa));
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

app.get('/api/mahasiswa/:id', async (req: Request, res: Response) => {
  if (!isValidObjectId(req.params.id)) return sendNotFound(res);
  const item = await Mahasiswa.findById(req.params.id);
  if (!item) return sendNotFound(res);
  return res.json(toPlain(item));
});

app.put('/api/mahasiswa/:id', async (req: Request, res: Response) => {
  if (!isValidObjectId(req.params.id)) return sendNotFound(res);
  const updated = await Mahasiswa.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!updated) return sendNotFound(res);
  return res.json(toPlain(updated));
});

app.delete('/api/mahasiswa/:id', async (req: Request, res: Response) => {
  if (!isValidObjectId(req.params.id)) return sendNotFound(res);
  const deleted = await Mahasiswa.findByIdAndDelete(req.params.id);
  if (!deleted) return sendNotFound(res);
  return res.json({ message: 'Deleted successfully' });
});

// Dosen
app.get('/api/dosen', async (_req: Request, res: Response) => {
  const items = await Dosen.find().sort({ nama: 1 });
  res.json(items.map(toPlain));
});

app.post('/api/dosen', async (req: Request, res: Response) => {
  try {
    const dosen = await Dosen.create(req.body);
    return res.status(201).json(toPlain(dosen));
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

app.get('/api/dosen/:id', async (req: Request, res: Response) => {
  if (!isValidObjectId(req.params.id)) return sendNotFound(res);
  const item = await Dosen.findById(req.params.id);
  if (!item) return sendNotFound(res);
  return res.json(toPlain(item));
});

app.put('/api/dosen/:id', async (req: Request, res: Response) => {
  if (!isValidObjectId(req.params.id)) return sendNotFound(res);
  const updated = await Dosen.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!updated) return sendNotFound(res);
  return res.json(toPlain(updated));
});

app.delete('/api/dosen/:id', async (req: Request, res: Response) => {
  if (!isValidObjectId(req.params.id)) return sendNotFound(res);
  const deleted = await Dosen.findByIdAndDelete(req.params.id);
  if (!deleted) return sendNotFound(res);
  return res.json({ message: 'Deleted successfully' });
});

// Matakuliah
app.get('/api/matakuliah', async (_req: Request, res: Response) => {
  const items = await Matakuliah.find().sort({ nama: 1 });
  res.json(items.map(toPlain));
});

app.post('/api/matakuliah', async (req: Request, res: Response) => {
  try {
    const matakuliah = await Matakuliah.create(req.body);
    return res.status(201).json(toPlain(matakuliah));
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

app.get('/api/matakuliah/:id', async (req: Request, res: Response) => {
  if (!isValidObjectId(req.params.id)) return sendNotFound(res);
  const item = await Matakuliah.findById(req.params.id);
  if (!item) return sendNotFound(res);
  return res.json(toPlain(item));
});

app.put('/api/matakuliah/:id', async (req: Request, res: Response) => {
  if (!isValidObjectId(req.params.id)) return sendNotFound(res);
  const updated = await Matakuliah.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!updated) return sendNotFound(res);
  return res.json(toPlain(updated));
});

app.delete('/api/matakuliah/:id', async (req: Request, res: Response) => {
  if (!isValidObjectId(req.params.id)) return sendNotFound(res);
  const deleted = await Matakuliah.findByIdAndDelete(req.params.id);
  if (!deleted) return sendNotFound(res);
  return res.json({ message: 'Deleted successfully' });
});

// Kelas
app.get('/api/kelas', async (_req: Request, res: Response) => {
  const items = await Kelas.find().sort({ nama: 1 });
  res.json(items.map(toPlain));
});

app.post('/api/kelas', async (req: Request, res: Response) => {
  try {
    const kelas = await Kelas.create(req.body);
    return res.status(201).json(toPlain(kelas));
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

app.get('/api/kelas/:id', async (req: Request, res: Response) => {
  if (!isValidObjectId(req.params.id)) return sendNotFound(res);
  const item = await Kelas.findById(req.params.id);
  if (!item) return sendNotFound(res);
  return res.json(toPlain(item));
});

app.put('/api/kelas/:id', async (req: Request, res: Response) => {
  if (!isValidObjectId(req.params.id)) return sendNotFound(res);
  const updated = await Kelas.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!updated) return sendNotFound(res);
  return res.json(toPlain(updated));
});

app.delete('/api/kelas/:id', async (req: Request, res: Response) => {
  if (!isValidObjectId(req.params.id)) return sendNotFound(res);
  const deleted = await Kelas.findByIdAndDelete(req.params.id);
  if (!deleted) return sendNotFound(res);
  return res.json({ message: 'Deleted successfully' });
});

// Jadwal
app.get('/api/jadwal', async (_req: Request, res: Response) => {
  const items = await Jadwal.find().sort({ hari: 1 });
  res.json(items.map(toPlain));
});

app.post('/api/jadwal', async (req: Request, res: Response) => {
  try {
    const jadwal = await Jadwal.create(req.body);
    return res.status(201).json(toPlain(jadwal));
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

app.get('/api/jadwal/:id', async (req: Request, res: Response) => {
  if (!isValidObjectId(req.params.id)) return sendNotFound(res);
  const item = await Jadwal.findById(req.params.id);
  if (!item) return sendNotFound(res);
  return res.json(toPlain(item));
});

app.put('/api/jadwal/:id', async (req: Request, res: Response) => {
  if (!isValidObjectId(req.params.id)) return sendNotFound(res);
  const updated = await Jadwal.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!updated) return sendNotFound(res);
  return res.json(toPlain(updated));
});

app.delete('/api/jadwal/:id', async (req: Request, res: Response) => {
  if (!isValidObjectId(req.params.id)) return sendNotFound(res);
  const deleted = await Jadwal.findByIdAndDelete(req.params.id);
  if (!deleted) return sendNotFound(res);
  return res.json({ message: 'Deleted successfully' });
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'OK',
    mode: 'mongodb',
    mongoState: mongoose.connection.readyState,
    timestamp: new Date().toISOString(),
  });
});

const startServer = async () => {
  try {
    await connectMongo();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`🗄️  MongoDB connected: ${MONGODB_URI}`);
      console.log(`🔗 API base: ${API_BASE_URL}`);
    });
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

startServer();