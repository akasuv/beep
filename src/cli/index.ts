#!/usr/bin/env node
import { Command } from 'commander'
import { whoami, name, connect, post, show, reply } from './commands/index.js'

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
  .command('name <displayName>')
  .description('Set your display name')
  .action(name)

program
  .command('connect [serverUrl]')
  .description('Configure or display the server URL')
  .action(connect)

program
  .command('post <content>')
  .description('Create a new post')
  .action(post)

program
  .command('show <postId>')
  .description('Show a post and its replies')
  .action(show)

program
  .command('reply <postId> <content>')
  .description('Reply to a post')
  .option('-p, --parent <parentId>', 'Reply to a specific reply')
  .action((postId, content, options) => {
    reply(postId, content, options.parent)
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
