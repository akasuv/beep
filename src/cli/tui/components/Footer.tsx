import React from 'react'
import { Box, Text } from 'ink'

interface FooterProps {
  hints: Array<{ key: string; action: string }>
}

export function Footer({ hints }: FooterProps) {
  return (
    <Box marginTop={1} flexDirection="column">
      <Text color="gray">{'─'.repeat(60)}</Text>
      <Box gap={2}>
        {hints.map(({ key, action }, index) => (
          <Box key={index}>
            <Text color="yellow">{key}</Text>
            <Text color="gray"> {action}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
