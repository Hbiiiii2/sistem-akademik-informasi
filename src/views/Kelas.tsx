/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DoorOpen, Search, Plus, Edit2, Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { kelasApi, dosenApi, handleApiError, OperationType } from '../lib/api';
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from 'motion/react';

interface Kelas {
  id?: string;
  nama: string;
  kapasitas: number;
  dosen_id: string;
  semester: number;
  matakuliah_id?: string;
  ruangan?: string;
}

const PAGE_SIZE = 5;

export default function KelasView() {
  const [data, setData] = useState<Kelas[]>([]);
  const [dosenList, setDosenList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState<Kelas>({
    nama: '', kapasitas: 30, dosen_id: '', semester: 1
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const list = await kelasApi.getAll();
      setData(list.filter(item => item.nama.toLowerCase().includes(searchTerm.toLowerCase())));
      
      const dosenList = await dosenApi.getAll();
      setDosenList(dosenList);
    } catch (err) {
      handleApiError(err, OperationType.LIST, 'kelas');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await kelasApi.update(editingId, formData);
        Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Data kelas diperbarui', timer: 1500, showConfirmButton: false });
      } else {
        await kelasApi.create(formData);
        Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Kelas berhasil dibuat', timer: 1500, showConfirmButton: false });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      handleApiError(err, editingId ? OperationType.UPDATE : OperationType.CREATE, 'kelas');
    }
  };

  const handleEdit = (item: Kelas) => { setFormData(item); setEditingId(item.id!); setIsModalOpen(true); };
  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Hapus Kelas?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Hapus'
    });
    if (result.isConfirmed) {
      try { 
        await kelasApi.delete(id); 
        fetchData();
        Swal.fire('Terhapus', '', 'success');
      } catch (err) { handleApiError(err, OperationType.DELETE, 'kelas'); }
    }
  };

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedData = data.slice(startIndex, startIndex + PAGE_SIZE);
  const totalPages = Math.ceil(data.length / PAGE_SIZE);

  const getDosenName = (id: string) => dosenList.find(d => d.id === id)?.nama || 'Unknown';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" placeholder="Cari Kelas..." 
            className="w-full pl-12 pr-4 py-3 glass rounded-2xl outline-none neumorph-inset"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button onClick={() => { setEditingId(null); setFormData({ nama: '', kapasitas: 30, dosen_id: '', semester: 1 }); setIsModalOpen(true); }}
          className="bg-primary text-white px-6 py-3 rounded-2xl font-semibold flex items-center gap-2 shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" /> Tambah Kelas
        </button>
      </div>

      <div className="glass rounded-3xl overflow-hidden neumorph">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-200/50 text-xs font-bold text-slate-400 uppercase">
            <tr><th className="px-6 py-4">Nama Kelas</th><th className="px-6 py-4">Kapasitas</th><th className="px-6 py-4">Wali Dosen</th><th className="px-6 py-4">Smt</th><th className="px-6 py-4 text-right">Aksi</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-200/50 text-sm">
            {paginatedData.map(item => (
              <tr key={item.id} className="hover:bg-white/40">
                <td className="px-6 py-4 font-bold text-primary">{item.nama}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{item.kapasitas}</span>
                    <span className="text-slate-400">Kursi</span>
                  </div>
                </td>
                <td className="px-6 py-4 font-medium">{getDosenName(item.dosen_id)}</td>
                <td className="px-6 py-4 font-bold">SMT {item.semester}</td>
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
        <div className="px-6 py-4 flex items-center justify-between border-t border-slate-200/50">
          <span className="text-sm text-slate-500">Page {currentPage} of {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-2 border rounded-xl disabled:opacity-50"><ChevronLeft size={20} /></button>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="p-2 border rounded-xl disabled:opacity-50"><ChevronRight size={20} /></button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60" onClick={() => setIsModalOpen(false)} />
            <motion.form initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="relative w-full max-w-lg bg-white rounded-3xl p-8 space-y-4" onSubmit={handleSubmit}>
              <h3 className="text-xl font-bold mb-4">{editingId ? 'Edit Kelas' : 'Tambah Kelas'}</h3>
              <input required placeholder="Nama Kelas (Contoh: A1)" className="w-full p-3 border rounded-xl" value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} />
              <input required placeholder="Kapasitas" type="number" className="w-full p-3 border rounded-xl" value={formData.kapasitas} onChange={e => setFormData({...formData, kapasitas: parseInt(e.target.value)})} />
              <select required className="w-full p-3 border rounded-xl bg-white" value={formData.dosen_id} onChange={e => setFormData({...formData, dosen_id: e.target.value})}>
                <option value="">Pilih Wali Dosen</option>
                {dosenList.map(d => <option key={d.id} value={d.id}>{d.nama}</option>)}
              </select>
              <input required placeholder="Semester" type="number" className="w-full p-3 border rounded-xl" value={formData.semester} onChange={e => setFormData({...formData, semester: parseInt(e.target.value)})} />
              <div className="flex gap-4 pt-4"><button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 p-3 bg-slate-50 rounded-xl font-bold">Batal</button><button type="submit" className="flex-1 p-3 bg-primary text-white rounded-xl font-bold font-sans">Simpan</button></div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
