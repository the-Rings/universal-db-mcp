declare module 'presto-client' {
  export interface PrestoColumn {
    name: string;
    type: string;
    typeSignature?: unknown;
  }

  export interface PrestoClientOptions {
    host: string;
    port: number;
    user?: string;
    source?: string;
    catalog?: string;
    schema?: string;
    timeout?: number;
    ssl?: Record<string, unknown>;
    basic_auth?: { user: string; password: string };
    custom_auth?: string;
    jsonParser?: { parse(value: string): unknown };
  }

  export interface PrestoExecuteOptions {
    query: string;
    state?: (error: Error | null, queryId: string, stats: Record<string, unknown>) => void;
    columns?: (error: Error | null, columns: PrestoColumn[]) => void;
    data?: (
      error: Error | null,
      data: unknown[][],
      columns: PrestoColumn[],
      stats: Record<string, unknown>
    ) => void;
    success: (error: Error | null, stats: Record<string, unknown>, info?: unknown) => void;
    error: (error: Error) => void;
  }

  export class Client {
    constructor(options: PrestoClientOptions);
    execute(options: PrestoExecuteOptions): void;
    kill(queryId: string, callback?: (error?: Error) => void): void;
  }
}
