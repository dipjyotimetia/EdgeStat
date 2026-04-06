import { useState, useEffect } from 'react';

interface SSEData {
  type: string;
  count: number;
  timestamp: number;
}

// Bug #8 fix: pass master key as query param since EventSource can't send headers
export function useSSE(siteId: string | undefined, masterKey: string | null) {
  const [count, setCount] = useState(0);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!siteId || !masterKey) return;

    const url = `/sse/sites/${siteId}/live?token=${encodeURIComponent(masterKey)}`;
    const source = new EventSource(url);

    source.onopen = () => setConnected(true);

    source.onmessage = (event) => {
      try {
        const data: SSEData = JSON.parse(event.data);
        if (data.type === 'visitors') {
          setCount(data.count);
        }
      } catch {
        // Ignore parse errors
      }
    };

    source.onerror = () => {
      setConnected(false);
    };

    return () => {
      source.close();
      setConnected(false);
    };
  }, [siteId, masterKey]);

  return { count, connected };
}
