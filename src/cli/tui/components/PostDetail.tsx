import React from 'react'
import { Box, Text } from 'ink'
import type { Post, Reply } from '../../../shared/types.js'
import { ReplyTree } from './ReplyTree.js'

interface PostDetailProps {
  post: Post
  replies: Reply[]
  selectedReplyIndex: number
  loadingReplies: boolean
  repliesError?: string
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString()
}

export function PostDetail({
  post,
  replies,
  selectedReplyIndex,
  loadingReplies,
  repliesError,
}: PostDetailProps) {
  return (
    <Box flexDirection="column">
      <Box flexDirection="column" marginBottom={1}>
        <Box>
          <Text bold color="cyan">
            {post.authorId}
          </Text>
          <Text color="gray"> · {formatDate(post.createdAt)}</Text>
        </Box>
        <Box marginTop={1}>
          <Text>{post.content}</Text>
        </Box>
        <Box marginTop={1}>
          <Text color="gray">ID: {post.id}</Text>
        </Box>
      </Box>

      <ReplyTree
        replies={replies}
        selectedIndex={selectedReplyIndex}
        loading={loadingReplies}
        error={repliesError}
      />
    </Box>
  )
}
