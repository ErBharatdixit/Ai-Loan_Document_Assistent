import axios from 'axios';

// Create custom Axios instance
// In development, Vite proxy handles /api -> localhost:5000
// In production, VITE_API_URL points to the deployed backend
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 120000 // 120 seconds (Render free tier can take 30-60s to wake up)
});

// Request interceptor to attach JWT token and custom Gemini Key
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    const customKey = localStorage.getItem('gemini_api_key');
    if (customKey) {
      config.headers['x-gemini-key'] = customKey;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: async (name, email, password) => {
    const response = await api.post('/api/auth/register', { name, email, password });
    return response.data;
  },
  login: async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  }
};

export const documentAPI = {
  upload: async (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress
    });
    return response.data;
  },
  getAll: async () => {
    const response = await api.get('/api/documents');
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/api/documents/${id}`);
    return response.data;
  }
};

export const aiAPI = {
  chat: async (message, documentId = null, language = 'English') => {
    const response = await api.post('/api/chat', { message, documentId, language });
    return response.data;
  },
  getHistory: async () => {
    const response = await api.get('/api/chat/history');
    return response.data;
  },
  clearHistory: async () => {
    const response = await api.delete('/api/chat/history');
    return response.data;
  },
  checkEligibility: async (profile) => {
    const response = await api.post('/api/eligibility', profile);
    return response.data;
  },
  checkMissingDocs: async (schemeName, requiredDocs, uploadedDocIds) => {
    const response = await api.post('/api/missing-docs', { schemeName, requiredDocs, uploadedDocIds });
    return response.data;
  },
  compareLoans: async (loans) => {
    const response = await api.post('/api/compare', { loans });
    return response.data;
  }
};

export default api;
