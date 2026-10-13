import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    setupNodeEvents() {
      // configurar eventos de Cypress aquí
    },
    baseUrl: 'http://localhost:5173',
  },
});
