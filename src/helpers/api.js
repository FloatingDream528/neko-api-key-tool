import { showError } from './utils';
import { getEnv } from './env';
import axios from 'axios';

export const API = axios.create({
  baseURL: getEnv('API_SERVER') || '',
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    showError(error);
  }
);
