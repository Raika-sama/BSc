// src/adminInterface/src/services/authService.js
import { axiosInstance } from './axiosConfig';

const authService = {
    login: async (email, password) => {
        try {
            console.log('🚀 Invio richiesta login con:', { email });
            
            const response = await axiosInstance.post('/auth/login', { 
                email, 
                password 
            });
            
            if (response.data.status === 'success' && response.data.data) {
                const { user, accessToken, refreshToken } = response.data.data;
                
                if (!user || !accessToken) {
                    throw new Error('Dati di autenticazione incompleti');
                }

                // Salva i dati dell'utente usando accessToken invece di token
                const userData = {
                    ...user,
                    token: accessToken, // Manteniamo token per compatibilità
                    accessToken,        // Salviamo anche accessToken
                    refreshToken
                };
                
                localStorage.setItem('user', JSON.stringify(userData));

                // Restituisci i dati strutturati usando la stessa struttura
                return {
                    status: 'success',
                    data: {
                        user,
                        token: accessToken, // Per compatibilità con AuthContext
                        refreshToken
                    }
                };
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