import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // 🌟 INYECTAR ESTA CONFIGURACIÓN PARA VITEST:
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/components/__tests__/setup.js', // Opcional (para extender jest-dom globalmente)
  },
});