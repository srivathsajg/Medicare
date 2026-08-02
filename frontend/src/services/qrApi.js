import axios from 'axios';
import { getBaseUrl } from './userApi';

const API_URL = `${getBaseUrl()}/api/qr`;

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };
};

export const generateQR = async (expiryMinutes = 60) => {
    try {
        const response = await axios.post(`${API_URL}/generate`, { expiryMinutes }, getAuthHeaders());
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const expireQR = async (token) => {
    try {
        const response = await axios.post(`${API_URL}/expire/${token}`, {}, getAuthHeaders());
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const validateQRToken = async (token) => {
    try {
        const response = await axios.get(`${API_URL}/validate/${token}`, getAuthHeaders());
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const fetchPatientDataByQRToken = async (token) => {
    try {
        const response = await axios.get(`${API_URL}/patient/${token}`, getAuthHeaders());
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};
