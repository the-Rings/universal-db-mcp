/**
 * Adapter Factory - Centralized database adapter creation
 * Extracts adapter creation logic for reuse across MCP and HTTP modes
 */

import type { DbAdapter, DbConfig } from '../types/adapter.js';
export { parseRedisNodes } from './redis-config.js';
import { MySQLAdapter } from '../adapters/mysql.js';
import { PostgreSQLAdapter } from '../adapters/postgres.js';
import { RedisAdapter } from '../adapters/redis.js';
import { OracleAdapter } from '../adapters/oracle.js';
import { DMAdapter } from '../adapters/dm.js';
import { SQLServerAdapter } from '../adapters/sqlserver.js';
import { MongoDBAdapter } from '../adapters/mongodb.js';
import { SQLiteAdapter } from '../adapters/sqlite.js';
import { KingbaseAdapter } from '../adapters/kingbase.js';
import { GaussDBAdapter } from '../adapters/gaussdb.js';
import { OceanBaseAdapter } from '../adapters/oceanbase.js';
import { TiDBAdapter } from '../adapters/tidb.js';
import { ClickHouseAdapter } from '../adapters/clickhouse.js';
import { PolarDBAdapter } from '../adapters/polardb.js';
import { VastbaseAdapter } from '../adapters/vastbase.js';
import { HighGoAdapter } from '../adapters/highgo.js';
import { GoldenDBAdapter } from '../adapters/goldendb.js';
import { PrestoAdapter } from '../adapters/presto.js';

/**
 * Supported database types
 */
export type DbType =
  | 'mysql'
  | 'postgres'
  | 'redis'
  | 'oracle'
  | 'dm'
  | 'sqlserver'
  | 'mongodb'
  | 'sqlite'
  | 'kingbase'
  | 'gaussdb'
  | 'oceanbase'
  | 'tidb'
  | 'clickhouse'
  | 'polardb'
  | 'vastbase'
  | 'highgo'
  | 'goldendb'
  | 'presto';

/**
 * Normalize database type aliases to canonical names
 */
export function normalizeDbType(type: string): DbType {
  const normalized = type.toLowerCase();

  // Handle aliases
  if (normalized === 'mssql') {
    return 'sqlserver';
  }
  if (normalized === 'opengauss') {
    return 'gaussdb';
  }

  // Validate type
  const validTypes: DbType[] = [
    'mysql',
    'postgres',
    'redis',
    'oracle',
    'dm',
    'sqlserver',
    'mongodb',
    'sqlite',
    'kingbase',
    'gaussdb',
    'oceanbase',
    'tidb',
    'clickhouse',
    'polardb',
    'vastbase',
    'highgo',
    'goldendb',
    'presto',
  ];

  if (!validTypes.includes(normalized as DbType)) {
    throw new Error(
      `不支持的数据库类型: ${type}。支持的类型: ${validTypes.join(', ')}`
    );
  }

  return normalized as DbType;
}

/**
 * Validate database configuration
 */
export function validateDbConfig(config: DbConfig): void {
  // Normalize type
  const dbType = normalizeDbType(config.type);

  // SQLite special validation
  if (dbType === 'sqlite') {
    if (!config.filePath) {
      throw new Error('SQLite 数据库需要指定 filePath 参数');
    }
    return;
  }

  if (dbType === 'redis' && config.redisMode && !['standalone', 'cluster'].includes(config.redisMode)) {
    throw new Error(`无效的 Redis 模式: ${config.redisMode}`);
  }
  if (dbType === 'redis' && config.redisScaleReads && !['master', 'slave', 'all'].includes(config.redisScaleReads)) {
    throw new Error(`无效的 Redis Cluster 读策略: ${config.redisScaleReads}`);
  }
  if (dbType === 'redis' && config.redisMode === 'cluster') {
    if (config.host || config.port) {
      throw new Error('Redis Cluster 请使用 redisNodes，不能同时指定 host/port');
    }
    if (!config.redisNodes?.length) {
      throw new Error('Redis Cluster 至少需要指定一个 redisNodes 种子节点');
    }
    for (const node of config.redisNodes) {
      if (!node.host || !Number.isInteger(node.port) || node.port < 1 || node.port > 65535) {
        throw new Error('Redis Cluster 节点必须包含有效的 host 和 port');
      }
    }
    if (config.database !== undefined && config.database !== '' && config.database !== '0') {
      throw new Error('Redis Cluster 只支持 database 0');
    }
    return;
  }

  // Other databases need host and port
  if (!config.host || !config.port) {
    throw new Error(`${dbType} 数据库需要指定 host 和 port 参数`);
  }
}

/**
 * Create database adapter based on configuration
 */
export function createAdapter(config: DbConfig): DbAdapter {
  // Validate configuration
  validateDbConfig(config);

  // Normalize type
  const dbType = normalizeDbType(config.type);

  // Create adapter based on type
  switch (dbType) {
    case 'mysql':
      return new MySQLAdapter({
        host: config.host!,
        port: config.port!,
        user: config.user,
        password: config.password,
        database: config.database,
      });

    case 'postgres':
      return new PostgreSQLAdapter({
        host: config.host!,
        port: config.port!,
        user: config.user,
        password: config.password,
        database: config.database,
      });

    case 'redis':
      return new RedisAdapter({
        host: config.host!,
        port: config.port!,
        username: config.user,
        password: config.password,
        database: config.database,
        mode: config.redisMode,
        nodes: config.redisNodes,
        scaleReads: config.redisScaleReads,
        tls: config.redisTls,
      });

    case 'oracle':
      return new OracleAdapter({
        host: config.host!,
        port: config.port!,
        user: config.user,
        password: config.password,
        database: config.database,
        oracleClientPath: config.oracleClientPath,
      });

    case 'dm':
      return new DMAdapter({
        host: config.host!,
        port: config.port!,
        user: config.user,
        password: config.password,
        database: config.database,
      });

    case 'sqlserver':
      return new SQLServerAdapter({
        host: config.host!,
        port: config.port!,
        user: config.user,
        password: config.password,
        database: config.database,
      });

    case 'mongodb':
      return new MongoDBAdapter({
        host: config.host!,
        port: config.port!,
        user: config.user,
        password: config.password,
        database: config.database,
        authSource: (config as any).authSource,
      });

    case 'sqlite':
      return new SQLiteAdapter({
        filePath: config.filePath!,
        readonly: !config.allowWrite,
      });

    case 'kingbase':
      return new KingbaseAdapter({
        host: config.host!,
        port: config.port!,
        user: config.user,
        password: config.password,
        database: config.database,
      });

    case 'gaussdb':
      return new GaussDBAdapter({
        host: config.host!,
        port: config.port!,
        user: config.user,
        password: config.password,
        database: config.database,
      });

    case 'oceanbase':
      return new OceanBaseAdapter({
        host: config.host!,
        port: config.port!,
        user: config.user,
        password: config.password,
        database: config.database,
      });

    case 'tidb':
      return new TiDBAdapter({
        host: config.host!,
        port: config.port!,
        user: config.user,
        password: config.password,
        database: config.database,
      });

    case 'clickhouse':
      return new ClickHouseAdapter({
        host: config.host!,
        port: config.port!,
        user: config.user,
        password: config.password,
        database: config.database,
      });

    case 'polardb':
      return new PolarDBAdapter({
        host: config.host!,
        port: config.port!,
        user: config.user,
        password: config.password,
        database: config.database,
      });

    case 'vastbase':
      return new VastbaseAdapter({
        host: config.host!,
        port: config.port!,
        user: config.user,
        password: config.password,
        database: config.database,
      });

    case 'highgo':
      return new HighGoAdapter({
        host: config.host!,
        port: config.port!,
        user: config.user,
        password: config.password,
        database: config.database,
      });

    case 'goldendb':
      return new GoldenDBAdapter({
        host: config.host!,
        port: config.port!,
        user: config.user,
        password: config.password,
        database: config.database,
      });

    case 'presto':
      return new PrestoAdapter({
        host: config.host!,
        port: config.port!,
        user: config.user,
        password: config.password,
        catalog: config.catalog || 'hive',
        schema: config.schema || config.database,
        protocol: config.protocol || 'http',
        source: config.source || 'universal-db-mcp',
        accessToken: config.accessToken,
        queryTimeout: config.queryTimeout,
      });

    default:
      throw new Error(`不支持的数据库类型: ${dbType}`);
  }
}
