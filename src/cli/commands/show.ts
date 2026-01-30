import chalk from 'chalk'
import { highlight } from 'cli-highlight'
import { getPost, getReplies } from '../lib/api-client.js'
import type { Reply } from '../../shared/types.js'

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString()
}

function renderMarkdown(text: string): string {
  let result = text

  // Code blocks with syntax highlighting
  result = result.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    try {
      const highlighted = highlight(code.trim(), { language: lang || 'text', ignoreIllegals: true })
      return `\n${chalk.dim('─'.repeat(40))}\n${highlighted}\n${chalk.dim('─'.repeat(40))}\n`
    } catch {
      return `\n${chalk.dim('─'.repeat(40))}\n${code.trim()}\n${chalk.dim('─'.repeat(40))}\n`
    }
  })

  // Inline code
  result = result.replace(/`([^`]+)`/g, (_, code) => chalk.cyan.bgGray(` ${code} `))

  // Headers
  result = result.replace(/^### (.+)$/gm, (_, text) => chalk.bold.yellow(`   ${text}`))
  result = result.replace(/^## (.+)$/gm, (_, text) => chalk.bold.magenta(`▸ ${text}`))
  result = result.replace(/^# (.+)$/gm, (_, text) => chalk.bold.cyan(`█ ${text}`))

  // Bold
  result = result.replace(/\*\*([^*]+)\*\*/g, (_, text) => chalk.bold(text))

  // Italic
  result = result.replace(/\*([^*]+)\*/g, (_, text) => chalk.italic(text))

  // Lists
  result = result.replace(/^- (.+)$/gm, (_, text) => chalk.white(`  • ${text}`))
  result = result.replace(/^\d+\. (.+)$/gm, (_, text) => chalk.white(`  ▹ ${text}`))

  // Horizontal rule
  result = result.replace(/^---$/gm, chalk.dim('─'.repeat(40)))

  // Links
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) =>
    `${chalk.blue.underline(text)} ${chalk.dim(`(${url})`)}`
  )

  return result
}

function printReply(reply: Reply, prefix = ''): void {
  const author = reply.authorName || reply.authorId
  console.log(`${prefix}${chalk.dim('├─')} ${chalk.cyan(author)} ${chalk.dim(formatDate(reply.createdAt))}`)
  console.log(`${prefix}${chalk.dim('│')}  ${reply.content}`)

  if (reply.children && reply.children.length > 0) {
    for (const child of reply.children) {
      printReply(child, prefix + '   ')
    }
  }
}

export async function show(postId: string): Promise<void> {
  if (!postId) {
    console.log(chalk.red('Post ID is required'))
    return
  }

  const postResponse = await getPost(postId)

  if (!postResponse.success || !postResponse.data) {
    console.log(chalk.red(`Post not found: ${postResponse.error || 'Unknown error'}`))
    return
  }

  const post = postResponse.data

  console.log(chalk.bold.white('─'.repeat(60)))
  const author = post.authorName || post.authorId
  console.log(`${chalk.cyan(author)} ${chalk.dim(formatDate(post.createdAt))}`)
  console.log()
  console.log(renderMarkdown(post.content))
  console.log()
  console.log(chalk.dim(`ID: ${post.id} | Replies: ${post.replyCount}`))
  console.log(chalk.bold.white('─'.repeat(60)))

  if (post.replyCount > 0) {
    const repliesResponse = await getReplies(postId, true)

    if (repliesResponse.success && repliesResponse.data) {
      console.log()
      console.log(chalk.bold(`Replies (${post.replyCount}):`))
      console.log()

      for (const reply of repliesResponse.data) {
        printReply(reply)
        console.log()
      }
    }
  }
}
