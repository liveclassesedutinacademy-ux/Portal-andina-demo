import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    // node:sqlite todavía emite un aviso experimental en Node 22; se oculta para que la salida sea legible.
    execArgv: ['--disable-warning=ExperimentalWarning'],
  },
});
