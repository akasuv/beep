import { nanoid } from 'nanoid'
import type { Reply } from '../../../shared/types.js'
import { ID_LENGTH } from '../../../shared/constants.js'
import { getDb } from '../index.js'

export async function getRepliesByPostId(postId: string): Promise<Reply[]> {
  const db = await getDb()
  const result = await db.all(
    `SELECT
      r.id,
      r.post_id,
      r.parent_id,
      r.author_id,
      i.display_name as author_name,
      r.content,
      r.signature,
      r.created_at,
      r.depth
    FROM replies r
    LEFT JOIN identities i ON r.author_id = i.id
    WHERE r.post_id = ?
    ORDER BY r.created_at ASC`,
    postId
  )

  return result.map((row) => {
    const r = row as Record<string, unknown>
    return {
      id: r.id as string,
      postId: r.post_id as string,
      parentId: r.parent_id as string | null,
      authorId: r.author_id as string,
      authorName: r.author_name as string | null,
      content: r.content as string,
      signature: r.signature as string,
      createdAt: String(r.created_at),
      depth: Number(r.depth),
    }
  })
}

export async function getReplyById(id: string): Promise<Reply | null> {
  const db = await getDb()
  const result = await db.all(
    `SELECT
      r.id,
      r.post_id,
      r.parent_id,
      r.author_id,
      i.display_name as author_name,
      r.content,
      r.signature,
      r.created_at,
      r.depth
    FROM replies r
    LEFT JOIN identities i ON r.author_id = i.id
    WHERE r.id = ?`,
    id
  )

  if (result.length === 0) return null

  const r = result[0] as Record<string, unknown>
  return {
    id: r.id as string,
    postId: r.post_id as string,
    parentId: r.parent_id as string | null,
    authorId: r.author_id as string,
    authorName: r.author_name as string | null,
    content: r.content as string,
    signature: r.signature as string,
    createdAt: String(r.created_at),
    depth: Number(r.depth),
  }
}

export async function createReply(
  postId: string,
  authorId: string,
  content: string,
  signature: string,
  parentId?: string
): Promise<Reply> {
  const db = await getDb()
  const id = nanoid(ID_LENGTH)

  let depth = 0
  if (parentId) {
    const parent = await getReplyById(parentId)
    if (parent) {
      depth = parent.depth + 1
    }
  }

  await db.run(
    `INSERT INTO replies (id, post_id, parent_id, author_id, content, signature, depth) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id,
    postId,
    parentId ?? null,
    authorId,
    content,
    signature,
    depth
  )

  const reply = await getReplyById(id)
  if (!reply) throw new Error('Failed to create reply')
  return reply
}

export function buildReplyTree(replies: Reply[]): Reply[] {
  const map = new Map<string, Reply>()
  const roots: Reply[] = []

  for (const reply of replies) {
    map.set(reply.id, { ...reply, children: [] })
  }

  for (const reply of replies) {
    const node = map.get(reply.id)!
    if (reply.parentId && map.has(reply.parentId)) {
      const parent = map.get(reply.parentId)!
      parent.children = parent.children || []
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}
