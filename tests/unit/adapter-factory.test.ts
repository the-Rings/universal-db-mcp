/**
 * Adapter Factory Unit Tests
 */

import { describe, it, expect } from 'vitest';
import { createAdapter, normalizeDbType, parseRedisNodes, validateDbConfig } from '../../src/utils/adapter-factory';
import type { DbConfig } from '../../src/types/adapter';

describe('Adapter Factory', () => {
  describe('normalizeDbType', () => {
    it('should normalize mssql to sqlserver', () => {
      expect(normalizeDbType('mssql')).toBe('sqlserver');
    });

    it('should normalize opengauss to gaussdb', () => {
      expect(normalizeDbType('opengauss')).toBe('gaussdb');
    });

    it('should keep valid types unchanged', () => {
      expect(normalizeDbType('mysql')).toBe('mysql');
      expect(normalizeDbType('postgres')).toBe('postgres');
      expect(normalizeDbType('presto')).toBe('presto');
    });

    it('should throw error for invalid types', () => {
      expect(() => normalizeDbType('invalid')).toThrow();
    });
  });

  describe('validateDbConfig', () => {
    it('should validate SQLite config', () => {
      const config: DbConfig = {
        type: 'sqlite',
        filePath: '/path/to/db.sqlite'
      };
      expect(() => validateDbConfig(config)).not.toThrow();
    });

    it('should throw error for SQLite without filePath', () => {
      const config: DbConfig = {
        type: 'sqlite'
      };
      expect(() => validateDbConfig(config)).toThrow('filePath');
    });

    it('should validate MySQL config', () => {
      const config: DbConfig = {
        type: 'mysql',
        host: 'localhost',
        port: 3306
      };
      expect(() => validateDbConfig(config)).not.toThrow();
    });

    it('should throw error for MySQL without host/port', () => {
      const config: DbConfig = {
        type: 'mysql'
      };
      expect(() => validateDbConfig(config)).toThrow();
    });

    it('should validate Presto coordinator config', () => {
      const config: DbConfig = {
        type: 'presto',
        host: 'presto.example.com',
        port: 8080,
        catalog: 'hive',
      };
      expect(() => validateDbConfig(config)).not.toThrow();
    });

    it('should validate Redis Cluster seed nodes without host/port', () => {
      expect(() => validateDbConfig({
        type: 'redis',
        redisMode: 'cluster',
        redisNodes: [{ host: 'redis-1', port: 6379 }],
      })).not.toThrow();
    });

    it('should reject Redis Cluster without seed nodes or with a non-zero database', () => {
      expect(() => validateDbConfig({ type: 'redis', redisMode: 'cluster' })).toThrow('redisNodes');
      expect(() => validateDbConfig({
        type: 'redis',
        redisMode: 'cluster',
        redisNodes: [{ host: 'redis-1', port: 6379 }],
        database: '1',
      })).toThrow('database 0');
    });
  });

  describe('parseRedisNodes', () => {
    it('should parse hostnames and bracketed IPv6 nodes', () => {
      expect(parseRedisNodes('redis-1:6379,[2001:db8::1]:6380')).toEqual([
        { host: 'redis-1', port: 6379 },
        { host: '2001:db8::1', port: 6380 },
      ]);
    });

    it('should reject malformed nodes', () => {
      expect(() => parseRedisNodes('redis-1')).toThrow();
    });
  });

  describe('createAdapter', () => {
    it('should create MySQL adapter', () => {
      const config: DbConfig = {
        type: 'mysql',
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: 'password',
        database: 'test'
      };
      const adapter = createAdapter(config);
      expect(adapter).toBeDefined();
    });

    it('should create PostgreSQL adapter', () => {
      const config: DbConfig = {
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'password',
        database: 'test'
      };
      const adapter = createAdapter(config);
      expect(adapter).toBeDefined();
    });

    it('should create Presto adapter', () => {
      const adapter = createAdapter({
        type: 'presto',
        host: 'localhost',
        port: 8080,
        user: 'reader',
        catalog: 'hive',
        schema: 'ods',
      });
      expect(adapter).toBeDefined();
    });
  });
});
