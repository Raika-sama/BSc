// src/adminInterface/src/services/authService.js
import { axiosInstance } from './axiosConfig';

const authService = {
    login: async (email, password) => {
        try {
            const response = await axiosInstance.post('/auth/login', { 
                email, 
                password 
            });
            
            if (response.data.data.token) {
                const userData = {
                    ...response.data.data.user,
                    token: response.data.data.token,
                    refreshToken: response.data.data.refreshToken
                };
                localStorage.setItem('user', JSON.stringify(userData));
            }
            return response.data.data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    logout: async () => {
        try {
            const user = authService.getCurrentUser();
            if (user?.refreshToken) {
                await axiosInstance.post('/auth/logout', {
                    refreshToken: user.refreshToken
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('user');
        }
    },

    getCurrentUser: () => {
        try {
            const user = localStorage.getItem('user');
            return user ? JSON.parse(user) : null;
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    },

    verifyToken: async () => {
        try {
            const response = await axiosInstance.get('/auth/verify');
            return response.data.data.valid;
        } catch (error) {
            console.error('Token verification error:', error);
            return false;
        }
    },

    isAuthenticated: async () => {
        const user = authService.getCurrentUser();
        if (!user || !user.token) return false;
        
        return await authService.verifyToken();
    },

    updateUserInStorage: (userData) => {
        try {
            const currentUser = authService.getCurrentUser();
            if (currentUser) {
                const updatedUser = { ...currentUser, ...userData };
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }
        } catch (error) {
            console.error('Error updating user in storage:', error);
        }
    }
};

export default authService;