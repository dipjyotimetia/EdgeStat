import { exec } from '../exec.js';
import { brand, log } from '../colors.js';

export async function checkPrerequisites(dryRun: boolean): Promise<void> {
  try {
    const version = exec('wrangler --version');
    log.success(`Wrangler ${version.replace(/\n.*/s, '')} detected`);
  } catch {
    throw new Error('Wrangler not found. Run: npm install -g wrangler');
  }

  if (dryRun) {
    log.info('Dry run — skipping auth check');
    return;
  }

  try {
    const whoami = exec('wrangler whoami');
    const emailMatch = whoami.match(/(\S+@\S+\.\S+)/);
    log.success(`Logged in as ${brand.mint(emailMatch?.[1] ?? 'authenticated')}`);
  } catch {
    throw new Error('Not logged in to Cloudflare. Run: wrangler login');
  }
}
