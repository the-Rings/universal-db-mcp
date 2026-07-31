#!/usr/bin/env node

/**
 * Universal Database MCP Server - Main Entry Point
 * Mode selector: MCP (stdio) or HTTP (REST API)
 */

import { loadConfig, validateConfig } from './utils/config-loader.js';

async function main() {
  try {
    // Load configuration from environment variables
    const config = loadConfig();

    // Validate configuration
    validateConfig(config);

    // Select mode based on configuration
    if (config.mode === 'http') {
      // HTTP API mode
      console.log('🌐 Starting HTTP API mode...');
      const { startHttpServer } = await import('./http/http-index.js');
      await startHttpServer(config);
    } else {
      // MCP mode (default)
      console.error('🔌 Starting MCP mode...');
      const { startMcpServer } = await import('./mcp/mcp-index.js');
      await startMcpServer();
    }
  } catch (error) {
    console.error('❌ Failed to start server:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
