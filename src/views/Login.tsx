/**
 * Login Page with Google OAuth
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, Loader } from 'lucide-react';
import { motion } from 'motion/react';
import { initiateGoogleAuth, exchangeCodeForToken } from '../lib/oauth';
import { useAuth } from '../lib/auth-context';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');

  // Handle OAuth callback
  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(location.search);
      const code = params.get('code');

      if (code) {
        setLoading(true);
        try {
          const authUser = await exchangeCodeForToken(code);
          setUser(authUser);
          navigate('/');
        } catch (err) {
          setError('Gagal login. Silakan coba lagi.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
    };

    handleCallback();
  }, [location, setUser, navigate]);

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleGoogleLogin = () => {
    initiateGoogleAuth();
  };

  const handleLocalLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`${process.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body?.error || 'Login gagal');
      }

      const authUser = await resp.json();
      setUser(authUser);
      navigate('/');
    } catch (err) {
      setError('Login lokal gagal — pastikan username/password benar');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full glass p-8 rounded-3xl neumorph text-center"
      >
        <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <BookOpen className="w-10 h-10 text-primary" />
        </div>
        
        <h1 className="text-3xl font-bold mb-2">Akademik Portal</h1>
        <p className="text-slate-500 mb-8">Silakan masuk untuk mengakses sistem akademik kampus.</p>

        {error && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium"
          >
            {error}
          </motion.div>
        )}

        <div className="space-y-3">
          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-primary text-white py-4 px-6 rounded-2xl font-semibold flex items-center justify-center gap-3 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
          >
          {loading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Memproses...
            </>
          ) : (
            <>
              <img 
                src="https://www.google.com/favicon.ico" 
                alt="Google" 
                className="w-5 h-5 bg-white rounded-full p-0.5" 
              />
              Masuk dengan Google
            </>
          )}
          </button>

          <div className="grid grid-cols-2 gap-2 items-center mt-2">
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="username" className="col-span-1 p-2 rounded-md border" />
            <input value={password} onChange={e => setPassword(e.target.value)} placeholder="password" type="password" className="col-span-1 p-2 rounded-md border" />
          </div>

          <button onClick={handleLocalLogin} disabled={loading} className="w-full mt-2 bg-slate-800 text-white py-3 rounded-2xl font-medium hover:opacity-90 active:scale-95 disabled:opacity-50">Login lokal (admin/admin)</button>

        </div>

        <div className="mt-6 text-xs text-slate-400 space-y-2">
          <p>Dengan melakukan login, Anda menyetujui Kebijakan Privasi kami</p>
          <p>dan Syarat Layanan yang berlaku.</p>
        </div>
      </motion.div>
    </div>
  );
}
