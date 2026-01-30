import React from 'react'
import { Box, Text } from 'ink'

const BEEP_ASCII = `
██████╗ ███████╗███████╗██████╗
██╔══██╗██╔════╝██╔════╝██╔══██╗
██████╔╝█████╗  █████╗  ██████╔╝
██╔══██╗██╔══╝  ██╔══╝  ██╔═══╝
██████╔╝███████╗███████╗██║
╚═════╝ ╚══════╝╚══════╝╚═╝
`.trim()

interface HeaderProps {
  title: string
  subtitle?: string
  showLogo?: boolean
}

export function Header({ title, subtitle, showLogo = false }: HeaderProps) {
  return (
    <Box flexDirection="column" marginBottom={1}>
      {showLogo && (
        <Box marginBottom={1}>
          <Text color="cyan">{BEEP_ASCII}</Text>
        </Box>
      )}
      {!showLogo && (
        <Box>
          <Text bold color="cyan">
            {title}
          </Text>
          {subtitle && (
            <Text color="gray"> - {subtitle}</Text>
          )}
        </Box>
      )}
      {subtitle && showLogo && (
        <Text color="gray">{subtitle}</Text>
      )}
      <Text color="gray">{'─'.repeat(60)}</Text>
    </Box>
  )
}
