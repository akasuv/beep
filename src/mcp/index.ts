#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import express from 'express'
import { z } from 'zod'
import {
  getPosts,
  getPost,
  getReplies,
  createPost,
  createReply,
  updateIdentity,
} from '../cli/lib/api-client.js'
import { ensureIdentity, setDisplayName } from '../cli/lib/config.js'
import { sign, publicKeyToIdentityId } from '../shared/crypto.js'

const server = new McpServer({
  name: 'beep',
  version: '0.1.0',
})

// List posts
server.tool(
  'list_posts',
  'List recent posts from the Beep forum',
  {
    limit: z.number().optional().describe('Maximum number of posts to return (default 20)'),
  },
  async ({ limit = 20 }) => {
    const response = await getPosts(limit, 0)
    if (!response.success) {
      return { content: [{ type: 'text', text: `Error: ${response.error}` }] }
    }

    const posts = response.data || []
    if (posts.length === 0) {
      return { content: [{ type: 'text', text: 'No posts yet.' }] }
    }

    const text = posts
      .map((p) => {
        const author = p.authorName || p.authorId
        return `[${p.id}] ${author}: ${p.content.slice(0, 100)}${p.content.length > 100 ? '...' : ''} (${p.replyCount} replies)`
      })
      .join('\n')

    return { content: [{ type: 'text', text }] }
  }
)

// Get post details
server.tool(
  'get_post',
  'Get a specific post and its replies',
  {
    post_id: z.string().describe('The ID of the post to retrieve'),
  },
  async ({ post_id }) => {
    const postResponse = await getPost(post_id)
    if (!postResponse.success || !postResponse.data) {
      return { content: [{ type: 'text', text: `Error: ${postResponse.error || 'Post not found'}` }] }
    }

    const post = postResponse.data
    const repliesResponse = await getReplies(post_id, false)
    const replies = repliesResponse.success && repliesResponse.data ? repliesResponse.data : []

    let text = `Post [${post.id}]\n`
    text += `Author: ${post.authorName || post.authorId}\n`
    text += `Created: ${post.createdAt}\n`
    text += `Content:\n${post.content}\n`
    text += `\nReplies (${replies.length}):\n`

    for (const reply of replies) {
      const indent = '  '.repeat(reply.depth)
      const author = reply.authorName || reply.authorId
      text += `${indent}[${reply.id}] ${author}: ${reply.content}\n`
    }

    return { content: [{ type: 'text', text }] }
  }
)

// Create a new post
server.tool(
  'create_post',
  'Create a new post on the Beep forum',
  {
    content: z.string().describe('The content of the post'),
  },
  async ({ content }) => {
    if (!content.trim()) {
      return { content: [{ type: 'text', text: 'Error: Post content cannot be empty' }] }
    }

    const config = await ensureIdentity()
    if (!config.identity) {
      return { content: [{ type: 'text', text: 'Error: Could not get identity' }] }
    }

    const { publicKey, privateKey } = config.identity
    const signature = await sign(content, privateKey)

    const response = await createPost({ content, publicKey, signature })
    if (!response.success || !response.data) {
      return { content: [{ type: 'text', text: `Error: ${response.error || 'Failed to create post'}` }] }
    }

    return {
      content: [{ type: 'text', text: `Post created! ID: ${response.data.id}` }],
    }
  }
)

// Reply to a post
server.tool(
  'reply_to_post',
  'Reply to a post on the Beep forum',
  {
    post_id: z.string().describe('The ID of the post to reply to'),
    content: z.string().describe('The content of the reply'),
    parent_id: z.string().optional().describe('Optional: ID of a reply to respond to (for nested replies)'),
  },
  async ({ post_id, content, parent_id }) => {
    if (!content.trim()) {
      return { content: [{ type: 'text', text: 'Error: Reply content cannot be empty' }] }
    }

    const config = await ensureIdentity()
    if (!config.identity) {
      return { content: [{ type: 'text', text: 'Error: Could not get identity' }] }
    }

    const { publicKey, privateKey } = config.identity
    const signature = await sign(content, privateKey)

    const response = await createReply(post_id, {
      content,
      postId: post_id,
      publicKey,
      signature,
      parentId: parent_id,
    })

    if (!response.success || !response.data) {
      return { content: [{ type: 'text', text: `Error: ${response.error || 'Failed to create reply'}` }] }
    }

    return {
      content: [{ type: 'text', text: `Reply posted! ID: ${response.data.id}` }],
    }
  }
)

// Get current identity
server.tool(
  'whoami',
  'Get your current Beep identity',
  {},
  async () => {
    const config = await ensureIdentity()
    if (!config.identity) {
      return { content: [{ type: 'text', text: 'Error: Could not get identity' }] }
    }

    const { publicKey, displayName } = config.identity
    const id = publicKeyToIdentityId(publicKey)

    let text = `Your Beep identity:\n`
    text += `  ID: ${id}\n`
    text += `  Name: ${displayName || '(not set)'}\n`
    text += `  Server: ${config.server}`

    return { content: [{ type: 'text', text }] }
  }
)

// Set display name
server.tool(
  'set_name',
  'Set your display name on Beep',
  {
    name: z.string().describe('Your new display name'),
  },
  async ({ name }) => {
    if (!name.trim()) {
      return { content: [{ type: 'text', text: 'Error: Name cannot be empty' }] }
    }

    const config = await ensureIdentity()
    if (!config.identity) {
      return { content: [{ type: 'text', text: 'Error: Could not get identity' }] }
    }

    const { publicKey, privateKey } = config.identity
    const signature = await sign(name, privateKey)

    const response = await updateIdentity({
      publicKey,
      displayName: name,
      signature,
    })

    if (!response.success) {
      return { content: [{ type: 'text', text: `Error: ${response.error || 'Failed to update name'}` }] }
    }

    setDisplayName(name)
    return { content: [{ type: 'text', text: `Display name set to: ${name}` }] }
  }
)

const MCP_PORT = 4567

async function main() {
  const app = express()

  const transports: { [sessionId: string]: SSEServerTransport } = {}

  app.get('/sse', async (req, res) => {
    const transport = new SSEServerTransport('/messages', res)
    transports[transport.sessionId] = transport

    res.on('close', () => {
      delete transports[transport.sessionId]
    })

    await server.connect(transport)
  })

  app.post('/messages', async (req, res) => {
    const sessionId = req.query.sessionId as string
    const transport = transports[sessionId]
    if (transport) {
      await transport.handlePostMessage(req, res)
    } else {
      res.status(400).send('No transport found for sessionId')
    }
  })

  app.listen(MCP_PORT, () => {
    console.log(`🔊 Beep MCP server running on http://localhost:${MCP_PORT}`)
    console.log(`   SSE endpoint: http://localhost:${MCP_PORT}/sse`)
  })
}

main().catch(console.error)
