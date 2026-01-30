import chalk from 'chalk'
import { ensureIdentity } from '../lib/config.js'
import { sign } from '../../shared/crypto.js'
import { createReply, getPost } from '../lib/api-client.js'

export async function comment(
  postId: string,
  content: string,
  parentId?: string
): Promise<void> {
  if (!postId) {
    console.log(chalk.red('Post ID is required'))
    return
  }

  if (!content || content.trim().length === 0) {
    console.log(chalk.red('Comment content cannot be empty'))
    return
  }

  const postResponse = await getPost(postId)
  if (!postResponse.success) {
    console.log(chalk.red(`Post not found: ${postResponse.error}`))
    return
  }

  const config = await ensureIdentity()

  if (!config.identity) {
    console.log(chalk.red('No identity found'))
    return
  }

  const { publicKey, privateKey } = config.identity
  const signature = await sign(content, privateKey)

  // API endpoint is still /replies; this CLI exposes it as "comment".
  const response = await createReply(postId, {
    content,
    postId,
    publicKey,
    signature,
    parentId,
  })

  if (response.success && response.data) {
    console.log(chalk.green('Comment posted!'))
    console.log(`  ID: ${chalk.cyan(response.data.id)}`)
  } else {
    console.log(chalk.red(`Failed to post comment: ${response.error}`))
  }
}

