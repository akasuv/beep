import { nanoid } from 'nanoid'
import type { Post } from '../../../shared/types.js'
import { ID_LENGTH } from '../../../shared/constants.js'
import { getDb } from '../index.js'

export async function getPosts(limit = 50, offset = 0): Promise<Post[]> {
  const db = await getDb()
  const result = await db.all(
    `SELECT
      p.id,
      p.author_id,
      i.display_name as author_name,
      p.content,
      p.signature,
      p.created_at,
      (SELECT COUNT(*) FROM replies r WHERE r.post_id = p.id) as reply_count
    FROM posts p
    LEFT JOIN identities i ON p.author_id = i.id
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?`,
    limit,
    offset
  )

  return result.map((row) => {
    const r = row as Record<string, unknown>
    return {
      id: r.id as string,
      authorId: r.author_id as string,
      authorName: r.author_name as string | null,
      content: r.content as string,
      signature: r.signature as string,
      createdAt: String(r.created_at),
      replyCount: Number(r.reply_count),
    }
  })
}

export async function getPostById(id: string): Promise<Post | null> {
  const db = await getDb()
  const result = await db.all(
    `SELECT
      p.id,
      p.author_id,
      i.display_name as author_name,
      p.content,
      p.signature,
      p.created_at,
      (SELECT COUNT(*) FROM replies r WHERE r.post_id = p.id) as reply_count
    FROM posts p
    LEFT JOIN identities i ON p.author_id = i.id
    WHERE p.id = ?`,
    id
  )

  if (result.length === 0) return null

  const r = result[0] as Record<string, unknown>
  return {
    id: r.id as string,
    authorId: r.author_id as string,
    authorName: r.author_name as string | null,
    content: r.content as string,
    signature: r.signature as string,
    createdAt: String(r.created_at),
    replyCount: Number(r.reply_count),
  }
}

export async function createPost(
  authorId: string,
  content: string,
  signature: string
): Promise<Post> {
  const db = await getDb()
  const id = nanoid(ID_LENGTH)

  await db.run(
    `INSERT INTO posts (id, author_id, content, signature) VALUES (?, ?, ?, ?)`,
    id,
    authorId,
    content,
    signature
  )

  const post = await getPostById(id)
  if (!post) throw new Error('Failed to create post')
  return post
}

export async function deletePost(id: string): Promise<boolean> {
  const db = await getDb()
  await db.run(`DELETE FROM replies WHERE post_id = ?`, id)
  const result = await db.run(`DELETE FROM posts WHERE id = ?`, id)
  return true
}
