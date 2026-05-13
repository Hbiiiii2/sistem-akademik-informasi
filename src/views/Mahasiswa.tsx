/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { mahasiswaApi, handleApiError, OperationType } from '../lib/api';
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from 'motion/react';

interface Mahasiswa {
  id?: string;
  nama: string;
  nim: string;
  jurusan: string;
  semester: number;
  email: string;
  nomor_hp: string;
  status: 'Aktif' | 'Cuti' | 'Lulus' | 'Keluar';
}

const PAGE_SIZE = 5;

export default function MahasiswaView() {
  const [data, setData] = useState<Mahasiswa[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState<Mahasiswa>({
    nama: '',
    nim: '',
    jurusan: '',
    semester: 1,
    email: '',
    nomor_hp: '',
    status: 'Aktif'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const list = await mahasiswaApi.getAll();
      
      const filtered = list.filter(item => 
        item.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.nim.includes(searchTerm) ||
        item.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      setData(filtered);
    } catch (err) {
      handleApiError(err, OperationType.LIST, 'mahasiswa');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await mahasiswaApi.update(editingId, formData);
        Swal.fire({
          icon: 'success',
          title: 'Berhasil!',
          text: 'Data mahasiswa berhasil diperbarui.',
          timer: 2000,
          showConfirmButton: false,
          background: 'rgba(255, 255, 255, 0.9)',
          backdrop: 'rgba(0,0,0,0.1)'
        });
      } else {
        await mahasiswaApi.create(formData);
        Swal.fire({
          icon: 'success',
          title: 'Berhasil!',
          text: 'Data mahasiswa baru berhasil ditambahkan.',
          timer: 2000,
          showConfirmButton: false,
          background: 'rgba(255, 255, 255, 0.9)',
          backdrop: 'rgba(0,0,0,0.1)'
        });
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({
        nama: '',
        nim: '',
        jurusan: '',
        semester: 1,
        email: '',
        nomor_hp: '',
        status: 'Aktif'
      });
      fetchData();
    } catch (err) {
      handleApiError(err, editingId ? OperationType.UPDATE : OperationType.CREATE, 'mahasiswa');
    }
  };

  const handleEdit = (item: Mahasiswa) => {
    setFormData(item);
    setEditingId(item.id!);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Apakah anda yakin?',
      text: "Data yang dihapus tidak dapat dikembalikan!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#6366F1',
      cancelButtonColor: '#F1F5F9',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal',
      background: 'rgba(255, 255, 255, 0.9)',
      color: '#0F172A',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      try {
        await mahasiswaApi.delete(id);
        Swal.fire({
          title: 'Terhapus!',
          text: 'Data mahasiswa telah berhasil dihapus.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        fetchData();
      } catch (err) {
        handleApiError(err, OperationType.DELETE, 'mahasiswa');
        Swal.fire('Error', 'Gagal menghapus data.', 'error');
      }
    }
  };

  // Pagination
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedData = data.slice(startIndex, startIndex + PAGE_SIZE);
  const totalPages = Math.ceil(data.length / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Cari Mahasiswa (Nama, NIM, Email)..." 
            className="w-full pl-12 pr-4 py-3 glass rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all border-none neumorph-inset"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => {
            setEditingId(null);
            setFormData({
              nama: '',
              nim: '',
              jurusan: '',
              semester: 1,
              email: '',
              nomor_hp: '',
              status: 'Aktif'
            });
            setIsModalOpen(true);
          }}
          className="bg-primary text-white px-6 py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" />
          Tambah Mahasiswa
        </button>
      </div>

      <div className="glass rounded-3xl overflow-hidden neumorph">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-200/50">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Mahasiswa</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Kontak</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Akademik</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : paginatedData.length > 0 ? paginatedData.map((item) => (
                <tr key={item.id} className="hover:bg-white/40 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                        {item.nama.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{item.nama}</p>
                        <p className="text-xs text-slate-400 font-mono">{item.nim}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium">{item.email}</p>
                    <p className="text-xs text-slate-400">{item.nomor_hp || '-'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold">{item.jurusan}</p>
                    <p className="text-xs text-slate-400">Semester {item.semester}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                      item.status === 'Aktif' ? 'bg-emerald-50 text-emerald-600' :
                      item.status === 'Lulus' ? 'bg-blue-50 text-blue-600' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(item)}
                        className="p-2 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id!)}
                        className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>Tidak ada data mahasiswa</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-200/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            Menampilkan <span className="font-semibold">{Math.min(startIndex + 1, data.length)}</span> - <span className="font-semibold">{Math.min(startIndex + PAGE_SIZE, data.length)}</span> dari <span className="font-semibold">{data.length}</span> data
          </p>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl hover:bg-white text-slate-400 border border-slate-200 disabled:opacity-50 transition-all shadow-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 rounded-xl font-bold text-sm transition-all shadow-sm ${
                  currentPage === page ? 'bg-primary text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {page}
              </button>
            ))}
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl hover:bg-white text-slate-400 border border-slate-200 disabled:opacity-50 transition-all shadow-sm"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Form */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-2xl font-bold">{editingId ? 'Edit Mahasiswa' : 'Tambah Mahasiswa'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">Nama Lengkap</label>
                    <input 
                      required 
                      type="text" 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      value={formData.nama}
                      onChange={e => setFormData({...formData, nama: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">NIM</label>
                    <input 
                      required 
                      type="text" 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      value={formData.nim}
                      onChange={e => setFormData({...formData, nim: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">Jurusan</label>
                    <input 
                      required 
                      type="text" 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      value={formData.jurusan}
                      onChange={e => setFormData({...formData, jurusan: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">Semester</label>
                    <input 
                      required 
                      type="number" 
                      min="1" 
                      max="14"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      value={formData.semester}
                      onChange={e => setFormData({...formData, semester: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">Email</label>
                    <input 
                      required 
                      type="email" 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">Nomor HP</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      value={formData.nomor_hp}
                      onChange={e => setFormData({...formData, nomor_hp: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">Status</label>
                    <select 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white"
                      value={formData.status}
                      onChange={e => setFormData({...formData, status: e.target.value as any})}
                    >
                      <option value="Aktif">Aktif</option>
                      <option value="Cuti">Cuti</option>
                      <option value="Lulus">Lulus</option>
                      <option value="Keluar">Keluar</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-4 rounded-2xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-6 py-4 rounded-2xl font-bold bg-primary text-white shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
                  >
                    {editingId ? 'Simpan Perubahan' : 'Tambah Data'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
