import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

export default defineConfig(({ mode }) => ({
  base: loadEnv(mode, process.cwd(), 'VITE_').VITE_BASE_PATH || '/',
  resolve: {
    alias: {
      'axios/lib/core/createError': fileURLToPath(
        new URL('./src/objectStorage/axiosLegacyError.ts', import.meta.url),
      ),
    },
  },
  plugins: [
    tailwindcss(),
    react({
      babel: {
        plugins: [
          ['@babel/plugin-proposal-decorators', { version: 'legacy' }],
          ['@babel/plugin-transform-class-properties', { loose: false }],
        ],
      },
    }),
  ],
  build: {
    target: 'es2022',
    sourcemap: false,
    rollupOptions: {
      onwarn(warning, warn) {
        if (
          warning.code === 'MODULE_LEVEL_DIRECTIVE' &&
          warning.message.includes('use client')
        )
          return;
        warn(warning);
      },
    },
  },
  optimizeDeps: {
    entries: ['index.html'],
    esbuildOptions: { target: 'es2022' },
    include: [
      'comlink',
      'react-router-dom',
      'react',
      'react/jsx-runtime',
      'react-dom',
      'react-dom/client',
      'react-dom/server',
      'antd',
      'antd/es/form/FormItem',
      'antd/es/locale/zh_CN',
      'antd/es/locale/en_US',
      'antd/lib/checkbox/Checkbox',
      'mobx',
      'mobx-react',
      'i18next',
      'react-is',
    ],
  },
}));
