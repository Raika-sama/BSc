import axios from 'axios';

const API_URL = 'http://localhost:5000/api/v1';

export const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true // Importante per la gestione dei cookies
});

// Flag per tracciare se stiamo già facendo un refresh
let isRefreshing = false;
// Coda di richieste in attesa
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    
    failedQueue = [];
};

const setupAxiosInterceptors = () => {
    axiosInstance.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config;

            if (error.response?.status !== 401 || 
                originalRequest.url === '/auth/refresh-token' || 
                originalRequest._retry) {
                return Promise.reject(error);
            }

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                .then(() => axiosInstance(originalRequest))
                .catch(err => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                console.log('Attempting token refresh');
                const response = await axiosInstance.post('/auth/refresh-token', {}, {
                    withCredentials: true
                });
                
                console.log('Refresh response:', {
                    status: response.data.status,
                    hasAccessToken: !!response.data.data?.accessToken
                });
            
                if (response.data.status === 'success') {
                    const { accessToken } = response.data.data;
                    // Aggiorna il token nelle richieste future
                    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
                    processQueue(null);
                    return axiosInstance(originalRequest);
                }
                throw new Error('Refresh token failed');
            } catch (refreshError) {
                console.error('Refresh token error:', refreshError);
                processQueue(refreshError);
                // Pulisci lo storage e reindirizza
                localStorage.removeItem('userData');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }
    );
};

export default setupAxiosInterceptors;