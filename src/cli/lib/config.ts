import { readFileSync, writeFileSync, existsSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'
import { parse, stringify } from 'yaml'
import type { Config } from '../../shared/types.js'
import { CONFIG_FILE_NAME, DEFAULT_SERVER_URL } from '../../shared/constants.js'
import { generateKeyPair } from '../../shared/crypto.js'

const CONFIG_PATH = join(homedir(), CONFIG_FILE_NAME)

export function getConfigPath(): string {
  return CONFIG_PATH
}

export function loadConfig(): Config {
  if (!existsSync(CONFIG_PATH)) {
    return { server: DEFAULT_SERVER_URL }
  }

  try {
    const content = readFileSync(CONFIG_PATH, 'utf-8')
    const config = parse(content) as Partial<Config>
    const LEGACY_LOCAL_SERVER_URL = 'http://localhost:3000'

    let server = config.server || DEFAULT_SERVER_URL
    // One-time migration: move old default (local) to new default (hosted)
    if (server === LEGACY_LOCAL_SERVER_URL) {
      server = DEFAULT_SERVER_URL
    }

    const normalized: Config = {
      server,
      identity: config.identity,
    }

    // Persist migration if we changed the server value
    if (normalized.server !== config.server) {
      saveConfig(normalized)
    }

    return normalized
  } catch {
    return { server: DEFAULT_SERVER_URL }
  }
}

export function saveConfig(config: Config): void {
  const content = stringify(config)
  writeFileSync(CONFIG_PATH, content, 'utf-8')
}

export async function ensureIdentity(): Promise<Config> {
  const config = loadConfig()

  if (!config.identity) {
    const keyPair = await generateKeyPair()
    config.identity = {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
    }
    saveConfig(config)
  }

  return config
}

export function setServer(serverUrl: string): Config {
  const config = loadConfig()
  config.server = serverUrl
  saveConfig(config)
  return config
}
