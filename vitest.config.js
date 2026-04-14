import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react({
      include: /\.(jsx|js)$/,
    })
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './vitest.setup.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/hooks/**/*.js', 
        'src/app/locales.js', 
        'src/components/generator/Step1.jsx'
      ],
      exclude: ['node_modules/', '.next/'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 40,
        statements: 80
      }
    },
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
