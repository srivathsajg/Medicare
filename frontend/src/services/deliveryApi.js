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
    (error) => {
        console.error('Delivery API Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

// Delivery Endpoints
export const fetchPendingDeliveries = () => API.get('/delivery/pending');
export const fetchMyDeliveries = () => API.get('/delivery/my');
export const updateDeliveryStatus = (id, status, location = null) => API.patch(`/delivery/update/${id}`, { status, location });
export const markAsDelivered = (id) => API.put(`/delivery/deliver/${id}`);
export const assignDelivery = (deliveryId, deliveryAgentId) => API.post('/delivery/assign', { deliveryId, deliveryAgentId });
export const fetchPatientActiveDeliveries = () => API.get('/delivery/active');

// Overview / Stats
export const fetchDeliveryOverview = async () => {
    try {
        const myDeliveries = await fetchMyDeliveries();
        
        const active = myDeliveries.data?.filter(d => d.status !== 'delivered').length || 0;
        const inTransit = myDeliveries.data?.filter(d => d.status === 'in_transit').length || 0;
        const deliveredToday = myDeliveries.data?.filter(d => {
            const today = new Date().toDateString();
            return d.status === 'delivered' && new Date(d.updatedAt).toDateString() === today;
        }).length || 0;

        return {
            success: true,
            data: {
                activeCount: active,
                inTransitCount: inTransit,
                deliveredTodayCount: deliveredToday,
                estTime: "1.2h" // Mocked
            }
        };
    } catch (error) {
        throw error;
    }
};
