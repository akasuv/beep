import React from 'react'
import { Box, Text } from 'ink'
import type { Post } from '../../../shared/types.js'

interface PostItemProps {
  post: Post
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

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + '...'
}

export function PostItem({ post, isSelected }: PostItemProps) {
  const author = post.authorName || post.authorId
  const preview = truncate(post.content.replace(/\n/g, ' '), 50)

  return (
    <Box flexDirection="column">
      <Box>
        <Text color={isSelected ? 'cyan' : 'white'}>
          {isSelected ? '> ' : '  '}
        </Text>
        <Text bold color={isSelected ? 'cyan' : 'white'}>
          {author}
        </Text>
        <Text color="gray"> · {formatDate(post.createdAt)}</Text>
        {post.replyCount > 0 && (
          <Text color="yellow"> [{post.replyCount}]</Text>
        )}
      </Box>
      <Box marginLeft={2}>
        <Text color={isSelected ? 'white' : 'gray'}>{preview}</Text>
      </Box>
    </Box>
  )
}
