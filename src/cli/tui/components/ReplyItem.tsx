import React from 'react'
import { Box, Text } from 'ink'
import type { Reply } from '../../../shared/types.js'

interface ReplyItemProps {
  reply: Reply
  isSelected: boolean
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))

  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}

export function ReplyItem({ reply, isSelected }: ReplyItemProps) {
  const indent = '  '.repeat(reply.depth)

  return (
    <Box flexDirection="column">
      <Box>
        <Text color="gray">{indent}├─ </Text>
        <Text color={isSelected ? 'cyan' : 'white'} bold>
          {reply.authorId}
        </Text>
        <Text color="gray"> · {formatDate(reply.createdAt)}</Text>
      </Box>
      <Box>
        <Text color="gray">{indent}│  </Text>
        <Text color={isSelected ? 'white' : 'gray'}>{reply.content}</Text>
      </Box>
    </Box>
  )
}
