import 'dotenv/config'
import { existsSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import { Database } from 'duckdb-async'
import { DB_FILE_PATH } from '../src/shared/constants.js'

type IdentityRow = {
  id: string
  public_key: string
  created_at: string
}

type PostRow = {
  id: string
  author_id: string
  content: string
  signature: string
  created_at: string
}

type ReplyRow = {
  id: string
  post_id: string
  parent_id: string | null
  author_id: string
  content: string
  signature: string
  created_at: string
  depth: number
}

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return v
}

function requireOneOfEnv(names: string[]): { name: string; value: string } {
  for (const name of names) {
    const value = process.env[name]
    if (value) return { name, value }
  }
  throw new Error(`Missing required env var. Set one of: ${names.join(', ')}`)
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

async function upsertAll<T extends Record<string, unknown>>(
  table: string,
  rows: T[],
  onConflict: string
) {
  if (rows.length === 0) return

  // Supabase PostgREST has payload limits; keep batches small.
  for (const batch of chunk(rows, 500)) {
    const { error } = await supabase.from(table).upsert(batch as never, { onConflict })
    if (error) throw new Error(`Upsert into ${table} failed: ${error.message}`)
  }
}

const supabaseUrl = requireEnv('SUPABASE_URL')
const { value: supabaseServiceRoleKey } = requireOneOfEnv([
  // Preferred (matches Supabase docs naming)
  'SUPABASE_SERVICE_ROLE_KEY',
  // Common alternative naming
  'SUPABASE_SECRET_KEY',
  // Legacy / generic
  'SUPABASE_KEY',
])

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function main() {
  if (!existsSync(DB_FILE_PATH)) {
    throw new Error(`DuckDB file not found at: ${DB_FILE_PATH}`)
  }

  const db = await Database.create(DB_FILE_PATH)
  try {
    const identities = (await db.all(
      `select id, public_key, created_at from identities`
    )) as unknown as IdentityRow[]

    const posts = (await db.all(
      `select id, author_id, content, signature, created_at from posts`
    )) as unknown as PostRow[]

    const replies = (await db.all(
      `select id, post_id, parent_id, author_id, content, signature, created_at, depth from replies`
    )) as unknown as ReplyRow[]

    console.log(
      `Migrating to Supabase: identities=${identities.length}, posts=${posts.length}, replies=${replies.length}`
    )

    // Order matters due to FKs
    await upsertAll('identities', identities, 'id')
    await upsertAll('posts', posts, 'id')
    await upsertAll('replies', replies, 'id')

    console.log('Done.')
  } finally {
    await db.close()
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})

