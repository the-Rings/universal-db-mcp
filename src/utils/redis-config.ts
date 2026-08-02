import type { RedisNode } from '../types/adapter.js';

/** Parse comma-separated host:port Redis seed nodes (IPv6 uses [address]:port). */
export function parseRedisNodes(value: string): RedisNode[] {
  return value.split(',').filter(Boolean).map((entry) => {
    const item = entry.trim();
    const match = item.match(/^\[([^\]]+)\]:(\d+)$/) || item.match(/^([^:]+):(\d+)$/);
    if (!match) throw new Error(`无效的 Redis Cluster 节点: ${item}`);
    return { host: match[1], port: Number(match[2]) };
  });
}
