import { EventEmitter } from "node:events";
import { randomUUID } from "node:crypto";
import { createClient, type RedisClientType } from "redis";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

export interface RealtimeEvent<T = unknown> {
  id: string;
  type: string;
  payload: T;
  createdAt: string;
  origin?: string;
}

type Listener = (event: RealtimeEvent) => void;

const eventBus = new EventEmitter();
eventBus.setMaxListeners(0);

const instanceId = randomUUID();
const channel = "estatehub:realtime";

let sequence = 0;
let redisPub: RedisClientType | null = null;
let redisSub: RedisClientType | null = null;
let redisInitPromise: Promise<void> | null = null;

const nextId = () => `${Date.now()}-${++sequence}`;

const initRedis = () => {
  if (!env.realtimeRedisUrl) return Promise.resolve();
  if (redisInitPromise) return redisInitPromise;

  redisInitPromise = (async () => {
    try {
      redisPub = createClient({ url: env.realtimeRedisUrl });
      redisPub.on("error", (err) => logger.warn({ err }, "Redis publish client error"));
      await redisPub.connect();

      redisSub = redisPub.duplicate();
      redisSub.on("error", (err) => logger.warn({ err }, "Redis subscribe client error"));
      await redisSub.connect();

      await redisSub.subscribe(channel, (message) => {
        try {
          const event = JSON.parse(message) as RealtimeEvent;
          if (event.origin === instanceId) return;
          eventBus.emit("event", event);
        } catch (err) {
          logger.warn({ err }, "Failed to parse realtime event");
        }
      });
    } catch (err) {
      logger.warn({ err }, "Failed to initialize Redis realtime broker");
    }
  })();

  return redisInitPromise;
};

export const publishEvent = <T>(type: string, payload: T) => {
  const event: RealtimeEvent<T> = {
    id: nextId(),
    type,
    payload,
    createdAt: new Date().toISOString(),
    origin: instanceId
  };

  eventBus.emit("event", event);

  if (env.realtimeRedisUrl) {
    void initRedis()
      .then(() => redisPub?.publish(channel, JSON.stringify(event)))
      .catch((err) => logger.warn({ err }, "Failed to publish realtime event"));
  }

  return event;
};

export const subscribe = (listener: Listener) => {
  eventBus.on("event", listener);
  if (env.realtimeRedisUrl) {
    void initRedis();
  }
  return () => {
    eventBus.off("event", listener);
  };
};
