// src/adminInterface/src/services/authService.js
import { axiosInstance } from './axiosConfig';

const authService = {
    login: async (email, password) => {
        try {
            console.log('🚀 Login attempt:', { email });
            
            const response = await axiosInstance.post('/auth/login', { 
                email, 
                password 
            });
            
            console.log('📦 Server response:', {
                status: response.data.status,
                hasUser: !!response.data.data?.user
            });
    
            if (response.data.status === 'success' && response.data.data?.user) {
                const { user } = response.data.data;
                
                // Salviamo solo i dati utente non sensibili
                const userData = {
                    ...user,
                    isAuthenticated: true
                };
                
                localStorage.setItem('userData', JSON.stringify(userData));
                return response.data;
            }
            
            throw new Error('Risposta non valida dal server');
        } catch (error) {
            console.error('❌ Login error:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            throw error;
        }
    },

    logout: async () => {
        try {
            await axiosInstance.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('userData');
            window.location.href = '/login';
        }
    },

    getCurrentUser: () => {
        try {
            const userData = localStorage.getItem('userData');
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('Error getting user data:', error);
            return null;
        }
    },

    updateUserData: (userData) => {
        try {
            const currentUser = authService.getCurrentUser();
            if (currentUser) {
                const updatedUser = { ...currentUser, ...userData };
                localStorage.setItem('userData', JSON.stringify(updatedUser));
            }
        } catch (error) {
            console.error('Error updating user data:', error);
        }
    },

    verifySession: async () => {
        try {
            const response = await axiosInstance.get('/auth/verify');
            return response.data.status === 'success';
        } catch (error) {
            console.error('Session verification error:', error);
            return false;
        }
    },


    handleAuthError: async (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('userData');
            window.location.href = '/unauthorized';
        }
        return Promise.reject(error);
    }
};

export default authService;