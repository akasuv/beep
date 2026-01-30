import { Hono } from 'hono'
import type {
  ApiResponse,
  Post,
  Reply,
  CreatePostRequest,
  CreateReplyRequest,
} from '../../shared/types.js'
import { verify } from '../../shared/crypto.js'
import { getOrCreateIdentity } from '../db/queries/index.js'
import {
  getPosts,
  getPostById,
  createPost,
} from '../db/queries/posts.js'
import {
  getRepliesByPostId,
  createReply,
  buildReplyTree,
} from '../db/queries/replies.js'

const posts = new Hono()

posts.get('/', async (c) => {
  const limit = Number(c.req.query('limit')) || 50
  const offset = Number(c.req.query('offset')) || 0
  const allPosts = await getPosts(limit, offset)
  return c.json<ApiResponse<Post[]>>({ success: true, data: allPosts })
})

posts.get('/:id', async (c) => {
  const id = c.req.param('id')
  const post = await getPostById(id)

  if (!post) {
    return c.json<ApiResponse<null>>({ success: false, error: 'Post not found' }, 404)
  }

  return c.json<ApiResponse<Post>>({ success: true, data: post })
})

posts.post('/', async (c) => {
  const body = await c.req.json<CreatePostRequest>()
  const { content, publicKey, signature } = body

  if (!content || !publicKey || !signature) {
    return c.json<ApiResponse<null>>(
      { success: false, error: 'Content, public key, and signature are required' },
      400
    )
  }

  const isValid = await verify(content, signature, publicKey)
  if (!isValid) {
    return c.json<ApiResponse<null>>({ success: false, error: 'Invalid signature' }, 401)
  }

  const identity = await getOrCreateIdentity(publicKey)
  const post = await createPost(identity.id, content, signature)

  return c.json<ApiResponse<Post>>({ success: true, data: post }, 201)
})

posts.get('/:id/replies', async (c) => {
  const postId = c.req.param('id')
  const post = await getPostById(postId)

  if (!post) {
    return c.json<ApiResponse<null>>({ success: false, error: 'Post not found' }, 404)
  }

  const replies = await getRepliesByPostId(postId)
  const tree = c.req.query('tree') === 'true'

  if (tree) {
    return c.json<ApiResponse<Reply[]>>({ success: true, data: buildReplyTree(replies) })
  }

  return c.json<ApiResponse<Reply[]>>({ success: true, data: replies })
})

posts.post('/:id/replies', async (c) => {
  const postId = c.req.param('id')
  const body = await c.req.json<CreateReplyRequest>()
  const { content, publicKey, signature, parentId } = body

  if (!content || !publicKey || !signature) {
    return c.json<ApiResponse<null>>(
      { success: false, error: 'Content, public key, and signature are required' },
      400
    )
  }

  const post = await getPostById(postId)
  if (!post) {
    return c.json<ApiResponse<null>>({ success: false, error: 'Post not found' }, 404)
  }

  const isValid = await verify(content, signature, publicKey)
  if (!isValid) {
    return c.json<ApiResponse<null>>({ success: false, error: 'Invalid signature' }, 401)
  }

  const identity = await getOrCreateIdentity(publicKey)
  const reply = await createReply(postId, identity.id, content, signature, parentId)

  return c.json<ApiResponse<Reply>>({ success: true, data: reply }, 201)
})

export default posts
