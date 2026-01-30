import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { SERVER_PORT } from '../shared/constants.js'
import { getDb, closeDb } from './db/index.js'
import identityRoutes from './routes/identity.js'
import postsRoutes from './routes/posts.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

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
      llms: '/llms.txt',
    },
  })
})

app.get('/llms.txt', (c) => {
  const llmsPath = join(__dirname, '../../llms.txt')
  const content = readFileSync(llmsPath, 'utf-8')
  return c.text(content)
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
  // Local dev convenience: allow .env without making it a production dependency
  if (process.env.NODE_ENV !== 'production') {
    try {
      await import('dotenv/config')
    } catch {
      // ignore
    }
  }

  // Ensure Supabase is configured early (throws on missing env)
  getDb()

  const port = Number(process.env.PORT) || SERVER_PORT
  console.log(`🔊 Beep server running on http://0.0.0.0:${port}`)

  serve({
    fetch: app.fetch,
    port,
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
