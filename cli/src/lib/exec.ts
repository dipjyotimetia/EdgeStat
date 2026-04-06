import { execSync } from 'node:child_process';

export interface ExecOptions {
  input?: string;
  cwd?: string;
}

export class ExecError extends Error {
  constructor(
    message: string,
    public readonly stderr: string = '',
    public readonly stdout: string = '',
  ) {
    super(message);
    this.name = 'ExecError';
  }
}

export function exec(command: string, opts: ExecOptions = {}): string {
  try {
    return execSync(command, {
      encoding: 'utf-8',
      cwd: opts.cwd,
      input: opts.input,
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch (err) {
    const e = err as Error & { stderr?: string; stdout?: string };
    // Include only the last 500 chars of stdout — full output can be thousands of lines
    const stdoutSnippet = e.stdout?.trim().slice(-500);
    throw new ExecError(
      [e.message, e.stderr, stdoutSnippet].filter(Boolean).join('\n'),
      e.stderr ?? '',
      e.stdout ?? '',
    );
  }
}

export function errorContains(e: unknown, substring: string): boolean {
  if (e instanceof ExecError) {
    return (e.message + e.stderr).toLowerCase().includes(substring.toLowerCase());
  }
  return String(e).toLowerCase().includes(substring.toLowerCase());
}

/** Try to extract a UUID from an error message (wrangler often includes the existing ID) */
export function extractUuidFromError(e: unknown): string | undefined {
  const text = e instanceof ExecError ? e.message + e.stderr : String(e);
  const match = text.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/);
  return match?.[1];
}

/** Safely parse JSON, stripping any non-JSON prefix (wrangler sometimes outputs warnings before JSON) */
export function safeJsonParse<T>(text: string): T {
  const arrayStart = text.indexOf('[');
  const objectStart = text.indexOf('{');
  const start = arrayStart >= 0 && objectStart >= 0
    ? Math.min(arrayStart, objectStart)
    : Math.max(arrayStart, objectStart);

  if (start < 0) throw new Error(`No JSON found in output: ${text.slice(0, 200)}`);
  return JSON.parse(text.slice(start)) as T;
}
