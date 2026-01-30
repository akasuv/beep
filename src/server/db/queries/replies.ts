import { nanoid } from 'nanoid'
import type { Reply } from '../../../shared/types.js'
import { ID_LENGTH } from '../../../shared/constants.js'
import { getDb } from '../index.js'

export async function getRepliesByPostId(postId: string): Promise<Reply[]> {
  const db = getDb()
  const { data, error } = await db
    .from('replies')
    .select('id, post_id, parent_id, author_id, content, signature, created_at, depth')
    .eq('post_id', postId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  const rows = data || []

  return rows.map((r: any) => ({
    id: r.id as string,
    postId: r.post_id as string,
    parentId: (r.parent_id as string) ?? null,
    authorId: r.author_id as string,
    content: r.content as string,
    signature: r.signature as string,
    createdAt: String(r.created_at),
    depth: Number(r.depth),
  }))
}

export async function getReplyById(id: string): Promise<Reply | null> {
  const db = getDb()
  const { data, error } = await db
    .from('replies')
    .select('id, post_id, parent_id, author_id, content, signature, created_at, depth')
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

  const r: any = data
  return {
    id: r.id as string,
    postId: r.post_id as string,
    parentId: (r.parent_id as string) ?? null,
    authorId: r.author_id as string,
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
  const id = nanoid(ID_LENGTH)
  const db = getDb()

  let depth = 0
  if (parentId) {
    const parent = await getReplyById(parentId)
    if (parent) {
      depth = parent.depth + 1
    }
  }

  const { data, error } = await db
    .from('replies')
    .insert([
      {
        id,
        post_id: postId,
        parent_id: parentId ?? null,
        author_id: authorId,
        content,
        signature,
        depth,
      },
    ])
    .select('id, post_id, parent_id, author_id, content, signature, created_at, depth')
    .single()

  if (error) throw new Error(error.message)

  return {
    id: data.id as string,
    postId: data.post_id as string,
    parentId: (data.parent_id as string) ?? null,
    authorId: data.author_id as string,
    content: data.content as string,
    signature: data.signature as string,
    createdAt: String(data.created_at),
    depth: Number(data.depth),
  }
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
