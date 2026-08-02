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

export const getBaseUrl = () => {
    return '';
};

export const updateProfile = (formData) => API.put('/auth/profile', formData, {
    headers: {
        'Content-Type': 'multipart/form-data',
    },
});
