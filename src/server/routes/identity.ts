import { Hono } from 'hono'
import type {
  ApiResponse,
  Identity,
  RegisterIdentityRequest,
  UpdateIdentityRequest,
} from '../../shared/types.js'
import { verify } from '../../shared/crypto.js'
import {
  getIdentityByPublicKey,
  getOrCreateIdentity,
  updateIdentityDisplayName,
} from '../db/queries/index.js'

const identity = new Hono()

identity.get('/:publicKey', async (c) => {
  const publicKey = c.req.param('publicKey')
  const existing = await getIdentityByPublicKey(publicKey)

  if (!existing) {
    return c.json<ApiResponse<null>>({ success: false, error: 'Identity not found' }, 404)
  }

  return c.json<ApiResponse<Identity>>({ success: true, data: existing })
})

identity.post('/', async (c) => {
  const body = await c.req.json<RegisterIdentityRequest>()
  const { publicKey, displayName } = body

  if (!publicKey) {
    return c.json<ApiResponse<null>>({ success: false, error: 'Public key is required' }, 400)
  }

  const existing = await getOrCreateIdentity(publicKey, displayName)
  return c.json<ApiResponse<Identity>>({ success: true, data: existing })
})

identity.put('/', async (c) => {
  const body = await c.req.json<UpdateIdentityRequest>()
  const { publicKey, displayName, signature } = body

  if (!publicKey || !displayName || !signature) {
    return c.json<ApiResponse<null>>(
      { success: false, error: 'Public key, display name, and signature are required' },
      400
    )
  }

  const isValid = await verify(displayName, signature, publicKey)
  if (!isValid) {
    return c.json<ApiResponse<null>>({ success: false, error: 'Invalid signature' }, 401)
  }

  const existing = await getIdentityByPublicKey(publicKey)
  if (!existing) {
    return c.json<ApiResponse<null>>({ success: false, error: 'Identity not found' }, 404)
  }

  const updated = await updateIdentityDisplayName(publicKey, displayName)
  return c.json<ApiResponse<Identity | null>>({ success: true, data: updated })
})

export default identity
