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
        console.error('Pharmacy API Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

// Pharmacy Order Endpoints
export const fetchPendingOrders = () => API.get('/pharmacy/pending');
export const fetchPharmacistOrders = () => API.get('/pharmacy/pharmacist');
export const updateOrderStatus = (id, status, extraData = {}) => API.patch(`/pharmacy/status/${id}`, { status, ...extraData });
export const updateOrderById = (id, data) => API.put(`/pharmacy/update-status/${id}`, data);
export const fetchAvailableDeliveryStaff = () => API.get('/pharmacy/delivery-staff');

// Inventory Endpoints
export const fetchInventory = () => API.get('/inventory');
export const fetchLowStock = () => API.get('/inventory/low-stock');

// Overview / Stats (Could be derived from orders or a separate endpoint if exists)
export const fetchPharmacyOverview = async () => {
    try {
        const pending = await fetchPendingOrders();
        const myOrders = await fetchPharmacistOrders();
        const inventory = await fetchInventory();
        const lowStock = await fetchLowStock();
        
        // Stats based on available data
        return {
            success: true,
            data: {
                incomingCount: pending.data?.length || 0,
                toBePrepared: pending.data?.filter(o => o.status === 'processing' || o.status === 'preparing').length || 0,
                readyCount: myOrders.data?.filter(o => o.status === 'ready').length || 0,
                historyCount: myOrders.data?.filter(o => o.status === 'delivered' || o.status === 'dispatched').length || 0,
                lowStockCount: lowStock.data?.length || 0,
                inventory: inventory.data || []
            }
        };
    } catch (error) {
        throw error;
    }
};
