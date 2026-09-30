import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react(),
    wasm(),
    nodePolyfills({
      include: ['assert', 'events'],
      globals: { Buffer: true, global: true, process: true },
      protocolImports: true,
    }),
  ],
  build: { target: 'esnext' },
});
