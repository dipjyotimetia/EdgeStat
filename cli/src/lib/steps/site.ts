export interface FirstSiteResult {
  id: string;
  domain: string;
  snippet: string;
}

export async function createFirstSite(
  workerUrl: string,
  masterKey: string,
  name: string,
  domain: string
): Promise<FirstSiteResult> {
  const res = await fetch(`${workerUrl}/api/sites`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${masterKey}`,
    },
    body: JSON.stringify({ name, domain }),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(`Failed to create site (${res.status}): ${err.error ?? res.statusText}`);
  }

  const data = (await res.json()) as { site: { id: string }; snippet: string };
  return { id: data.site.id, domain, snippet: data.snippet };
}

/** Derive a human-readable default site name from a workers.dev URL.
 *  "https://edgestat.alice.workers.dev" → "Edgestat" */
export function defaultSiteName(workerUrl: string): string {
  try {
    const host = new URL(workerUrl).hostname; // edgestat.alice.workers.dev
    const subdomain = host.split('.')[0]; // edgestat
    return subdomain.charAt(0).toUpperCase() + subdomain.slice(1);
  } catch {
    return 'My Website';
  }
}
