import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom'],
  esbuildOptions(options) {
    options.jsx = 'automatic'
  },
  async onSuccess() {
    // Copy CSS to dist
    const fs = await import('fs')
    fs.copyFileSync('src/styles.css', 'dist/styles.css')
    console.log('CSS copied to dist/styles.css')
  },
})
