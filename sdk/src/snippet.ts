// EdgeStat tracking snippet - target <2KB gzipped
// Usage: <script defer data-site="SITE_ID" src="https://your-domain.com/s.js"></script>

(function () {
  const d = document;
  const w = window;
  const n = navigator;
  const s = d.currentScript as HTMLScriptElement;
  if (!s) return;

  const site = s.getAttribute('data-site');
  if (!site) return;

  const endpoint = new URL(s.src).origin + '/v1/events';
  const queue: Record<string, unknown>[] = [];

  function getUtm(key: string): string | undefined {
    try {
      return new URL(location.href).searchParams.get(key) || undefined;
    } catch {
      return undefined;
    }
  }

  function track(type: string, props?: Record<string, unknown>) {
    queue.push({
      type,
      url: location.href,
      referrer: d.referrer || undefined,
      utm_source: getUtm('utm_source'),
      utm_medium: getUtm('utm_medium'),
      utm_campaign: getUtm('utm_campaign'),
      screen_width: w.innerWidth,
      screen_height: w.innerHeight,
      timestamp: Date.now(),
      ...props,
    });
  }

  function flush() {
    if (!queue.length) return;
    const events = queue.splice(0, 20);
    const body = JSON.stringify({ site_id: site, events });

    if (n.sendBeacon) {
      n.sendBeacon(endpoint, body);
    } else {
      fetch(endpoint, { method: 'POST', body, keepalive: true }).catch(() => {
        /* best-effort flush */
      });
    }
  }

  // Auto-track initial pageview
  track('pageview');

  // Web Vitals via PerformanceObserver
  if ('PerformanceObserver' in w) {
    const vitals = [
      'largest-contentful-paint',
      'first-contentful-paint',
      'layout-shift',
      'first-input',
      'event',
    ];
    const vitalMap: Record<string, string> = {
      'largest-contentful-paint': 'LCP',
      'first-contentful-paint': 'FCP',
      'layout-shift': 'CLS',
      'first-input': 'FID',
      event: 'INP',
    };

    let clsValue = 0;

    for (const type of vitals) {
      try {
        const po = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const name = vitalMap[entry.entryType];
            if (!name) continue;

            if (name === 'CLS') {
              clsValue += (entry as PerformanceEntry & { value?: number }).value || 0;
            } else if (name === 'INP') {
              // Only track interactions (event entries with processing time)
              const e = entry as PerformanceEntry & { processingStart?: number };
              if (e.processingStart) {
                track('web_vital', { vital_name: 'INP', vital_value: entry.duration });
              }
            } else {
              const fidEntry = entry as PerformanceEntry & { processingStart?: number };
              // FID always has processingStart set; the non-null assertion is safe here
              const processingStart = fidEntry.processingStart ?? entry.startTime;
              const value = name === 'FID' ? processingStart - entry.startTime : entry.startTime;
              track('web_vital', { vital_name: name, vital_value: value });
            }
          }
        });
        po.observe({ type, buffered: true });
      } catch {
        // Observer not supported for this type
      }
    }

    // Report CLS on page hide
    d.addEventListener('visibilitychange', () => {
      if (d.visibilityState === 'hidden' && clsValue > 0) {
        track('web_vital', { vital_name: 'CLS', vital_value: clsValue });
      }
    });
  }

  // SPA navigation detection
  const pushState = history.pushState.bind(history);
  history.pushState = function (...args: Parameters<typeof history.pushState>) {
    pushState(...args);
    track('pageview');
  };

  w.addEventListener('popstate', () => {
    track('pageview');
  });

  // Flush on page visibility change (most reliable)
  d.addEventListener('visibilitychange', () => {
    if (d.visibilityState === 'hidden') flush();
  });

  // Fallback flush on page hide
  w.addEventListener('pagehide', flush);

  // Periodic flush every 30s for long sessions
  setInterval(flush, 30000);
})();
