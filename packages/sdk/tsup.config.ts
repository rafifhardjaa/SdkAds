import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    sdk: 'src/index.ts',
  },
  format: ['iife'],
  minify: true,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  dts: true,
  outExtension() {
    return {
      js: '.min.js',
    };
  },
});
