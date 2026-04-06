import type { Env } from '../lib/types.js';
import { getActiveVisitors } from '../lib/aggregation.js';
import type { IRequest } from 'itty-router';

// Bug #8 fix: EventSource can't send custom headers, so accept token as query param
// Bug #5 fix: Workers support streaming SSE via ReadableStream with pull-based approach
export async function handleSSE(
  request: IRequest,
  env: Env,
): Promise<Response> {
  // Auth via query param (EventSource doesn't support custom headers)
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  if (!token || token !== env.MASTER_KEY) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const siteId = request.params?.id ?? '';
  const encoder = new TextEncoder();
  let pollCount = 0;
  const MAX_POLLS = 360; // ~1 hour at 10s intervals, then client reconnects

  const stream = new ReadableStream({
    async pull(controller) {
      if (pollCount >= MAX_POLLS) {
        controller.close();
        return;
      }

      try {
        const active = await getActiveVisitors(env.DB, siteId);
        const data = JSON.stringify({ type: 'visitors', count: active, timestamp: Date.now() });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      } catch (err) {
        console.error('SSE poll failed:', err);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error' })}\n\n`));
      }

      pollCount++;

      // Wait 10 seconds before next pull
      await new Promise((resolve) => setTimeout(resolve, 10_000));
    },
    cancel() {
      // Client disconnected - cleanup handled by GC
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
