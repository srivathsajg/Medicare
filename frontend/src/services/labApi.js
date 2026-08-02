import axios from 'axios';

const API = axios.create({
    baseURL: '/api',
});

API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

API.interceptors.response.use(
    (response) => response.data,
    (error) => Promise.reject(error)
);

export const fetchLabPatients = () => API.get('/lab/patients');
export const fetchLabTests = () => API.get('/lab/tests');
export const createLabOrder = (data) => API.post('/lab/orders', data);
export const fetchLabOrders = () => API.get('/lab/orders');
export const fetchCompletedLabOrders = () => API.get('/lab/orders/completed');

export const uploadLabReport = (formData) => API.post('/lab/upload-report', formData);
