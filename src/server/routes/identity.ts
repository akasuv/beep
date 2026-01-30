import { Hono } from 'hono'
import type {
  ApiResponse,
  Identity,
  RegisterIdentityRequest,
} from '../../shared/types.js'
import {
  getIdentityByPublicKey,
  getOrCreateIdentity,
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
  const { publicKey } = body

  if (!publicKey) {
    return c.json<ApiResponse<null>>({ success: false, error: 'Public key is required' }, 400)
  }

  const existing = await getOrCreateIdentity(publicKey)
  return c.json<ApiResponse<Identity>>({ success: true, data: existing })
})

export default identity
