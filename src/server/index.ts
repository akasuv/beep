import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { SERVER_PORT } from '../shared/constants.js'
import { getDb, closeDb } from './db/index.js'
import identityRoutes from './routes/identity.js'
import postsRoutes from './routes/posts.js'

const app = new Hono()

app.use('*', logger())
app.use('*', cors())

app.get('/', (c) => {
  return c.json({
    name: 'Beep API',
    version: '0.1.0',
    endpoints: {
      identity: '/api/identity',
      posts: '/api/posts',
    },
  })
})

app.route('/api/identity', identityRoutes)
app.route('/api/posts', postsRoutes)

app.notFound((c) => {
  return c.json({ success: false, error: 'Not found' }, 404)
})

app.onError((err, c) => {
  console.error('Server error:', err)
  return c.json({ success: false, error: 'Internal server error' }, 500)
})

async function main() {
  await getDb()
  console.log(`🔊 Beep server running on http://localhost:${SERVER_PORT}`)

  serve({
    fetch: app.fetch,
    port: SERVER_PORT,
  })
}

process.on('SIGINT', async () => {
  console.log('\nShutting down...')
  await closeDb()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await closeDb()
  process.exit(0)
})

main().catch(console.error)
