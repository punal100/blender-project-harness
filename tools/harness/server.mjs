import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { Harness } from './engine.mjs';
import { BlenderProxy } from './proxy.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const harness = new Harness(root);
const client = new Client({ name: 'blender-workflow-proxy', version: '1.0.0' });
const transport = new StdioClientTransport({ command: 'uvx', args: ['mcp-for-blender==2.2.6'], cwd: root,
  env: Object.fromEntries(Object.entries(process.env).filter(([, v]) => v !== undefined)), stderr: 'inherit' });
await client.connect(transport);
const proxy = new BlenderProxy(harness, client);
const server = new Server({ name: 'guarded-blender', version: '1.0.0' }, { capabilities: { tools: {} }, instructions:
  'Production writes require blender_workflow registration, bounded change and one-time operation ticket. Raw Python is unavailable. Seal, inspect with look, review, obtain required approval, commit and checkpoint before next change. Unsupported operations stop.' });
server.setRequestHandler(ListToolsRequestSchema, () => proxy.listTools());
server.setRequestHandler(CallToolRequestSchema, (request) => proxy.call(request.params.name, request.params.arguments));
server.onclose = () => { void client.close(); };
await server.connect(new StdioServerTransport());
