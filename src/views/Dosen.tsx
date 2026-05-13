/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserSquare2, Search, Plus, Edit2, Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { dosenApi, handleApiError, OperationType } from '../lib/api';
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from 'motion/react';

interface Dosen {
  id?: string;
  nama: string;
  nip: string;
  bidang: string;
  email: string;
  nomor_hp: string;
  status: 'Aktif' | 'Cuti' | 'Pensiun';
}

const PAGE_SIZE = 5;

export default function DosenView() {
  const [data, setData] = useState<Dosen[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState<Dosen>({
    nama: '', nip: '', bidang: '', email: '', nomor_hp: '', status: 'Aktif'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const list = await dosenApi.getAll();
      setData(list.filter(item => item.nama.toLowerCase().includes(searchTerm.toLowerCase()) || item.nip.includes(searchTerm)));
    } catch (err) {
      handleApiError(err, OperationType.LIST, 'dosen');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await dosenApi.update(editingId, formData);
        Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Data dosen berhasil diperbarui', timer: 1500, showConfirmButton: false });
      } else {
        await dosenApi.create(formData);
        Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Dosen baru berhasil ditambahkan', timer: 1500, showConfirmButton: false });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      handleApiError(err, editingId ? OperationType.UPDATE : OperationType.CREATE, 'dosen');
    }
  };

  const handleEdit = (item: Dosen) => { setFormData(item); setEditingId(item.id!); setIsModalOpen(true); };
  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Hapus Dosen?',
      text: "Tindakan ini tidak dapat dibatalkan!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#6366F1',
      confirmButtonText: 'Ya, Hapus'
    });
    if (result.isConfirmed) {
      try { 
        await dosenApi.delete(id); 
        fetchData(); 
        Swal.fire({ icon: 'success', title: 'Terhapus', text: 'Data dosen telah dihapus', timer: 1500, showConfirmButton: false });
      } catch (err) { 
        handleApiError(err, OperationType.DELETE, 'dosen'); 
      }
    }
  };

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedData = data.slice(startIndex, startIndex + PAGE_SIZE);
  const totalPages = Math.ceil(data.length / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" placeholder="Cari Dosen (Nama, NIP)..." 
            className="w-full pl-12 pr-4 py-3 glass rounded-2xl outline-none neumorph-inset"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button onClick={() => { setEditingId(null); setFormData({ nama: '', nip: '', bidang: '', email: '', nomor_hp: '', status: 'Aktif' }); setIsModalOpen(true); }}
          className="bg-primary text-white px-6 py-3 rounded-2xl font-semibold flex items-center gap-2 shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" /> Tambah Dosen
        </button>
      </div>

      <div className="glass rounded-3xl overflow-hidden neumorph">
        <table className="w-full text-left font-sans">
          <thead className="bg-slate-50/50 border-b border-slate-200/50 text-xs font-bold text-slate-400 uppercase">
            <tr><th className="px-6 py-4">Dosen</th><th className="px-6 py-4">Keahlian</th><th className="px-6 py-4">Kontak</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Aksi</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-200/50 text-sm">
            {paginatedData.map(item => (
              <tr key={item.id} className="hover:bg-white/40">
                <td className="px-6 py-4"><p className="font-bold">{item.nama}</p><p className="text-xs text-slate-400 font-mono">{item.nip}</p></td>
                <td className="px-6 py-4 font-medium">{item.bidang}</td>
                <td className="px-6 py-4"><p>{item.email}</p><p className="text-xs text-slate-400">{item.nomor_hp}</p></td>
                <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-bold ${item.status === 'Aktif' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>{item.status}</span></td>
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
              <h3 className="text-xl font-bold mb-4">{editingId ? 'Edit Dosen' : 'Tambah Dosen'}</h3>
              <input required placeholder="Nama" className="w-full p-3 border rounded-xl" value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} />
              <input required placeholder="NIP" className="w-full p-3 border rounded-xl" value={formData.nip} onChange={e => setFormData({...formData, nip: e.target.value})} />
              <input required placeholder="Bidang" className="w-full p-3 border rounded-xl" value={formData.bidang} onChange={e => setFormData({...formData, bidang: e.target.value})} />
              <input required placeholder="Email" type="email" className="w-full p-3 border rounded-xl" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              <input placeholder="Nomor HP" className="w-full p-3 border rounded-xl" value={formData.nomor_hp} onChange={e => setFormData({...formData, nomor_hp: e.target.value})} />
              <select className="w-full p-3 border rounded-xl" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                <option value="Aktif">Aktif</option><option value="Cuti">Cuti</option><option value="Pensiun">Pensiun</option>
              </select>
              <div className="flex gap-4 pt-4"><button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 p-3 bg-slate-50 rounded-xl font-bold">Batal</button><button type="submit" className="flex-1 p-3 bg-primary text-white rounded-xl font-bold">Simpan</button></div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
