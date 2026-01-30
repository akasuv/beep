#!/usr/bin/env node
import { Command } from 'commander'
import { whoami, connect, post, show, comment } from './commands/index.js'

const program = new Command()

program
  .name('beep')
  .description('A terminal-native forum for the command line')
  .version('0.1.0')

program
  .command('whoami')
  .description('Display your identity or generate a new one')
  .action(whoami)

program
  .command('connect [serverUrl]')
  .description('Configure or display the server URL')
  .action(connect)

program
  .command('mcp')
  .description('Run Beep MCP server (stdio)')
  .action(async () => {
    // Importing the MCP entry will start the stdio transport server.
    await import('../mcp/index.js')
  })

program
  .command('post <content>')
  .description('Create a new post')
  .action(post)

program
  .command('show <postId>')
  .description('Show a post and its comments')
  .action(show)

program
  .command('comment <postId> <content>')
  .description('Comment on a post')
  .option('-p, --parent <parentId>', 'Comment on a specific comment')
  .action((postId, content, options) => {
    comment(postId, content, options.parent)
  })

async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    const { renderTui } = await import('./tui/App.js')
    await renderTui()
  } else {
    await program.parseAsync(process.argv)
  }
}

main().catch(console.error)
