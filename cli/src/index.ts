#!/usr/bin/env node
import { Command } from 'commander';
import { setup } from './commands/setup.js';
import { cleanup } from './commands/cleanup.js';

const program = new Command()
  .name('edgestat')
  .description('EdgeStat CLI — Analytics at the edge. Owned by you.')
  .version('0.1.0');

program
  .command('setup')
  .description('Provision all Cloudflare resources and deploy EdgeStat')
  .option('--skip-deploy', 'Provision resources without building/deploying')
  .option('--dry-run', 'Print commands without executing')
  .action(setup);

program
  .command('cleanup')
  .description('Delete all EdgeStat resources from your Cloudflare account')
  .option('--force', 'Skip confirmation prompt')
  .option('--dry-run', 'Show what would be deleted without deleting')
  .action(cleanup);

program.parse();
