// src/adminInterface/src/services/authService.js
import { axiosInstance } from './axiosConfig';

const authService = {
    login: async (email, password) => {
        try {
            const response = await axiosInstance.post('/auth/login', { 
                email, 
                password 
            });
            
            if (response.data.token) {
                localStorage.setItem('user', JSON.stringify(response.data));
            }
            return response.data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    logout: async () => {
        try {
            await axiosInstance.post('/auth/logout');
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

    isAuthenticated: () => {
        const user = authService.getCurrentUser();
        return !!user && !!user.token;
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