import type { Env, QueueMessage } from './lib/types.js';
import { router } from './router.js';
import { handleQueueBatch } from './queue/consumer.js';
import { handleScheduled } from './cron/scheduled.js';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return router.fetch(request, env, ctx);
  },

  async queue(batch: MessageBatch<QueueMessage>, env: Env, ctx: ExecutionContext): Promise<void> {
    await handleQueueBatch(batch, env, ctx);
  },

  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    await handleScheduled(controller, env, ctx);
  },
};
