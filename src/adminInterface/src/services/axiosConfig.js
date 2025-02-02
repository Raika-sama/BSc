import axios from 'axios';

const API_URL = 'http://localhost:5000/api/v1';

export const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
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
    axiosInstance.interceptors.request.use(
        (config) => {
            const user = JSON.parse(localStorage.getItem('user'));
            if (user?.token) {
                config.headers.Authorization = `Bearer ${user.token}`;
            }
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );

    axiosInstance.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config;

            // Se l'errore non è 401 o la richiesta era già per il refresh token, rifiuta subito
            if (error.response?.status !== 401 || 
                originalRequest.url === '/auth/refresh-token' ||
                !localStorage.getItem('user')) {
                return Promise.reject(error);
            }

            // Se stiamo già facendo un refresh, accoda questa richiesta
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                .then(token => {
                    originalRequest.headers['Authorization'] = `Bearer ${token}`;
                    return axios(originalRequest);
                })
                .catch(err => {
                    return Promise.reject(err);
                });
            }

            isRefreshing = true;

            try {
                const user = JSON.parse(localStorage.getItem('user'));
                
                if (!user?.refreshToken) {
                    throw new Error('No refresh token available');
                }

                const response = await axios.post(`${API_URL}/auth/refresh-token`, {
                    refreshToken: user.refreshToken
                });

                if (response.data.status === 'success' && response.data.data.token) {
                    const newToken = response.data.data.token;
                    const newRefreshToken = response.data.data.refreshToken;

                    // Aggiorna lo storage
                    localStorage.setItem('user', JSON.stringify({
                        ...user,
                        token: newToken,
                        refreshToken: newRefreshToken
                    }));

                    // Aggiorna l'header della richiesta originale
                    originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                    
                    // Processa la coda con il nuovo token
                    processQueue(null, newToken);
                    
                    return axios(originalRequest);
                } else {
                    throw new Error('Invalid refresh token response');
                }
            } catch (refreshError) {
                processQueue(refreshError, null);
                localStorage.removeItem('user');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }
    );
};

export default setupAxiosInterceptors;