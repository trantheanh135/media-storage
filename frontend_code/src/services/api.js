import axios from 'axios';
import keycloak from './keycloak';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000,
});

api.interceptors.request.use(
  (config) => {
    const token = keycloak.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        await keycloak.refreshToken(30);
        const originalRequest = error.config;
        originalRequest.headers.Authorization = `Bearer ${keycloak.token}`;
        return api(originalRequest);
      } catch (refreshError) {
        keycloak.logout();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  getCurrentUser: () => {
    return api.get('/auth/me');
  },

  getUserInfo: () => {
    return api.get('/auth/info');
  },
};

export const groupAPI = {
  getGroups: () => {
    return api.get('/groups');
  },

  createGroup: (name, description) => {
    return api.post('/groups', { name, description });
  },

  getGroupById: (groupId) => {
    return api.get(`/groups/${groupId}`);
  },

  deleteGroup: (groupId) => {
    return api.delete(`/groups/${groupId}`);
  },

  addMember: (groupId, userId) => {
    return api.post(`/groups/${groupId}/members/${userId}`);
  },

  removeMember: (groupId, userId) => {
    return api.delete(`/groups/${groupId}/members/${userId}`);
  },
};

export const mediaAPI = {
  uploadFile: (file, groupId, description = '') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('groupId', groupId);
    if (description) {
      formData.append('description', description);
    }
    return api.post('/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  getGroupFiles: (groupId, page = 0, size = 12) => {
    return api.get(`/media/${groupId}?page=${page}&size=${size}`);
  },

  getGroupFilesByType: (groupId, type, page = 0, size = 12) => {
    return api.get(`/media/${groupId}/type/${type}?page=${page}&size=${size}`);
  },

  searchGroupFiles: (groupId, filename, page = 0, size = 12) => {
    return api.get(`/media/${groupId}/search?filename=${filename}&page=${page}&size=${size}`);
  },

  getFileById: (groupId, id) => {
    return api.get(`/media/${groupId}/file/${id}`);
  },

  downloadFile: (groupId, id) => {
    return api.get(`/media/${groupId}/file/${id}/download`, {
      responseType: 'blob',
    });
  },

  deleteFile: (groupId, id) => {
    return api.delete(`/media/${groupId}/file/${id}`);
  },
};

export const adminAPI = {
  getDashboard: () => {
    return api.get('/admin/dashboard');
  },

  getAllFiles: (page = 0, size = 12) => {
    return api.get(`/admin/files?page=${page}&size=${size}`);
  },

  getFilesByType: (type, page = 0, size = 12) => {
    return api.get(`/admin/files/type/${type}?page=${page}&size=${size}`);
  },

  searchAllFiles: (filename, page = 0, size = 12) => {
    return api.get(`/admin/files/search?filename=${filename}&page=${page}&size=${size}`);
  },

  downloadFile: (fileId) => {
    return api.get(`/admin/files/${fileId}/download`, {
      responseType: 'blob',
    });
  },

  deleteFile: (fileId) => {
    return api.delete(`/admin/files/${fileId}`);
  },

  getAdminInfo: () => {
    return api.get('/admin/info');
  },
};

export default api;
