import axios from 'axios';

// Configurar la URL base apuntando al puerto de tu servidor FastAPI en Python
const API = axios.create({
    baseURL: 'http://127.0.0.1:8000/api',
    timeout: 5000, // Detener la petición si el servidor no responde en 5 segundos
});

export default API;