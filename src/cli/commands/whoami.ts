import chalk from 'chalk'
import { ensureIdentity } from '../lib/config.js'
import { publicKeyToIdentityId } from '../../shared/crypto.js'
import { registerIdentity } from '../lib/api-client.js'

export async function whoami(): Promise<void> {
  const config = await ensureIdentity()

  if (!config.identity) {
    console.log(chalk.red('Failed to generate identity'))
    return
  }

  const { publicKey, displayName } = config.identity
  const identityId = publicKeyToIdentityId(publicKey)

  console.log(chalk.bold('Your identity:'))
  console.log(`  ID:          ${chalk.cyan(identityId)}`)
  console.log(`  Public Key:  ${chalk.dim(publicKey.slice(0, 16))}...`)

  if (displayName) {
    console.log(`  Name:        ${chalk.green(displayName)}`)
  } else {
    console.log(`  Name:        ${chalk.dim('(not set)')}`)
  }

  console.log(`  Server:      ${chalk.blue(config.server)}`)

  const response = await registerIdentity({
    publicKey,
    displayName,
  })

  if (response.success) {
    console.log(chalk.dim('\nIdentity registered with server.'))
  } else {
    console.log(chalk.yellow(`\nNote: Could not register with server: ${response.error}`))
  }
}
