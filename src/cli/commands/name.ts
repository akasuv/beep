import chalk from 'chalk'
import { ensureIdentity, setDisplayName } from '../lib/config.js'
import { sign } from '../../shared/crypto.js'
import { updateIdentity } from '../lib/api-client.js'

export async function name(displayName: string): Promise<void> {
  if (!displayName || displayName.trim().length === 0) {
    console.log(chalk.red('Display name cannot be empty'))
    return
  }

  const config = await ensureIdentity()

  if (!config.identity) {
    console.log(chalk.red('No identity found'))
    return
  }

  const { publicKey, privateKey } = config.identity
  const signature = await sign(displayName, privateKey)

  const response = await updateIdentity({
    publicKey,
    displayName,
    signature,
  })

  if (response.success) {
    setDisplayName(displayName)
    console.log(chalk.green(`Display name set to: ${displayName}`))
  } else {
    console.log(chalk.red(`Failed to update name: ${response.error}`))
  }
}
