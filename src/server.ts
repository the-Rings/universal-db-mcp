/**
 * Backward Compatibility Shim
 * Re-exports DatabaseMCPServer from mcp/mcp-server.ts
 * This maintains compatibility with any external code that imports from server.ts
 */

export { DatabaseMCPServer } from './mcp/mcp-server.js';
