/**
 * Express Backend Server untuk Sistem Akademik
 * Local JSON storage fallback (works without MongoDB)
 */

import express, { Express, NextFunction, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import axios from 'axios';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;
const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'local-db.json');

type Store = {
  mahasiswa: any[];
  dosen: any[];
  matakuliah: any[];
  kelas: any[];
  jadwal: any[];
  users: any[];
};

const EMPTY_STORE: Store = {
  mahasiswa: [],
  dosen: [],
  matakuliah: [],
  kelas: [],
  jadwal: [],
  users: [],
};

const ensureStoreFile = async () => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify(EMPTY_STORE, null, 2), 'utf8');
  }
};

const readStore = async (): Promise<Store> => {
  await ensureStoreFile();
  const raw = await fs.readFile(DATA_FILE, 'utf8');
  const parsed = JSON.parse(raw) as Partial<Store>;
  return {
    mahasiswa: parsed.mahasiswa ?? [],
    dosen: parsed.dosen ?? [],
    matakuliah: parsed.matakuliah ?? [],
    kelas: parsed.kelas ?? [],
    jadwal: parsed.jadwal ?? [],
    users: parsed.users ?? [],
  };
};

const writeStore = async (store: Store) => {
  await ensureStoreFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2), 'utf8');
};

const nowIso = () => new Date().toISOString();

const toPlain = (item: any) => {
  if (!item) return item;
  if (typeof item.toObject === 'function') {
    const plain = item.toObject();
    const { _id, __v, ...rest } = plain;
    return { id: _id?.toString?.() ?? String(_id), ...rest };
  }
  const { _id, __v, ...rest } = item;
  return { id: item.id ?? _id ?? randomUUID(), ...rest };
};

const sortByCreatedAtDesc = (items: any[]) =>
  [...items].sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());

const sortByNameAsc = (items: any[]) =>
  [...items].sort((a, b) => String(a.nama ?? '').localeCompare(String(b.nama ?? '')));

const sortByHariAsc = (items: any[]) =>
  [...items].sort((a, b) => String(a.hari ?? '').localeCompare(String(b.hari ?? '')));

const createItem = (payload: any) => ({
  id: randomUUID(),
  ...payload,
  createdAt: nowIso(),
  updatedAt: nowIso(),
});

const updateItem = (items: any[], id: string, payload: any) => {
  const index = items.findIndex(item => String(item.id) === String(id));
  if (index < 0) return null;
  const next = [...items];
  next[index] = { ...next[index], ...payload, updatedAt: nowIso() };
  return next[index];
};

const removeItem = (items: any[], id: string) => {
  const index = items.findIndex(item => String(item.id) === String(id));
  if (index < 0) return null;
  const next = [...items];
  next.splice(index, 1);
  return next;
};

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
    const store = await readStore();
    let user = store.users.find(item => item.email === 'admin@local');

    if (!user) {
      user = createItem({ email: 'admin@local', name: 'Admin (Local)', googleId: null, picture: null });
      store.users.push(user);
      await writeStore(store);
    }

    return res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      token: generateToken(user.id, user.email, user.name),
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
    const store = await readStore();

    let user = store.users.find(item => item.googleId === googleId || item.email === email);
    if (!user) {
      user = createItem({ googleId, email, name, picture });
      store.users.push(user);
    } else {
      user = { ...user, googleId, email, name, picture, updatedAt: nowIso() };
      store.users = store.users.map(item => String(item.id) === String(user.id) ? user : item);
    }

    await writeStore(store);

    return res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      token: generateToken(user.id, user.email, user.name),
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
});

// Mahasiswa
app.get('/api/mahasiswa', async (_req: Request, res: Response) => {
  const store = await readStore();
  res.json(sortByCreatedAtDesc(store.mahasiswa).map(toPlain));
});

app.post('/api/mahasiswa', async (req: Request, res: Response) => {
  try {
    const store = await readStore();
    const mahasiswa = createItem(req.body);
    store.mahasiswa.push(mahasiswa);
    await writeStore(store);
    return res.status(201).json(mahasiswa);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

app.get('/api/mahasiswa/:id', async (req: Request, res: Response) => {
  const store = await readStore();
  const item = store.mahasiswa.find(row => String(row.id) === String(req.params.id));
  if (!item) return res.status(404).json({ error: 'Not found' });
  return res.json(item);
});

app.put('/api/mahasiswa/:id', async (req: Request, res: Response) => {
  const store = await readStore();
  const updated = updateItem(store.mahasiswa, req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Not found' });
  store.mahasiswa = store.mahasiswa.map(row => String(row.id) === String(req.params.id) ? updated : row);
  await writeStore(store);
  return res.json(updated);
});

app.delete('/api/mahasiswa/:id', async (req: Request, res: Response) => {
  const store = await readStore();
  const next = removeItem(store.mahasiswa, req.params.id);
  if (!next) return res.status(404).json({ error: 'Not found' });
  store.mahasiswa = next;
  await writeStore(store);
  return res.json({ message: 'Deleted successfully' });
});

// Dosen
app.get('/api/dosen', async (_req: Request, res: Response) => {
  const store = await readStore();
  res.json(sortByNameAsc(store.dosen).map(toPlain));
});

app.post('/api/dosen', async (req: Request, res: Response) => {
  try {
    const store = await readStore();
    const dosen = createItem(req.body);
    store.dosen.push(dosen);
    await writeStore(store);
    return res.status(201).json(dosen);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

app.get('/api/dosen/:id', async (req: Request, res: Response) => {
  const store = await readStore();
  const item = store.dosen.find(row => String(row.id) === String(req.params.id));
  if (!item) return res.status(404).json({ error: 'Not found' });
  return res.json(item);
});

app.put('/api/dosen/:id', async (req: Request, res: Response) => {
  const store = await readStore();
  const updated = updateItem(store.dosen, req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Not found' });
  store.dosen = store.dosen.map(row => String(row.id) === String(req.params.id) ? updated : row);
  await writeStore(store);
  return res.json(updated);
});

app.delete('/api/dosen/:id', async (req: Request, res: Response) => {
  const store = await readStore();
  const next = removeItem(store.dosen, req.params.id);
  if (!next) return res.status(404).json({ error: 'Not found' });
  store.dosen = next;
  await writeStore(store);
  return res.json({ message: 'Deleted successfully' });
});

// Matakuliah
app.get('/api/matakuliah', async (_req: Request, res: Response) => {
  const store = await readStore();
  res.json(sortByNameAsc(store.matakuliah).map(toPlain));
});

app.post('/api/matakuliah', async (req: Request, res: Response) => {
  try {
    const store = await readStore();
    const matakuliah = createItem(req.body);
    store.matakuliah.push(matakuliah);
    await writeStore(store);
    return res.status(201).json(matakuliah);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

app.get('/api/matakuliah/:id', async (req: Request, res: Response) => {
  const store = await readStore();
  const item = store.matakuliah.find(row => String(row.id) === String(req.params.id));
  if (!item) return res.status(404).json({ error: 'Not found' });
  return res.json(item);
});

app.put('/api/matakuliah/:id', async (req: Request, res: Response) => {
  const store = await readStore();
  const updated = updateItem(store.matakuliah, req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Not found' });
  store.matakuliah = store.matakuliah.map(row => String(row.id) === String(req.params.id) ? updated : row);
  await writeStore(store);
  return res.json(updated);
});

app.delete('/api/matakuliah/:id', async (req: Request, res: Response) => {
  const store = await readStore();
  const next = removeItem(store.matakuliah, req.params.id);
  if (!next) return res.status(404).json({ error: 'Not found' });
  store.matakuliah = next;
  await writeStore(store);
  return res.json({ message: 'Deleted successfully' });
});

// Kelas
app.get('/api/kelas', async (_req: Request, res: Response) => {
  const store = await readStore();
  res.json(sortByNameAsc(store.kelas).map(toPlain));
});

app.post('/api/kelas', async (req: Request, res: Response) => {
  try {
    const store = await readStore();
    const kelas = createItem(req.body);
    store.kelas.push(kelas);
    await writeStore(store);
    return res.status(201).json(kelas);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

app.get('/api/kelas/:id', async (req: Request, res: Response) => {
  const store = await readStore();
  const item = store.kelas.find(row => String(row.id) === String(req.params.id));
  if (!item) return res.status(404).json({ error: 'Not found' });
  return res.json(item);
});

app.put('/api/kelas/:id', async (req: Request, res: Response) => {
  const store = await readStore();
  const updated = updateItem(store.kelas, req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Not found' });
  store.kelas = store.kelas.map(row => String(row.id) === String(req.params.id) ? updated : row);
  await writeStore(store);
  return res.json(updated);
});

app.delete('/api/kelas/:id', async (req: Request, res: Response) => {
  const store = await readStore();
  const next = removeItem(store.kelas, req.params.id);
  if (!next) return res.status(404).json({ error: 'Not found' });
  store.kelas = next;
  await writeStore(store);
  return res.json({ message: 'Deleted successfully' });
});

// Jadwal
app.get('/api/jadwal', async (_req: Request, res: Response) => {
  const store = await readStore();
  res.json(sortByHariAsc(store.jadwal).map(toPlain));
});

app.post('/api/jadwal', async (req: Request, res: Response) => {
  try {
    const store = await readStore();
    const jadwal = createItem(req.body);
    store.jadwal.push(jadwal);
    await writeStore(store);
    return res.status(201).json(jadwal);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

app.get('/api/jadwal/:id', async (req: Request, res: Response) => {
  const store = await readStore();
  const item = store.jadwal.find(row => String(row.id) === String(req.params.id));
  if (!item) return res.status(404).json({ error: 'Not found' });
  return res.json(item);
});

app.put('/api/jadwal/:id', async (req: Request, res: Response) => {
  const store = await readStore();
  const updated = updateItem(store.jadwal, req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Not found' });
  store.jadwal = store.jadwal.map(row => String(row.id) === String(req.params.id) ? updated : row);
  await writeStore(store);
  return res.json(updated);
});

app.delete('/api/jadwal/:id', async (req: Request, res: Response) => {
  const store = await readStore();
  const next = removeItem(store.jadwal, req.params.id);
  if (!next) return res.status(404).json({ error: 'Not found' });
  store.jadwal = next;
  await writeStore(store);
  return res.json({ message: 'Deleted successfully' });
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'OK', mode: 'local-json', timestamp: new Date().toISOString() });
});

app.listen(PORT, async () => {
  await ensureStoreFile();
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🗄️  Local data store: ${DATA_FILE}`);
  console.log(`🔗 API base: ${API_BASE_URL}`);
});