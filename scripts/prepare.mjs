/**
 * Installs the git hooks after `pnpm install`, but only where hooks make sense:
 * a checkout with a .git directory, outside CI and build containers.
 * Railway and GitHub Actions install from a plain export, where `lefthook install`
 * would fail the whole install.
 */
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const skip =
  process.env.CI === 'true' ||
  process.env.LEFTHOOK === '0' ||
  process.env.RAILWAY_ENVIRONMENT !== undefined ||
  !existsSync('.git');

if (!skip) {
  const result = spawnSync('pnpm', ['exec', 'lefthook', 'install'], { stdio: 'inherit' });
  process.exit(result.status ?? 1);
}
