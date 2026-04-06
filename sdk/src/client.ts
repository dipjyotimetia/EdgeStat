// EdgeStat TypeScript SDK for server-side and mobile usage

export interface EdgeStatConfig {
  endpoint: string;
  siteId: string;
  flushInterval?: number;
  maxBatchSize?: number;
}

/**
 * Event payload for the EdgeStat SDK.
 * IMPORTANT: This interface must stay in sync with `singleEventSchema` in
 * `src/lib/schemas.ts`. All field types and optionality must match.
 * Run `npm run check:schema` from root after changing either.
 */
export interface EventPayload {
  type: 'pageview' | 'custom' | 'web_vital' | 'session_start' | 'session_end';
  url?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  event_name?: string;
  event_props?: Record<string, string | number>;
  vital_name?: 'FCP' | 'LCP' | 'CLS' | 'FID' | 'INP' | 'TTFB';
  vital_value?: number;
  screen_width?: number;
  screen_height?: number;
  timestamp?: number;
}

export class EdgeStatClient {
  private config: Required<EdgeStatConfig>;
  private queue: EventPayload[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(config: EdgeStatConfig) {
    this.config = {
      flushInterval: 10000,
      maxBatchSize: 20,
      ...config,
    };

    if (this.config.flushInterval > 0) {
      this.timer = setInterval(() => this.flush(), this.config.flushInterval);
    }
  }

  track(event: EventPayload): void {
    this.queue.push({
      ...event,
      timestamp: event.timestamp || Date.now(),
    });

    if (this.queue.length >= this.config.maxBatchSize) {
      this.flush();
    }
  }

  trackPageview(url: string, referrer?: string): void {
    this.track({ type: 'pageview', url, referrer });
  }

  trackEvent(name: string, props?: Record<string, string | number>): void {
    this.track({ type: 'custom', event_name: name, event_props: props });
  }

  async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const events = this.queue.splice(0, this.config.maxBatchSize);
    const body = JSON.stringify({
      site_id: this.config.siteId,
      events,
    });

    try {
      const res = await fetch(this.config.endpoint + '/v1/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      if (!res.ok) {
        // Re-queue failed events
        this.queue.unshift(...events);
        console.error(`EdgeStat: Failed to send events (${res.status})`);
      }
    } catch (err) {
      this.queue.unshift(...events);
      console.error('EdgeStat: Network error', err);
    }
  }

  async destroy(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    await this.flush();
  }
}
