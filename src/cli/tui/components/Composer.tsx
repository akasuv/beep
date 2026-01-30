import React from 'react'
import { Box, Text } from 'ink'
import TextInput from 'ink-text-input'

interface ComposerProps {
  mode: 'post' | 'reply'
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onCancel: () => void
  replyingTo?: string
}

export function Composer({
  mode,
  value,
  onChange,
  onSubmit,
  onCancel,
  replyingTo,
}: ComposerProps) {
  const handleSubmit = () => {
    if (value.trim()) {
      onSubmit()
    }
  }

  return (
    <Box flexDirection="column" borderStyle="single" paddingX={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          {mode === 'post' ? 'New Post' : `Reply to ${replyingTo}`}
        </Text>
      </Box>

      <Box>
        <Text color="gray">&gt; </Text>
        <TextInput
          value={value}
          onChange={onChange}
          onSubmit={handleSubmit}
        />
      </Box>

      <Box marginTop={1}>
        <Text color="gray">
          Enter to submit · Esc to cancel
        </Text>
      </Box>
    </Box>
  )
}
