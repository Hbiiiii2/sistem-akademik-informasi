/**
 * API Client untuk komunikasi dengan MongoDB Backend
 */

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface ApiErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
}

export function handleApiError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: ApiErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  };
  console.error('API Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Generic API functions
async function apiCall<T>(
  method: string,
  endpoint: string,
  data?: any
): Promise<T> {
  try {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Add authorization token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
      };
    }

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    handleApiError(error, OperationType.WRITE, endpoint);
    throw error;
  }
}

// Mahasiswa API
export const mahasiswaApi = {
  getAll: () => apiCall<any[]>('GET', '/mahasiswa'),
  getById: (id: string) => apiCall<any>('GET', `/mahasiswa/${id}`),
  create: (data: any) => apiCall<any>('POST', '/mahasiswa', data),
  update: (id: string, data: any) => apiCall<any>('PUT', `/mahasiswa/${id}`, data),
  delete: (id: string) => apiCall<any>('DELETE', `/mahasiswa/${id}`),
};

// Dosen API
export const dosenApi = {
  getAll: () => apiCall<any[]>('GET', '/dosen'),
  getById: (id: string) => apiCall<any>('GET', `/dosen/${id}`),
  create: (data: any) => apiCall<any>('POST', '/dosen', data),
  update: (id: string, data: any) => apiCall<any>('PUT', `/dosen/${id}`, data),
  delete: (id: string) => apiCall<any>('DELETE', `/dosen/${id}`),
};

// Matakuliah API
export const matakuliahApi = {
  getAll: () => apiCall<any[]>('GET', '/matakuliah'),
  getById: (id: string) => apiCall<any>('GET', `/matakuliah/${id}`),
  create: (data: any) => apiCall<any>('POST', '/matakuliah', data),
  update: (id: string, data: any) => apiCall<any>('PUT', `/matakuliah/${id}`, data),
  delete: (id: string) => apiCall<any>('DELETE', `/matakuliah/${id}`),
};

// Kelas API
export const kelasApi = {
  getAll: () => apiCall<any[]>('GET', '/kelas'),
  getById: (id: string) => apiCall<any>('GET', `/kelas/${id}`),
  create: (data: any) => apiCall<any>('POST', '/kelas', data),
  update: (id: string, data: any) => apiCall<any>('PUT', `/kelas/${id}`, data),
  delete: (id: string) => apiCall<any>('DELETE', `/kelas/${id}`),
};

// Jadwal API
export const jadwalApi = {
  getAll: () => apiCall<any[]>('GET', '/jadwal'),
  getById: (id: string) => apiCall<any>('GET', `/jadwal/${id}`),
  create: (data: any) => apiCall<any>('POST', '/jadwal', data),
  update: (id: string, data: any) => apiCall<any>('PUT', `/jadwal/${id}`, data),
  delete: (id: string) => apiCall<any>('DELETE', `/jadwal/${id}`),
};

// Health check
export const healthCheck = () => apiCall<any>('GET', '/health');
