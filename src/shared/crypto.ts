import * as ed from '@noble/ed25519'
import { createHash, randomBytes } from 'crypto'

export interface KeyPair {
  publicKey: string
  privateKey: string
}

export async function generateKeyPair(): Promise<KeyPair> {
  const privateKeyBytes = randomBytes(32)
  const publicKeyBytes = await ed.getPublicKeyAsync(privateKeyBytes)

  return {
    privateKey: Buffer.from(privateKeyBytes).toString('hex'),
    publicKey: Buffer.from(publicKeyBytes).toString('hex'),
  }
}

export async function sign(message: string, privateKey: string): Promise<string> {
  const messageBytes = new TextEncoder().encode(message)
  const privateKeyBytes = Buffer.from(privateKey, 'hex')
  const signature = await ed.signAsync(messageBytes, privateKeyBytes)
  return Buffer.from(signature).toString('hex')
}

export async function verify(
  message: string,
  signature: string,
  publicKey: string
): Promise<boolean> {
  try {
    const messageBytes = new TextEncoder().encode(message)
    const signatureBytes = Buffer.from(signature, 'hex')
    const publicKeyBytes = Buffer.from(publicKey, 'hex')
    return await ed.verifyAsync(signatureBytes, messageBytes, publicKeyBytes)
  } catch {
    return false
  }
}

export function publicKeyToIdentityId(publicKey: string): string {
  const hash = createHash('sha256').update(publicKey).digest('hex')
  return `anon_${hash.slice(0, 8)}`
}
