import React from 'react'
import { Box, Text } from 'ink'
import type { Reply } from '../../../shared/types.js'
import { ReplyItem } from './ReplyItem.js'

interface ReplyTreeProps {
  replies: Reply[]
  selectedIndex: number
  loading: boolean
  error?: string
}

function flattenReplies(replies: Reply[]): Reply[] {
  const result: Reply[] = []
  for (const reply of replies) {
    result.push(reply)
    if (reply.children && reply.children.length > 0) {
      result.push(...flattenReplies(reply.children))
    }
  }
  return result
}

export function ReplyTree({ replies, selectedIndex, loading, error }: ReplyTreeProps) {
  if (loading) {
    return (
      <Box>
        <Text color="yellow">Loading replies...</Text>
      </Box>
    )
  }

  if (error) {
    return (
      <Box>
        <Text color="red">Error: {error}</Text>
      </Box>
    )
  }

  const flatReplies = flattenReplies(replies)

  if (flatReplies.length === 0) {
    return (
      <Box marginTop={1}>
        <Text color="gray">No replies yet. Press 'R' to add a reply!</Text>
      </Box>
    )
  }

  return (
    <Box flexDirection="column" marginTop={1} gap={1}>
      <Text bold>Replies ({flatReplies.length}):</Text>
      {flatReplies.map((reply, index) => (
        <ReplyItem key={reply.id} reply={reply} isSelected={index === selectedIndex} />
      ))}
    </Box>
  )
}
