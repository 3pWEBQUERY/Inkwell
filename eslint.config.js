import { nextConfig } from '@inkwell/config/eslint/next';
import { nodeConfig } from '@inkwell/config/eslint/node';

/**
 * Root entry so the pre-commit hook can lint staged files from any package.
 * Each app also has its own eslint.config.js for `pnpm --filter <app> lint`.
 */
const scoped = (configs, files) =>
  configs.map((config) => {
    const keys = Object.keys(config);
    if (keys.length === 1 && keys[0] === 'ignores') return config;
    return { ...config, files: config.files ?? files };
  });

export default [
  ...scoped(nodeConfig, ['apps/api/**/*.ts', 'packages/**/*.ts', '.railway/**/*.ts']),
  ...scoped(nextConfig, ['apps/web/**/*.{ts,tsx}']),
];
