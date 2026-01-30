import React from 'react'
import { Box, Text } from 'ink'
import type { Post } from '../../../shared/types.js'
import { PostItem } from './PostItem.js'

interface PostListProps {
  posts: Post[]
  selectedIndex: number
  loading: boolean
  error?: string
}

export function PostList({ posts, selectedIndex, loading, error }: PostListProps) {
  if (loading) {
    return (
      <Box>
        <Text color="yellow">Loading posts...</Text>
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

  if (posts.length === 0) {
    return (
      <Box>
        <Text color="gray">No posts yet. Press 'n' to create the first post!</Text>
      </Box>
    )
  }

  return (
    <Box flexDirection="column" gap={1}>
      {posts.map((post, index) => (
        <PostItem key={post.id} post={post} isSelected={index === selectedIndex} />
      ))}
    </Box>
  )
}
