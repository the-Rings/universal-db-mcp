import type {
  ColumnInfo,
  DbAdapter,
  QueryResult,
  SchemaInfo,
  TableInfo,
} from '../types/adapter.js';
import { PrestoHttpClient, type PrestoClientConfig } from '../clients/presto-client.js';
import { isWriteOperation as checkWriteOperation } from '../utils/safety.js';

interface TableRow {
  table_schema: string;
  table_name: string;
}

interface ColumnRow {
  table_schema: string;
  table_name: string;
  column_name: string;
  is_nullable: string;
  data_type: string;
  column_default?: string | null;
}

/** Queries Hive (or another connector) through a Presto coordinator. */
export class PrestoAdapter implements DbAdapter {
  private readonly config: PrestoClientConfig;
  private client: PrestoHttpClient | null = null;

  constructor(config: PrestoClientConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    try {
      this.client = new PrestoHttpClient(this.config);
      await this.client.query('SELECT 1');
    } catch (error) {
      this.client = null;
      throw new Error(`Presto 连接失败: ${this.errorMessage(error)}`);
    }
  }

  async disconnect(): Promise<void> {
    // presto-client creates request-scoped HTTP agents and has no persistent pool.
    this.client = null;
  }

  async executeQuery(query: string, params?: unknown[]): Promise<QueryResult> {
    const client = this.requireClient();
    if (params && params.length > 0) {
      throw new Error('Presto 适配器暂不支持 params，请提交完整 SQL');
    }

    const startedAt = Date.now();
    try {
      const result = await client.query(query);
      return {
        rows: result.rows,
        executionTime: Date.now() - startedAt,
        metadata: {
          queryId: result.queryId,
          columns: result.columns,
          stats: result.stats,
        },
      };
    } catch (error) {
      throw new Error(`Presto 查询执行失败: ${this.errorMessage(error)}`);
    }
  }

  async getSchema(): Promise<SchemaInfo> {
    const client = this.requireClient();
    const catalog = this.quoteIdentifier(this.config.catalog);
    const schemaFilter = this.config.schema
      ? ` AND table_schema = '${this.escapeLiteral(this.config.schema)}'`
      : '';

    try {
      const [versionResult, tablesResult, columnsResult] = await Promise.all([
        client.query('SELECT version() AS version'),
        client.query(`
          SELECT table_schema, table_name
          FROM ${catalog}.information_schema.tables
          WHERE table_schema <> 'information_schema'${schemaFilter}
          ORDER BY table_schema, table_name
        `),
        client.query(`
          SELECT table_schema, table_name, column_name, is_nullable, data_type, column_default
          FROM ${catalog}.information_schema.columns
          WHERE table_schema <> 'information_schema'${schemaFilter}
          ORDER BY table_schema, table_name, ordinal_position
        `),
      ]);

      const tableRows = tablesResult.rows as unknown as TableRow[];
      const columnRows = columnsResult.rows as unknown as ColumnRow[];
      const columnsByTable = new Map<string, ColumnInfo[]>();

      for (const column of columnRows) {
        const key = this.tableKey(column.table_schema, column.table_name);
        const columns = columnsByTable.get(key) || [];
        columns.push({
          name: column.column_name,
          type: column.data_type,
          nullable: column.is_nullable.toUpperCase() === 'YES',
          defaultValue: column.column_default ?? undefined,
        });
        columnsByTable.set(key, columns);
      }

      const tables: TableInfo[] = tableRows.map((table) => {
        const key = this.tableKey(table.table_schema, table.table_name);
        return {
          name: key,
          schema: table.table_schema,
          columns: columnsByTable.get(key) || [],
          primaryKeys: [],
          indexes: [],
          foreignKeys: [],
        };
      });

      return {
        databaseType: 'presto',
        databaseName: this.config.catalog,
        tables,
        version: String(versionResult.rows[0]?.version ?? 'unknown'),
        relationships: [],
      };
    } catch (error) {
      throw new Error(`获取 Presto Schema 失败: ${this.errorMessage(error)}`);
    }
  }

  isWriteOperation(query: string): boolean {
    return checkWriteOperation(query);
  }

  private requireClient(): PrestoHttpClient {
    if (!this.client) throw new Error('Presto 数据库未连接');
    return this.client;
  }

  private quoteIdentifier(identifier: string): string {
    return `"${identifier.replace(/"/g, '""')}"`;
  }

  private escapeLiteral(value: string): string {
    return value.replace(/'/g, "''");
  }

  private tableKey(schema: string, table: string): string {
    return `${schema}.${table}`;
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
