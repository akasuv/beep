import React from 'react'
import { Box, Text } from 'ink'
import TextInput from 'ink-text-input'

interface ComposerProps {
  mode: 'post' | 'comment'
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onCancel: () => void
  replyingTo?: string
  submitting?: boolean
  error?: string
}

export function Composer({
  mode,
  value,
  onChange,
  onSubmit,
  onCancel,
  replyingTo,
  submitting = false,
  error,
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
          {mode === 'post' ? 'New Post' : `Comment to ${replyingTo}`}
        </Text>
      </Box>

      <Box>
        <Text color="gray">&gt; </Text>
        <TextInput
          value={value}
          onChange={(next) => {
            if (!submitting) onChange(next)
          }}
          onSubmit={() => {
            if (!submitting) handleSubmit()
          }}
        />
      </Box>

      <Box marginTop={1}>
        {error ? <Text color="red">Error: {error}</Text> : null}
        {submitting ? <Text color="yellow">Submitting...</Text> : <Text color="gray">Enter to submit · Esc to cancel</Text>}
      </Box>
    </Box>
  )
}
