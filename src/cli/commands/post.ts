import chalk from 'chalk'
import { ensureIdentity } from '../lib/config.js'
import { sign } from '../../shared/crypto.js'
import { createPost } from '../lib/api-client.js'

export async function post(content: string): Promise<void> {
  if (!content || content.trim().length === 0) {
    console.log(chalk.red('Post content cannot be empty'))
    return
  }

  const config = await ensureIdentity()

  if (!config.identity) {
    console.log(chalk.red('No identity found'))
    return
  }

  const { publicKey, privateKey } = config.identity
  const signature = await sign(content, privateKey)

  const response = await createPost({
    content,
    publicKey,
    signature,
  })

  if (response.success && response.data) {
    console.log(chalk.green('Post created!'))
    console.log(`  ID: ${chalk.cyan(response.data.id)}`)
    console.log(`  Content: ${response.data.content.slice(0, 50)}${response.data.content.length > 50 ? '...' : ''}`)
  } else {
    console.log(chalk.red(`Failed to create post: ${response.error}`))
  }
}
