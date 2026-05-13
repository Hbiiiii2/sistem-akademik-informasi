/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CalendarDays, Search, Plus, Edit2, Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { jadwalApi, kelasApi, handleApiError, OperationType } from '../lib/api';
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from 'motion/react';

interface Jadwal {
  id?: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  ruangan: string;
  kelas_id: string;
}

const PAGE_SIZE = 5;
const HARI_LIST = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export default function JadwalView() {
  const [data, setData] = useState<Jadwal[]>([]);
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState<Jadwal>({
    hari: 'Senin', jam_mulai: '08:00', jam_selesai: '10:00', ruangan: '', kelas_id: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const list = await jadwalApi.getAll();
      setData(list);
      
      const kelasList = await kelasApi.getAll();
      setKelasList(kelasList);
    } catch (err) {
      handleApiError(err, OperationType.LIST, 'jadwal');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await jadwalApi.update(editingId, formData);
        Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Jadwal diperbarui', timer: 1500, showConfirmButton: false });
      } else {
        await jadwalApi.create(formData);
        Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Jadwal ditambahkan', timer: 1500, showConfirmButton: false });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      handleApiError(err, editingId ? OperationType.UPDATE : OperationType.CREATE, 'jadwal');
    }
  };

  const handleEdit = (item: Jadwal) => { setFormData(item); setEditingId(item.id!); setIsModalOpen(true); };
  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Hapus Jadwal?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus'
    });
    if (result.isConfirmed) {
      try { 
        await jadwalApi.delete(id); 
        fetchData();
        Swal.fire('Terhapus', '', 'success');
      } catch (err) { handleApiError(err, OperationType.DELETE, 'jadwal'); }
    }
  };

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedData = data.slice(startIndex, startIndex + PAGE_SIZE);
  const totalPages = Math.ceil(data.length / PAGE_SIZE);

  const getKelasName = (id: string) => kelasList.find(k => k.id === id)?.nama || 'Loading...';

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={() => { setEditingId(null); setFormData({ hari: 'Senin', jam_mulai: '08:00', jam_selesai: '10:00', ruangan: '', kelas_id: '' }); setIsModalOpen(true); }}
          className="bg-primary text-white px-6 py-3 rounded-2xl font-semibold flex items-center gap-2 shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" /> Tambah Jadwal
        </button>
      </div>

      <div className="glass rounded-3xl overflow-hidden neumorph">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-200/50 text-xs font-bold text-slate-400 uppercase">
            <tr><th className="px-6 py-4">Waktu</th><th className="px-6 py-4">Kelas</th><th className="px-6 py-4">Ruangan</th><th className="px-6 py-4 text-right">Aksi</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-200/50 text-sm">
            {paginatedData.map(item => (
              <tr key={item.id} className="hover:bg-white/40">
                <td className="px-6 py-4">
                  <p className="font-bold text-slate-700">{item.hari}</p>
                  <p className="text-xs text-slate-400">{item.jam_mulai} - {item.jam_selesai}</p>
                </td>
                <td className="px-6 py-4 font-bold">{getKelasName(item.kelas_id)}</td>
                <td className="px-6 py-4 text-slate-500">{item.ruangan}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 text-slate-400">
                    <button onClick={() => handleEdit(item)} className="hover:text-primary"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(item.id!)} className="hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-6 py-4 flex justify-between items-center border-t border-slate-200/50">
           <span className="text-sm text-slate-500">Page {currentPage} of {totalPages}</span>
           <div className="flex gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-2 border rounded-xl"><ChevronLeft size={20} /></button>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="p-2 border rounded-xl"><ChevronRight size={20} /></button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60" onClick={() => setIsModalOpen(false)} />
            <motion.form initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="relative w-full max-w-xl bg-white rounded-3xl p-8 space-y-4" onSubmit={handleSubmit}>
              <h3 className="text-xl font-bold mb-4">{editingId ? 'Edit Jadwal' : 'Tambah Jadwal'}</h3>
              <div className="grid grid-cols-2 gap-4">
                <select required className="w-full p-3 border rounded-xl bg-white" value={formData.hari} onChange={e => setFormData({...formData, hari: e.target.value})}>
                  {HARI_LIST.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                <input required placeholder="Ruangan" className="w-full p-3 border rounded-xl" value={formData.ruangan} onChange={e => setFormData({...formData, ruangan: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Jam Mulai</label>
                  <input required type="time" className="w-full p-3 border rounded-xl" value={formData.jam_mulai} onChange={e => setFormData({...formData, jam_mulai: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Jam Selesai</label>
                  <input required type="time" className="w-full p-3 border rounded-xl" value={formData.jam_selesai} onChange={e => setFormData({...formData, jam_selesai: e.target.value})} />
                </div>
              </div>
              <div className="space-y-4">
                <select required className="w-full p-3 border rounded-xl bg-white" value={formData.kelas_id} onChange={e => setFormData({...formData, kelas_id: e.target.value})}>
                  <option value="">Pilih Kelas</option>
                  {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
                </select>
              </div>
              <div className="flex gap-4 pt-4"><button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 p-3 bg-slate-50 font-bold rounded-xl">Batal</button><button type="submit" className="flex-1 p-3 bg-primary text-white font-bold rounded-xl">Simpan</button></div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
