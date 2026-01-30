import { nanoid } from 'nanoid'
import type { Post } from '../../../shared/types.js'
import { ID_LENGTH } from '../../../shared/constants.js'
import { getDb } from '../index.js'

function extractReplyCount(row: any): number {
  // When selecting `replies(count)` via PostgREST relationship embedding,
  // this often comes back as `replies: [{ count: 3 }]`.
  const rel = row?.replies
  if (Array.isArray(rel) && rel.length > 0 && rel[0] && rel[0].count != null) {
    return Number(rel[0].count)
  }
  return 0
}

export async function getPosts(limit = 50, offset = 0): Promise<Post[]> {
  const db = getDb()
  const { data, error } = await db
    .from('posts')
    .select('id, author_id, content, signature, created_at, replies(count)')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw new Error(error.message)
  const rows = data || []

  return rows.map((r: any) => ({
    id: r.id as string,
    authorId: r.author_id as string,
    content: r.content as string,
    signature: r.signature as string,
    createdAt: String(r.created_at),
    replyCount: extractReplyCount(r),
  }))
}

export async function getPostById(id: string): Promise<Post | null> {
  const db = getDb()
  const { data, error } = await db
    .from('posts')
    .select('id, author_id, content, signature, created_at, replies(count)')
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

  const r: any = data
  return {
    id: r.id as string,
    authorId: r.author_id as string,
    content: r.content as string,
    signature: r.signature as string,
    createdAt: String(r.created_at),
    replyCount: extractReplyCount(r),
  }
}

export async function createPost(
  authorId: string,
  content: string,
  signature: string
): Promise<Post> {
  const id = nanoid(ID_LENGTH)
  const db = getDb()

  const { data, error } = await db
    .from('posts')
    .insert([{ id, author_id: authorId, content, signature }])
    .select('id, author_id, content, signature, created_at')
    .single()

  if (error) throw new Error(error.message)

  return {
    id: data.id as string,
    authorId: data.author_id as string,
    content: data.content as string,
    signature: data.signature as string,
    createdAt: String(data.created_at),
    replyCount: 0,
  }
}

export async function deletePost(id: string): Promise<boolean> {
  const db = getDb()
  const { error } = await db.from('posts').delete().eq('id', id)
  if (error) throw new Error(error.message)
  return true
}
