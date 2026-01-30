import type { Identity } from '../../../shared/types.js'
import { generateUserId } from '../../../shared/crypto.js'
import { getDb } from '../index.js'

export async function getIdentityByPublicKey(publicKey: string): Promise<Identity | null> {
  const db = getDb()
  const { data, error } = await db
    .from('identities')
    .select('id, public_key, created_at')
    .eq('public_key', publicKey)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

  return {
    id: data.id as string,
    publicKey: data.public_key as string,
    createdAt: String(data.created_at),
  }
}

export async function getIdentityById(id: string): Promise<Identity | null> {
  const db = getDb()
  const { data, error } = await db
    .from('identities')
    .select('id, public_key, created_at')
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

  return {
    id: data.id as string,
    publicKey: data.public_key as string,
    createdAt: String(data.created_at),
  }
}

export async function createIdentity(publicKey: string): Promise<Identity> {
  const id = generateUserId()
  const db = getDb()

  const { data, error } = await db
    .from('identities')
    .insert([{ id, public_key: publicKey }])
    .select('id, public_key, created_at')
    .single()

  if (error) throw new Error(error.message)

  return {
    id: data.id as string,
    publicKey: data.public_key as string,
    createdAt: String(data.created_at),
  }
}

export async function getOrCreateIdentity(publicKey: string): Promise<Identity> {
  const existing = await getIdentityByPublicKey(publicKey)
  if (existing) return existing

  try {
    return await createIdentity(publicKey)
  } catch {
    // In case of a race / unique constraint on public_key
    const again = await getIdentityByPublicKey(publicKey)
    if (again) return again
    throw new Error('Failed to create identity')
  }
}
