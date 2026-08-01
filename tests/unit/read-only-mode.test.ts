import { describe, expect, it } from 'vitest';
import { DatabaseService } from '../../src/core/database-service.js';
import { resolvePermissions } from '../../src/utils/safety.js';
import type { DbAdapter, DbConfig, QueryResult, SchemaInfo } from '../../src/types/adapter.js';

class TestAdapter implements DbAdapter {
  executed = false;

  async connect(): Promise<void> {}
  async disconnect(): Promise<void> {}

  async executeQuery(): Promise<QueryResult> {
    this.executed = true;
    return { rows: [] };
  }

  async getSchema(): Promise<SchemaInfo> {
    return { databaseType: 'redis', databaseName: 'test', tables: [] };
  }

  isWriteOperation(query: string): boolean {
    return /^(SET|DEL)\b/i.test(query.trim());
  }
}

describe('global read-only mode', () => {
  it('ignores every configuration that requests write permissions', () => {
    const configs: DbConfig[] = [
      { type: 'mysql', allowWrite: true },
      { type: 'mysql', permissionMode: 'readwrite' },
      { type: 'mysql', permissionMode: 'full' },
      { type: 'mysql', permissionMode: 'custom', permissions: ['insert', 'update', 'delete', 'ddl'] },
    ];

    for (const config of configs) {
      expect(resolvePermissions(config)).toEqual(['read']);
    }
  });

  it('blocks adapter-specific write commands before execution', async () => {
    const adapter = new TestAdapter();
    const service = new DatabaseService(adapter, { type: 'redis', allowWrite: true });

    await expect(service.executeQuery('SET key value')).rejects.toThrow('全局禁用数据库写操作');
    expect(adapter.executed).toBe(false);
  });

  it('still allows read operations', async () => {
    const adapter = new TestAdapter();
    const service = new DatabaseService(adapter, { type: 'redis' });

    await expect(service.executeQuery('GET key')).resolves.toEqual({ rows: [] });
    expect(adapter.executed).toBe(true);
  });
});
