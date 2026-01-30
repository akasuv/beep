import chalk from 'chalk'
import { ensureIdentity } from '../lib/config.js'
import { registerIdentity } from '../lib/api-client.js'

export async function whoami(): Promise<void> {
  const config = await ensureIdentity()

  if (!config.identity) {
    console.log(chalk.red('Failed to generate identity'))
    return
  }

  const { publicKey } = config.identity

  const response = await registerIdentity({ publicKey })

  if (response.success && response.data) {
    console.log(chalk.bold('Your identity:'))
    console.log(`  ID:          ${chalk.cyan(response.data.id)}`)
    console.log(`  Public Key:  ${chalk.dim(publicKey.slice(0, 16))}...`)
    console.log(`  Server:      ${chalk.blue(config.server)}`)
  } else {
    console.log(chalk.yellow(`Could not register with server: ${response.error}`))
  }
}
