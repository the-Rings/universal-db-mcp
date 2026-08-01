import { afterEach, describe, expect, it, vi } from 'vitest';
import { PrestoAdapter } from '../../src/adapters/presto';
import { PrestoHttpClient } from '../../src/clients/presto-client';
import { DatabaseService } from '../../src/core/database-service';
import type { DbAdapter, QueryResult, SchemaInfo } from '../../src/types/adapter';

const emptyColumns: Array<{ name: string; type: string }> = [];

describe('PrestoAdapter', () => {
  afterEach(() => vi.restoreAllMocks());

  it('connects to the coordinator and maps query results', async () => {
    const query = vi.spyOn(PrestoHttpClient.prototype, 'query')
      .mockResolvedValueOnce({ rows: [{ _col0: 1 }], columns: emptyColumns })
      .mockResolvedValueOnce({
        rows: [{ id: '9223372036854775807', name: 'Alice' }],
        columns: [
          { name: 'id', type: 'bigint' },
          { name: 'name', type: 'varchar' },
        ],
        queryId: 'query-1',
        stats: { state: 'FINISHED' },
      });
    const adapter = createAdapter();

    await adapter.connect();
    const result = await adapter.executeQuery('SELECT id, name FROM ods.users');

    expect(query).toHaveBeenNthCalledWith(1, 'SELECT 1');
    expect(result.rows).toEqual([{ id: '9223372036854775807', name: 'Alice' }]);
    expect(result.metadata?.queryId).toBe('query-1');
  });

  it('loads Hive metadata through the configured catalog', async () => {
    vi.spyOn(PrestoHttpClient.prototype, 'query')
      .mockResolvedValueOnce({ rows: [{ _col0: 1 }], columns: emptyColumns })
      .mockResolvedValueOnce({ rows: [{ version: '0.297' }], columns: emptyColumns })
      .mockResolvedValueOnce({
        rows: [{ table_schema: 'ods', table_name: 'users' }],
        columns: emptyColumns,
      })
      .mockResolvedValueOnce({
        rows: [{
          table_schema: 'ods', table_name: 'users', column_name: 'id',
          is_nullable: 'NO', data_type: 'bigint', column_default: null,
        }],
        columns: emptyColumns,
      });
    const adapter = createAdapter();

    await adapter.connect();
    const schema = await adapter.getSchema();

    expect(schema.databaseType).toBe('presto');
    expect(schema.databaseName).toBe('hive');
    expect(schema.tables[0]).toMatchObject({
      name: 'ods.users',
      schema: 'ods',
      primaryKeys: [],
      columns: [{ name: 'id', type: 'bigint', nullable: false }],
    });
  });

  it('rejects positional params until a safe binding contract is implemented', async () => {
    vi.spyOn(PrestoHttpClient.prototype, 'query')
      .mockResolvedValueOnce({ rows: [{ _col0: 1 }], columns: emptyColumns });
    const adapter = createAdapter();
    await adapter.connect();

    await expect(adapter.executeQuery('SELECT ?', [1])).rejects.toThrow('暂不支持 params');
  });

  it('quotes catalog.schema.table names component by component', async () => {
    let executedSql = '';
    const adapter: DbAdapter = {
      connect: async () => undefined,
      disconnect: async () => undefined,
      isWriteOperation: () => false,
      executeQuery: async (sql: string): Promise<QueryResult> => {
        executedSql = sql;
        return { rows: [] };
      },
      getSchema: async (): Promise<SchemaInfo> => ({
        databaseType: 'presto',
        databaseName: 'hive',
        tables: [{
          name: 'hive.ods.users',
          schema: 'ods',
          columns: [{ name: 'id', type: 'bigint', nullable: false }],
          primaryKeys: [],
        }],
      }),
    };
    const service = new DatabaseService(adapter, {
      type: 'presto', host: 'localhost', port: 8080, catalog: 'hive', schema: 'ods',
    });

    await service.getSampleData('hive.ods.users', ['id'], 1);

    expect(executedSql).toBe('SELECT "id" FROM "hive"."ods"."users" LIMIT 1');
  });
});

function createAdapter(): PrestoAdapter {
  return new PrestoAdapter({
    host: 'localhost',
    port: 8080,
    user: 'reader',
    catalog: 'hive',
    schema: 'ods',
    protocol: 'http',
    source: 'test',
  });
}
