import { showError } from './utils';
import { getEnv } from './env';
import axios from 'axios';

export const API = axios.create({
  baseURL: getEnv('REACT_APP_SERVER') || '',
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    showError(error);
  }
);
