declare module 'json-bigint' {
  interface JsonBigOptions {
    storeAsString?: boolean;
    useNativeBigInt?: boolean;
  }

  interface JsonBig {
    parse(value: string): unknown;
    stringify(value: unknown): string;
  }

  export default function JSONbig(options?: JsonBigOptions): JsonBig;
}
