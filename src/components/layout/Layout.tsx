/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserSquare2, 
  BookOpen, 
  DoorOpen, 
  CalendarDays,
  LogOut,
  Menu,
  X,
  User
} from 'lucide-react';
// Authentication removed for dev: app shows dashboard without login
import { motion, AnimatePresence } from 'motion/react';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Mahasiswa', path: '/mahasiswa', icon: Users },
  { name: 'Dosen', path: '/dosen', icon: UserSquare2 },
  { name: 'Mata Kuliah', path: '/matakuliah', icon: BookOpen },
  { name: 'Kelas', path: '/kelas', icon: DoorOpen },
  { name: 'Jadwal', path: '/jadwal', icon: CalendarDays },
];

export default function Layout({ children }: LayoutProps) {
  const user = { name: 'Admin', email: 'admin@local', picture: null } as any;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Desktop Sidebar */}
      <aside 
        className={`hidden lg:flex flex-col fixed inset-y-0 left-0 z-50 glass border-r-0 transition-all duration-300 ${isSidebarOpen ? 'w-72' : 'w-20'}`}
      >
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shrink-0">
            <BookOpen className="text-white w-6 h-6" />
          </div>
          {isSidebarOpen && <span className="text-xl font-bold truncate">Akademik</span>}
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all ${
                  isActive 
                    ? 'bg-primary text-white shadow-lg shadow-primary/25' 
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {isSidebarOpen && <span className="font-medium">{item.name}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200/50">
          {/* No auth in dev — show placeholder */}
          <div className="text-slate-400 text-sm">Signed in as Admin</div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-72' : 'lg:ml-20'}`}>
        <header className="sticky top-0 z-40 bg-bg/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-slate-200/50">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 lg:flex hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <button 
              className="lg:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-500"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-semibold capitalize">
              {navItems.find(n => n.path === location.pathname)?.name || 'Detail'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 overflow-hidden">
              {user.picture ? (
                <img src={user.picture} alt={user.name || ''} referrerPolicy="no-referrer" />
              ) : (
                <User className="text-primary w-6 h-6" />
              )}
            </div>
          </div>
        </header>

        <div className="p-6 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {!isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(true)}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 lg:hidden"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
