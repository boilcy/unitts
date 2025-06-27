import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    reporters: ['verbose', 'json'],
    outputFile: {
      json: './test_results/json-report.json',
    },
  },
});
