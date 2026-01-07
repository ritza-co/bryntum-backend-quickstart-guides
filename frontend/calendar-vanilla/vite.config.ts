import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 5173
  },
  optimizeDeps: {
    include: ['@bryntum/calendar', '@bryntum/calendar-react']
  }
})