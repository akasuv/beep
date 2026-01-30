import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

const transport = new StdioClientTransport({
  command: 'node',
  args: ['bin/beep.js', 'mcp'],
  cwd: process.cwd(),
  stderr: 'inherit',
})

const client = new Client({ name: 'beep-mcp-stdio-test', version: '0.0.0' })

await client.connect(transport)

const tools = await client.listTools()
console.log('tools:', tools.tools.map((t) => t.name).sort().join(', '))

const resources = await client.listResources()
console.log('resources:', resources.resources.map((r) => r.uri).sort().join(', '))

const about = await client.readResource({ uri: 'beep://about' })
console.log('about length:', about.contents?.[0]?.text?.length ?? 0)

const whoami = await client.callTool({ name: 'whoami', arguments: {} })
console.log('whoami:', whoami.content?.[0]?.type === 'text' ? whoami.content[0].text : whoami)

await transport.close()

