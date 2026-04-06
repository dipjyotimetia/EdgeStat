import type { EventType, VitalName, DeviceType } from '@edgestat/schemas/types';

export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  R2: R2Bucket;
  EVENTS_QUEUE: Queue<QueueMessage>;
  ASSETS: Fetcher;
  MASTER_KEY: string;
  RETENTION_DAYS: string;
  SESSION_TIMEOUT_MINUTES: string;
}

export interface AnalyticsEvent {
  site_id: string;
  type: EventType;
  url: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  device_type?: DeviceType;
  browser?: string;
  country?: string;
  screen_width?: number;
  screen_height?: number;
  event_name?: string;
  event_props?: Record<string, string | number>;
  vital_name?: VitalName;
  vital_value?: number;
  session_id?: string;
  timestamp: number;
}

export interface QueueMessage {
  site_id: string;
  events: AnalyticsEvent[];
  received_at: number;
}
