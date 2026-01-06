// src/services/api.js
import axios from 'axios';
import { API_CONFIG, StorageManager } from '../utils/constants';

// Base URL will be: http://localhost:8000/api
const api = axios.create({
  baseURL: `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}`,
});

// Add JWT token from StorageManager to every request if available
api.interceptors.request.use(
  (config) => {
    const token = StorageManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;

/**
 * Admin helpers used in AdminDashboard.jsx
 * These map to the admin router mounted with prefix="/api"
 */

// Dashboard & lists
export const fetchAdminStatistics = () => api.get('/admin/statistics');

export const fetchAdminUsers = () => api.get('/admin/users');

export const fetchAdminPatients = () => api.get('/admin/patients');

export const fetchAdminDoctors = () => api.get('/admin/doctors');

export const fetchAdminAppointments = () => api.get('/admin/appointments');

// User management
export const updateUserRole = (userId, role) =>
  api.put(`/admin/users/${userId}/role`, { role });

export const deleteUser = (userId) => api.delete(`/admin/users/${userId}`);

// NEW: fetch full profile for a user (admin only)
export const fetchAdminUserProfile = (userId) =>
  api.get(`/admin/users/${userId}/profile`);

export const deletePatient = (patientId) =>
  api.delete(`/admin/patients/${patientId}`);

export const deleteDoctor = (doctorId) =>
  api.delete(`/admin/doctors/${doctorId}`);

// Appointments
export const deleteAppointment = (appointmentId) =>
  api.delete(`/admin/appointments/${appointmentId}`);

// NEW: Admin can reschedule and edit appointment (date/time, reason, notes, status)
export const adminUpdateAppointment = (appointmentId, data) =>
  api.put(`/appointments/${appointmentId}`, data);

// NEW: Admin (and doctor) can change appointment status
export const adminUpdateAppointmentStatus = (appointmentId, data) =>
  api.put(`/appointments/${appointmentId}/status`, data);

/**
 * Lab assistant helpers
 * These map to lab_assistant router mounted with prefix="/api/lab"
 */

// Lab assistant: patient details + PDF
export const fetchLabPatientDetails = (patientId) =>
  api.get(`/lab/patients/${patientId}/details`);

export const downloadLabPatientPdf = (patientId) =>
  api.get(`/lab/patients/${patientId}/download-pdf`, {
    responseType: 'blob',
  });
