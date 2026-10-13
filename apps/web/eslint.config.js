import { nextConfig } from '@inkwell/config/eslint/next';

export default [
  ...nextConfig,
  {
    ignores: ['.next/**', 'public/sw.js', 'next-env.d.ts', 'scripts/**'],
  },
];
