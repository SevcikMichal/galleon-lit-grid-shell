import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: {
        'galleon-lit-grid-shell': resolve(__dirname, 'src/index.ts'),
        'galleon-viewport': resolve(__dirname, 'src/components/galleon-viewport/galleon-viewport.ts'),
        'galleon-inventory': resolve(__dirname, 'src/components/galleon-inventory/galleon-inventory.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        'lit',
        'lit/decorators.js',
        'lit/directives/repeat.js',
        'lit/directives/class-map.js',
        'lit/directives/style-map.js',
        '@polyfea/core',
      ],
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
      },
    },
    sourcemap: true,
    minify: false,
  },
  test: {
    environment: 'happy-dom',
    include: ['tests/unit/**/*.test.ts'],
  },
});
