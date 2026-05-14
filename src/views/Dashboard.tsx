/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserSquare2, 
  BookOpen, 
  DoorOpen, 
  CalendarDays,
  ArrowRight
} from 'lucide-react';
import { mahasiswaApi, dosenApi, matakuliahApi, kelasApi, jadwalApi } from '../lib/api';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

interface Stat {
  label: string;
  value: number;
  icon: any;
  color: string;
  link: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stat[]>([
    { label: 'Total Mahasiswa', value: 0, icon: Users, color: 'bg-blue-500', link: '/mahasiswa' },
    { label: 'Total Dosen', value: 0, icon: UserSquare2, color: 'bg-emerald-500', link: '/dosen' },
    { label: 'Total Mata Kuliah', value: 0, icon: BookOpen, color: 'bg-amber-500', link: '/matakuliah' },
    { label: 'Total Kelas', value: 0, icon: DoorOpen, color: 'bg-indigo-500', link: '/kelas' },
  ]);
  const [recentJadwal, setRecentJadwal] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [mahasiswa, dosen, matakuliah, kelas, jadwal] = await Promise.all([
          mahasiswaApi.getAll(),
          dosenApi.getAll(),
          matakuliahApi.getAll(),
          kelasApi.getAll(),
          jadwalApi.getAll()
        ]);
        
        setStats(prev => [
          { ...prev[0], value: mahasiswa.length },
          { ...prev[1], value: dosen.length },
          { ...prev[2], value: matakuliah.length },
          { ...prev[3], value: kelas.length },
        ]);
        
        const kelasById = new Map(kelas.map((item: any) => [String(item.id), item]));
        const matakuliahById = new Map(matakuliah.map((item: any) => [String(item.id), item]));

        const enrichedJadwal = jadwal.slice(0, 5).map((item: any) => {
          const kelasId = item.kelas_id || item.kelasId;
          const kelasItem = kelasById.get(String(kelasId));
          const matakuliahId =
            kelasItem?.matakuliah_id ||
            kelasItem?.mata_kuliah_id ||
            kelasItem?.matakuliahId ||
            item.matakuliah_id ||
            item.mata_kuliah_id ||
            item.matakuliahId;
          const matakuliahItem = matakuliahById.get(String(matakuliahId));

          return {
            ...item,
            kelas_name: item.kelas_name || kelasItem?.nama || '-',
            mata_kuliah_name: item.mata_kuliah_name || matakuliahItem?.nama || '-',
          };
        });

        setRecentJadwal(enrichedJadwal);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return null;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="glass p-6 rounded-3xl neumorph group hover:translate-y-[-4px] transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-4 rounded-2xl ${stat.color} text-white shadow-lg`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <Link to={stat.link} className="p-2 rounded-xl hover:bg-slate-100/50 text-slate-400 group-hover:text-primary transition-colors">
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <p className="text-slate-500 font-medium mb-1">{stat.label}</p>
            <h3 className="text-3xl font-bold">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Jadwal Perkuliahan Terbaru</h3>
            <Link to="/jadwal" className="text-primary font-medium hover:underline text-sm">Lihat Semua</Link>
          </div>
          
          <div className="glass rounded-3xl overflow-hidden neumorph">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b border-slate-200/50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Hari & Jam</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Mata Kuliah</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Ruangan</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/50">
                  {recentJadwal.length > 0 ? recentJadwal.map((jadwal) => (
                    <tr key={jadwal.id} className="hover:bg-white/40 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-sm">{jadwal.hari}</p>
                        <p className="text-xs text-slate-400">{jadwal.jam_mulai} - {jadwal.jam_selesai}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-sm">{jadwal.mata_kuliah_name || '-'}</p>
                        <p className="text-xs text-slate-400">{jadwal.kelas_name || '-'}</p>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">{jadwal.ruangan}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          Active
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                        <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>Belum ada jadwal hari ini</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-4">
            {[
              { label: 'Tambah Mahasiswa', path: '/mahasiswa', icon: Users, color: 'bg-blue-50' },
              { label: 'Input Nilai', path: '#', icon: BookOpen, color: 'bg-emerald-50' },
              { label: 'Cek Ruangan', path: '/kelas', icon: DoorOpen, color: 'bg-indigo-50' },
            ].map((action) => (
              <Link
                key={action.label}
                to={action.path}
                className="flex items-center gap-4 p-4 rounded-2xl glass hover:neumorph transition-all"
              >
                <div className={`p-3 rounded-xl ${action.color}`}>
                  <action.icon className="w-5 h-5 text-slate-600" />
                </div>
                <span className="font-semibold text-slate-700">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
