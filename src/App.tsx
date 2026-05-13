/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './views/Dashboard';
import MahasiswaView from './views/Mahasiswa';
import DosenView from './views/Dosen';
import MatakuliahView from './views/Matakuliah';
import KelasView from './views/Kelas';
import JadwalView from './views/Jadwal';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/mahasiswa" element={<MahasiswaView />} />
          <Route path="/dosen" element={<DosenView />} />
          <Route path="/matakuliah" element={<MatakuliahView />} />
          <Route path="/kelas" element={<KelasView />} />
          <Route path="/jadwal" element={<JadwalView />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
