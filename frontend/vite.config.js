import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development, Vite forwards API and WebSocket calls to the backend container.
// In production, the gateway does this job instead, and this file is not used.
const target = process.env.VITE_PROXY_TARGET ?? 'http://localhost:3000';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,          // listen on all interfaces, so the container port is reachable
    port: 5173,
    proxy: {
      '/api': target,
      '/socket.io': { target, ws: true },   // ws: true allows the WebSocket upgrade
    },
  },
});


