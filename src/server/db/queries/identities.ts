import type { Identity } from '../../../shared/types.js'
import { publicKeyToIdentityId } from '../../../shared/crypto.js'
import { getDb } from '../index.js'

export async function getIdentityByPublicKey(publicKey: string): Promise<Identity | null> {
  const db = await getDb()
  const result = await db.all(
    `SELECT id, public_key, display_name, created_at FROM identities WHERE public_key = ?`,
    publicKey
  )
  if (result.length === 0) return null

  const row = result[0] as Record<string, unknown>
  return {
    id: row.id as string,
    publicKey: row.public_key as string,
    displayName: row.display_name as string | null,
    createdAt: String(row.created_at),
  }
}

export async function getIdentityById(id: string): Promise<Identity | null> {
  const db = await getDb()
  const result = await db.all(
    `SELECT id, public_key, display_name, created_at FROM identities WHERE id = ?`,
    id
  )
  if (result.length === 0) return null

  const row = result[0] as Record<string, unknown>
  return {
    id: row.id as string,
    publicKey: row.public_key as string,
    displayName: row.display_name as string | null,
    createdAt: String(row.created_at),
  }
}

export async function createIdentity(publicKey: string, displayName?: string): Promise<Identity> {
  const db = await getDb()
  const id = publicKeyToIdentityId(publicKey)

  await db.run(
    `INSERT INTO identities (id, public_key, display_name) VALUES (?, ?, ?)`,
    id,
    publicKey,
    displayName ?? null
  )

  const identity = await getIdentityById(id)
  if (!identity) throw new Error('Failed to create identity')
  return identity
}

export async function updateIdentityDisplayName(
  publicKey: string,
  displayName: string
): Promise<Identity | null> {
  const db = await getDb()
  await db.run(
    `UPDATE identities SET display_name = ? WHERE public_key = ?`,
    displayName,
    publicKey
  )
  return getIdentityByPublicKey(publicKey)
}

export async function getOrCreateIdentity(
  publicKey: string,
  displayName?: string
): Promise<Identity> {
  const existing = await getIdentityByPublicKey(publicKey)
  if (existing) return existing
  return createIdentity(publicKey, displayName)
}
