import axios from 'axios';
import { getEnv } from './env';

export const API = axios.create({
  baseURL: getEnv('API_SERVER') || '',
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);
