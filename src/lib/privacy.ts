const SALT_KEY = 'salt:current';
const SALT_PREVIOUS_KEY = 'salt:previous';

export function stripIpLastOctet(ip: string): string {
  if (ip.includes(':')) {
    // IPv6: zero last 64 bits
    const parts = ip.split(':');
    return parts.slice(0, 4).join(':') + ':0:0:0:0';
  }
  // IPv4: zero last octet
  const parts = ip.split('.');
  parts[3] = '0';
  return parts.join('.');
}

export async function generateSessionId(
  ip: string,
  userAgent: string,
  salt: string
): Promise<string> {
  const strippedIp = stripIpLastOctet(ip);
  const data = `${strippedIp}|${userAgent}|${salt}`;
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  const hashArray = new Uint8Array(hashBuffer);
  // Truncate to 16 hex chars (64 bits) - sufficient for session grouping
  return Array.from(hashArray.slice(0, 8))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function getCurrentSalt(kv: KVNamespace): Promise<string> {
  const salt = await kv.get(SALT_KEY);
  if (salt) return salt;
  // First run: generate and store a salt
  const newSalt = crypto.randomUUID() + crypto.randomUUID();
  await kv.put(SALT_KEY, newSalt);
  return newSalt;
}

export async function rotateSalt(kv: KVNamespace): Promise<void> {
  const oldSalt = await kv.get(SALT_KEY);
  const newSalt = crypto.randomUUID() + crypto.randomUUID();

  if (oldSalt) {
    // Keep old salt for 30 min overlap to handle in-flight requests
    await kv.put(SALT_PREVIOUS_KEY, oldSalt, { expirationTtl: 1800 });
  }
  await kv.put(SALT_KEY, newSalt);
}
