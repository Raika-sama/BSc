// src/adminInterface/src/services/axiosConfig.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/v1';  // Questo è corretto perché combacia con app.js

export const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

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
        (error) => {
            if (error.response?.status === 401) {
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
            return Promise.reject(error);
        }
    );
};

export default setupAxiosInterceptors;