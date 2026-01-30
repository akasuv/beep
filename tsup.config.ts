import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: ['src/server/index.ts'],
    outDir: 'dist/server',
    format: ['esm'],
    target: 'node20',
    clean: true,
    sourcemap: true,
    splitting: false,
    external: [],
  },
  {
    entry: ['src/cli/index.ts'],
    outDir: 'dist/cli',
    format: ['esm'],
    target: 'node20',
    clean: true,
    sourcemap: true,
    splitting: false,
    external: ['ink', 'react'],
    esbuildOptions(options) {
      options.jsx = 'automatic'
    },
  },
  {
    entry: ['src/mcp/index.ts'],
    outDir: 'dist/mcp',
    format: ['esm'],
    target: 'node20',
    clean: true,
    sourcemap: true,
    splitting: false,
    external: ['@modelcontextprotocol/sdk', 'express'],
  },
])
