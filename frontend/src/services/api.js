import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg = err.response?.data?.error || 'Something went wrong. Check your connection.';
    return Promise.reject(new Error(msg));
  }
);

export const partyAPI = {
  getAll:  ()         => api.get('/parties'),
  getById: (id)       => api.get(`/parties/${id}`),
  create:  (data)     => api.post('/parties', data),
  update:  (id, data) => api.put(`/parties/${id}`, data),
  delete:  (id)       => api.delete(`/parties/${id}`),
};

export const itemAPI = {
  getAll:  (category) => api.get('/items', { params: category ? { category } : undefined }),
  getById: (id)       => api.get(`/items/${id}`),
  create:  (data)     => api.post('/items', data),
  update:  (id, data) => api.put(`/items/${id}`, data),
  delete:  (id)       => api.delete(`/items/${id}`),
};

export const contractAPI = {
  getAll:  ()         => api.get('/contracts'),
  getById: (id)       => api.get(`/contracts/${id}`),
  create:  (data)     => api.post('/contracts', data),
  update:  (id, data) => api.put(`/contracts/${id}`, data),
  delete:  (id)       => api.delete(`/contracts/${id}`),
};

export const transactionAPI = {
  getAll:  ()         => api.get('/transactions'),
  getById: (id)       => api.get(`/transactions/${id}`),
  create:  (data)     => api.post('/transactions', data),
  update:  (id, data) => api.put(`/transactions/${id}`, data),
  delete:  (id)       => api.delete(`/transactions/${id}`),
};
