import { defineConfig } from 'vitest/config';

const integration = process.env.RUN_INTEGRATION === '1';

export default defineConfig({
  test: {
    include: integration ? ['test/**/*.test.ts'] : ['test/unit/**/*.test.ts'],
    environment: 'node',
    testTimeout: 20_000,
  },
});
