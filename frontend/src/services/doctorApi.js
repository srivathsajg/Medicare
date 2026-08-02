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

// Response interceptor to return data directly
API.interceptors.response.use(
    (response) => response.data,
    (error) => Promise.reject(error)
);

export const fetchDoctorOverview = () => API.get('/doctor/overview');

export const fetchAvailability = () => API.get('/doctor/availability');

export const createAvailability = (data) => API.post('/doctor/availability', data);

export const deleteAvailability = (id) => API.delete(`/doctor/availability/${id}`);

export const fetchPatients = () => API.get('/doctor/patients');

export const createMedicalRecord = (recordData) => API.post('/doctor/create-record', recordData);

export const createPrescription = (prescriptionData) => API.post('/doctor/create-prescription', prescriptionData);

export const fetchDoctorAppointments = () => API.get('/doctor/appointments');

export const updateAppointmentStatus = (id, status) => API.patch(`/doctor/update-appointment/${id}`, { status });

export const fetchPatientHistory = (patientId) => API.get(`/records/patient-history/${patientId}`);

export const fetchPendingRecords = () => API.get('/doctor/pending-records');

export const verifyRecord = (recordId) => API.patch(`/doctor/verify-record/${recordId}`);

export const updateDoctorDelay = (delayData) => API.patch('/doctor/update-delay', delayData);

export const fetchAdmittedPatients = () => API.get('/doctor/admitted-patients');

export const issueAdmissionCertificate = (patientId, data) => API.patch(`/doctor/issue-certificate/${patientId}`, data);
