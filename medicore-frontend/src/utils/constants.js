/**
 * Storage Keys - Used for localStorage
 */
export const STORAGE_KEYS = {
  TOKEN: 'access_token',
  USER: 'user_data',
  ROLE: 'user_role',
  EXPIRES_AT: 'token_expires_at'
};

/**
 * API Configuration
 */
export const API_CONFIG = {
  BASE_URL: 'http://localhost:8000',
  API_PREFIX: '/api'
};

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  // Auth
  REGISTER: '/auth/register',
  LOGIN: '/auth/login',
  ME: '/auth/me',
  
  // Patients
  PATIENTS: '/patients',
  PATIENT_ME: '/patients/me',
  PATIENT_BY_ID: (id) => `/patients/${id}`,
  
  // Doctors
  DOCTORS: '/appointments/doctors',
  
  // Appointments
  APPOINTMENTS: '/appointments',
  MY_APPOINTMENTS: '/appointments/my-appointments',
  DOCTOR_APPOINTMENTS: '/appointments/doctor-appointments',
  APPOINTMENT_DETAILS: (id) => `/appointments/${id}`,
  UPDATE_APPOINTMENT_STATUS: (id) => `/appointments/${id}/status`
};

/**
 * User Roles
 */
export const USER_ROLES = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  ADMIN: 'admin',
  LAB_ASSISTANT: 'lab_assistant'
};

/**
 * Appointment Status
 */
export const APPOINTMENT_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

/**
 * Gender Options
 */
export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' }
];

/**
 * Blood Group Options
 */
export const BLOOD_GROUP_OPTIONS = [
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' },
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' }
];

/**
 * Hospital Email Domains
 */
export const VALID_HOSPITAL_DOMAINS = [
  '@hospital.com',
  '@med.com',
  '@clinic.com'
];

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'Unauthorized. Please login again.',
  FORBIDDEN: 'Access denied. You do not have permission.',
  NOT_FOUND: 'Resource not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  INVALID_HOSPITAL_EMAIL: 'Please use a valid hospital email address.',
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters.',
  PASSWORDS_NOT_MATCH: 'Passwords do not match.',
  EMAIL_ALREADY_REGISTERED: 'Email is already registered.'
};

/**
 * Success Messages
 */
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  REGISTER_SUCCESS: 'Registration successful!',
  PROFILE_SAVED: 'Profile saved successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  APPOINTMENT_BOOKED: 'Appointment booked successfully!',
  APPOINTMENT_UPDATED: 'Appointment updated successfully!',
  APPOINTMENT_CANCELLED: 'Appointment cancelled successfully!'
};

/**
 * Routes
 */
export const ROUTES = {
  // Public
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  
  // Patient Routes
  PATIENT_HOME: '/patient/home',
  PATIENT_PROFILE: '/patient/profile',
  PATIENT_APPOINTMENTS: '/patient/appointments',
  
  // Doctor Routes
  DOCTOR_HOME: '/doctor/home',
  DOCTOR_DASHBOARD: '/doctor/dashboard',
  DOCTOR_APPOINTMENTS: '/doctor/appointments',
  
  // Admin Routes
  ADMIN_DASHBOARD: '/admin/dashboard'
};

/**
 * Local Storage Manager
 */
export class StorageManager {
  static setToken(token) {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  }

  static getToken() {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  }

  static removeToken() {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
  }

  static setUser(user) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }

  static getUser() {
    const user = localStorage.getItem(STORAGE_KEYS.USER);
    return user ? JSON.parse(user) : null;
  }

  static setRole(role) {
    localStorage.setItem(STORAGE_KEYS.ROLE, role);
  }

  static getRole() {
    return localStorage.getItem(STORAGE_KEYS.ROLE);
  }

  static isAuthenticated() {
    return !!this.getToken();
  }

  static clearAll() {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.ROLE);
    localStorage.removeItem(STORAGE_KEYS.EXPIRES_AT);
  }

  static isTokenExpired() {
    const expiresAt = localStorage.getItem(STORAGE_KEYS.EXPIRES_AT);
    if (!expiresAt) return false;
    return new Date().getTime() > parseInt(expiresAt);
  }
}

/**
 * Validation Utilities
 */
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
  
  isValidEmail(email) {
    return this.EMAIL_REGEX.test(email);
  },

  isValidPassword(password) {
    return password && password.length >= this.PASSWORD_MIN_LENGTH;
  },

  isValidHospitalEmail(email) {
    const lowerEmail = email.toLowerCase();
    return VALID_HOSPITAL_DOMAINS.some(domain => lowerEmail.endsWith(domain));
  }
};

/**
 * Date Formatting
 */
export const DATE_FORMATS = {
  DISPLAY: 'MMM DD, YYYY',
  DISPLAY_TIME: 'MMM DD, YYYY HH:mm',
  INPUT: 'YYYY-MM-DD',
  ISO: 'YYYY-MM-DDTHH:mm:ss'
};

/**
 * Pagination
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 20, 50]
};

/**
 * Feature Flags (if needed for future)
 */
export const FEATURES = {
  ENABLE_EMAIL_VERIFICATION: false,
  ENABLE_TWO_FACTOR: false,
  ENABLE_NOTIFICATIONS: true
};
