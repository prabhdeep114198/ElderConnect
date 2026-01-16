import { api } from './client';

export const authService = {
    // Authentication
    register: (data: any) => api.post('/v1/auth/register', data, { requiresAuth: false }),
    login: (data: any) => api.post('/v1/auth/login', data, { requiresAuth: false }),
    // Note: refresh usually requires the old token, if it's a bearer token flow it might just be a GET/POST with the header
    refreshToken: () => api.post('/v1/auth/refresh', {}, { requiresAuth: true }),
    logout: () => api.post('/v1/auth/logout', {}, { requiresAuth: true }),

    // Account management
    getProfile: () => api.get('/v1/auth/profile', { requiresAuth: true }), // Simple "me" endpoint
    changePassword: (data: any) => api.patch('/v1/auth/change-password', data, { requiresAuth: true }),
    forgotPassword: (email: string) => api.post('/v1/auth/forgot-password', { email }, { requiresAuth: false }),
    resetPassword: (data: any) => api.post('/v1/auth/reset-password', data, { requiresAuth: false }),

    // Device management (part of Auth controller for some reason in the backend)
    registerDevice: (data: any) => api.post('/v1/auth/devices/register', data, { requiresAuth: true }),
    getDevices: () => api.get('/v1/auth/devices', { requiresAuth: true }),
    deactivateDevice: (deviceId: string) => api.delete(`/v1/auth/devices/${deviceId}`, { requiresAuth: true }),
};
