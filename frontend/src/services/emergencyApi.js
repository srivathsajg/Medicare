import api from './axiosInstance';

const BASE = '/emergency';

export const getMyEmergencyCases = (params = {}) =>
    api.get(`${BASE}/cases`, { params }).then((r) => r.data);

export const getEmergencyCaseById = (id) =>
    api.get(`${BASE}/cases/${id}`).then((r) => r.data);

export const cancelEmergencyCase = (id, cancelledReason) =>
    api.post(`${BASE}/cases/${id}/cancel`, { cancelledReason }).then((r) => r.data);

export const createEmergencyCase = (data) =>
    api.post(`${BASE}/cases`, data).then((r) => r.data);

export const updateEmergencyStatus = (id, status, cancelledReason) =>
    api.patch(`${BASE}/cases/${id}/status`, { status, cancelledReason }).then((r) => r.data);

export const updateEmergencyDetails = (id, data) =>
    api.patch(`${BASE}/cases/${id}`, data).then((r) => r.data);

export default api;
