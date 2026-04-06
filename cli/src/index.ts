import { Command } from 'commander';
import { setup } from './commands/setup.js';

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

program.parse();
