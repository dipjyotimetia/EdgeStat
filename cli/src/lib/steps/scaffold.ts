import { existsSync, unlinkSync, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { exec } from '../exec.js';
import { findProjectRoot, generateWranglerConfig, type WranglerConfigMode } from '../config.js';
import { GITHUB } from '../constants.js';
import { log } from '../colors.js';

export type ScaffoldMode = 'existing' | WranglerConfigMode;

export interface ScaffoldResult {
  mode: ScaffoldMode;
  projectRoot: string;
}

/**
 * Detect context and ensure wrangler.jsonc exists in the project root.
 *
 * 'existing'   — wrangler.jsonc found in walk-up, nothing written
 * 'project'    — no config but src/index.ts present, config generated in CWD
 * 'standalone' — no config, no source; release downloaded + config generated in CWD
 */
export async function scaffold(cwd: string, dryRun: boolean): Promise<ScaffoldResult> {
  const existing = findProjectRoot(cwd);
  if (existing) return { mode: 'existing', projectRoot: existing };

  const isProject = existsSync(resolve(cwd, 'src', 'index.ts'));
  const mode: WranglerConfigMode = isProject ? 'project' : 'standalone';

  if (dryRun) {
    log.info(
      `Would generate wrangler.jsonc (${mode} mode)${
        mode === 'standalone' ? ' after downloading latest GitHub release' : ''
      }`
    );
    return { mode, projectRoot: cwd };
  }

  if (mode === 'standalone') {
    await downloadRelease(cwd);
  }

  generateWranglerConfig(cwd, mode);
  return { mode, projectRoot: cwd };
}

interface GithubAsset {
  name: string;
  browser_download_url: string;
}

interface GithubRelease {
  tag_name: string;
  assets: GithubAsset[];
}

async function downloadRelease(cwd: string): Promise<void> {
  const apiUrl = `https://api.github.com/repos/${GITHUB.owner}/${GITHUB.repo}/releases/latest`;

  let release: GithubRelease;
  try {
    const res = await fetch(apiUrl, {
      headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
    });
    if (!res.ok) throw new Error(`GitHub API responded ${res.status}`);
    release = (await res.json()) as GithubRelease;
  } catch (e) {
    throw new Error(
      `Could not fetch latest release. Check your internet connection or visit ` +
        `github.com/${GITHUB.owner}/${GITHUB.repo}/releases`,
      { cause: e }
    );
  }

  const asset = release.assets.find((a) => a.name === GITHUB.releaseAsset);
  if (!asset) {
    throw new Error(
      `Release ${release.tag_name} does not contain expected asset "${GITHUB.releaseAsset}". ` +
        `Visit github.com/${GITHUB.owner}/${GITHUB.repo}/releases/${release.tag_name} to investigate.`
    );
  }

  const tarPath = resolve(tmpdir(), `edgestat-release-${Date.now()}.tar.gz`);
  try {
    const res = await fetch(asset.browser_download_url);
    if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);
    if (!res.body) throw new Error('Download response has no body');
    await pipeline(res.body, createWriteStream(tarPath));
    exec(`tar -xzf "${tarPath}" -C "${cwd}"`);
  } finally {
    try {
      unlinkSync(tarPath);
    } catch {
      // best-effort cleanup
    }
  }
}
