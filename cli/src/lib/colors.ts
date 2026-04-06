const esc = (r: number, g: number, b: number) => `\x1b[38;2;${r};${g};${b}m`;
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

export const brand = {
  dim:   (s: string) => `${esc(30, 107, 90)}${s}${RESET}`,
  mist:  (s: string) => `${esc(226, 249, 245)}${s}${RESET}`,
  teal:  (s: string) => `${esc(0, 212, 170)}${s}${RESET}`,
  aqua:  (s: string) => `${esc(127, 255, 212)}${s}${RESET}`,
  mint:  (s: string) => `${esc(0, 255, 209)}${s}${RESET}`,
  red:   (s: string) => `${esc(255, 77, 77)}${s}${RESET}`,
  // Bold applies per-segment to avoid ANSI reset conflicts
  boldMist: (s: string) => `${BOLD}${esc(226, 249, 245)}${s}${RESET}`,
  boldTeal: (s: string) => `${BOLD}${esc(0, 212, 170)}${s}${RESET}`,
};

export const log = {
  success: (msg: string) => console.log(`  ${brand.teal('✓')} ${brand.mist(msg)}`),
  info:    (msg: string) => console.log(`  ${brand.aqua(msg)}`),
  error:   (msg: string) => console.log(`  ${brand.red('✗')} ${msg}`),
  cmd:     (msg: string) => console.log(`  ${brand.dim('$')} ${brand.mist(msg)}`),
  blank:   () => console.log(),
};
