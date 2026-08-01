import JSONbigFactory from 'json-bigint';
import { Client, type PrestoColumn } from 'presto-client';

export interface PrestoClientConfig {
  host: string;
  port: number;
  user?: string;
  password?: string;
  catalog: string;
  schema?: string;
  protocol: 'http' | 'https';
  source: string;
  accessToken?: string;
  queryTimeout?: number;
}

export interface PrestoQueryResponse {
  rows: Record<string, unknown>[];
  columns: PrestoColumn[];
  queryId?: string;
  stats?: Record<string, unknown>;
}

const jsonParser = JSONbigFactory({ storeAsString: true, useNativeBigInt: false });

/** Promise-based boundary around the callback-oriented presto-client package. */
export class PrestoHttpClient {
  private readonly client: Client;

  constructor(config: PrestoClientConfig) {
    const authorization = config.accessToken ? `Bearer ${config.accessToken}` : undefined;
    const basicAuth = !authorization && config.password && config.user
      ? { user: config.user, password: config.password }
      : undefined;

    this.client = new Client({
      host: config.host,
      port: config.port,
      user: config.user,
      source: config.source,
      catalog: config.catalog,
      schema: config.schema,
      timeout: config.queryTimeout,
      ssl: config.protocol === 'https' ? {} : undefined,
      basic_auth: basicAuth,
      custom_auth: authorization,
      jsonParser,
    });
  }

  query(sql: string): Promise<PrestoQueryResponse> {
    return new Promise((resolve, reject) => {
      let settled = false;
      let queryId: string | undefined;
      let columns: PrestoColumn[] = [];
      const dataRows: unknown[][] = [];

      const fail = (error: Error): void => {
        if (!settled) {
          settled = true;
          reject(error);
        }
      };

      this.client.execute({
        query: sql,
        state: (error, id) => {
          if (error) return fail(error);
          queryId = id || queryId;
        },
        columns: (error, resultColumns) => {
          if (error) return fail(error);
          columns = resultColumns || [];
        },
        data: (error, rows, resultColumns) => {
          if (error) return fail(error);
          if (columns.length === 0 && resultColumns) columns = resultColumns;
          if (rows) dataRows.push(...rows);
        },
        success: (error, stats) => {
          if (error) return fail(error);
          if (settled) return;
          settled = true;
          resolve({
            rows: this.toObjects(columns, dataRows),
            columns,
            queryId,
            stats,
          });
        },
        error: fail,
      });
    });
  }

  cancel(queryId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.kill(queryId, (error?: Error) => error ? reject(error) : resolve());
    });
  }

  private toObjects(columns: PrestoColumn[], rows: unknown[][]): Record<string, unknown>[] {
    return rows.map((row) => Object.fromEntries(
      columns.map((column, index) => [column.name, row[index]])
    ));
  }
}
