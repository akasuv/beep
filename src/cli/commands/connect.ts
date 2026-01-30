import chalk from 'chalk'
import { setServer, loadConfig } from '../lib/config.js'

export async function connect(serverUrl?: string): Promise<void> {
  if (!serverUrl) {
    const config = loadConfig()
    console.log(chalk.bold('Current server:'), chalk.blue(config.server))
    return
  }

  try {
    new URL(serverUrl)
  } catch {
    console.log(chalk.red('Invalid URL format'))
    return
  }

  setServer(serverUrl)
  console.log(chalk.green(`Server set to: ${serverUrl}`))
}
