import axios from 'axios';

// Si existe la variable en Vercel, la usa y le añade '/api'. Si no, usa localhost para tu laptop.
const baseURL = import.meta.env.VITE_API_BASE_URL 
    ? `${import.meta.env.VITE_API_BASE_URL}/api` 
    : 'http://127.0.0.1:8000/api';

const API = axios.create({
    baseURL: baseURL,
    timeout: 15000, // 15 segundos de tolerancia por si Render está "despertando" de su cold start
});

export default API;