import { Database } from 'duckdb-async'
import { existsSync, mkdirSync } from 'fs'
import { dirname } from 'path'
import { DB_FILE_PATH } from '../../shared/constants.js'
import { SCHEMA_SQL } from './schema.js'

let db: Database | null = null

export async function getDb(): Promise<Database> {
  if (db) return db

  const dir = dirname(DB_FILE_PATH)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  db = await Database.create(DB_FILE_PATH)
  await db.exec(SCHEMA_SQL)
  return db
}

export async function closeDb(): Promise<void> {
  if (db) {
    await db.close()
    db = null
  }
}
