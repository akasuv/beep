import React, { useState, useEffect, useCallback } from 'react'
import { render, Box, useInput } from 'ink'
import type { Post, Reply } from '../../shared/types.js'
import {
  getPosts,
  getPost,
  getReplies,
  createPost as apiCreatePost,
  createReply as apiCreateReply,
} from '../lib/api-client.js'
import { ensureIdentity } from '../lib/config.js'
import { sign } from '../../shared/crypto.js'
import { Header, Footer, PostList, PostDetail, Composer } from './components/index.js'

type Screen = 'list' | 'detail' | 'compose'

interface AppState {
  screen: Screen
  posts: Post[]
  selectedPostIndex: number
  selectedPost: Post | null
  replies: Reply[]
  selectedReplyIndex: number
  loading: boolean
  loadingReplies: boolean
  error?: string
  repliesError?: string
  composeMode: 'post' | 'reply'
  composeText: string
  submitting: boolean
}

function App() {
  const [state, setState] = useState<AppState>({
    screen: 'list',
    posts: [],
    selectedPostIndex: 0,
    selectedPost: null,
    replies: [],
    selectedReplyIndex: 0,
    loading: true,
    loadingReplies: false,
    composeMode: 'post',
    composeText: '',
    submitting: false,
  })

  const fetchPosts = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: undefined }))
    const response = await getPosts()
    if (response.success && response.data) {
      setState((s) => ({ ...s, posts: response.data!, loading: false }))
    } else {
      setState((s) => ({ ...s, loading: false, error: response.error }))
    }
  }, [])

  const fetchPostDetail = useCallback(async (postId: string) => {
    setState((s) => ({ ...s, loadingReplies: true, repliesError: undefined }))

    const [postResponse, repliesResponse] = await Promise.all([
      getPost(postId),
      getReplies(postId, true),
    ])

    if (postResponse.success && postResponse.data) {
      setState((s) => ({
        ...s,
        selectedPost: postResponse.data!,
        replies: repliesResponse.success && repliesResponse.data ? repliesResponse.data : [],
        loadingReplies: false,
        repliesError: repliesResponse.success ? undefined : repliesResponse.error,
      }))
    } else {
      setState((s) => ({
        ...s,
        loadingReplies: false,
        repliesError: postResponse.error,
      }))
    }
  }, [])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const handleSubmitPost = useCallback(async () => {
    if (!state.composeText.trim() || state.submitting) return

    setState((s) => ({ ...s, submitting: true }))

    try {
      const config = await ensureIdentity()
      if (!config.identity) {
        setState((s) => ({ ...s, submitting: false, screen: 'list', composeText: '' }))
        return
      }

      const { publicKey, privateKey } = config.identity
      const content = state.composeText.trim()
      const signature = await sign(content, privateKey)

      if (state.composeMode === 'post') {
        await apiCreatePost({ content, publicKey, signature })
        await fetchPosts()
      } else if (state.selectedPost) {
        await apiCreateReply(state.selectedPost.id, {
          content,
          postId: state.selectedPost.id,
          publicKey,
          signature,
        })
        await fetchPostDetail(state.selectedPost.id)
      }

      setState((s) => ({
        ...s,
        submitting: false,
        screen: state.composeMode === 'post' ? 'list' : 'detail',
        composeText: '',
      }))
    } catch {
      setState((s) => ({ ...s, submitting: false }))
    }
  }, [state.composeText, state.composeMode, state.selectedPost, state.submitting, fetchPosts, fetchPostDetail])

  useInput((input, key) => {
    if (state.screen === 'compose') {
      if (key.escape) {
        setState((s) => ({
          ...s,
          screen: s.composeMode === 'post' ? 'list' : 'detail',
          composeText: '',
        }))
      }
      return
    }

    if (input === 'j' || key.downArrow) {
      setState((s) => {
        if (s.screen === 'list') {
          const newIndex = Math.min(s.selectedPostIndex + 1, s.posts.length - 1)
          return { ...s, selectedPostIndex: newIndex }
        } else {
          const flatRepliesCount = countFlatReplies(s.replies)
          const newIndex = Math.min(s.selectedReplyIndex + 1, flatRepliesCount - 1)
          return { ...s, selectedReplyIndex: newIndex }
        }
      })
    } else if (input === 'k' || key.upArrow) {
      setState((s) => {
        if (s.screen === 'list') {
          const newIndex = Math.max(s.selectedPostIndex - 1, 0)
          return { ...s, selectedPostIndex: newIndex }
        } else {
          const newIndex = Math.max(s.selectedReplyIndex - 1, 0)
          return { ...s, selectedReplyIndex: newIndex }
        }
      })
    } else if (key.return) {
      if (state.screen === 'list' && state.posts.length > 0) {
        const post = state.posts[state.selectedPostIndex]
        fetchPostDetail(post.id)
        setState((s) => ({ ...s, screen: 'detail', selectedReplyIndex: 0 }))
      }
    } else if (input === 'b' || key.escape) {
      if (state.screen === 'detail') {
        setState((s) => ({ ...s, screen: 'list', selectedPost: null, replies: [] }))
      }
    } else if (input === 'q') {
      process.exit(0)
    } else if (input === 'r') {
      if (state.screen === 'list') {
        fetchPosts()
      } else if (state.selectedPost) {
        fetchPostDetail(state.selectedPost.id)
      }
    } else if (input === 'n') {
      setState((s) => ({ ...s, screen: 'compose', composeMode: 'post', composeText: '' }))
    } else if (input === 'R' && state.screen === 'detail' && state.selectedPost) {
      setState((s) => ({ ...s, screen: 'compose', composeMode: 'reply', composeText: '' }))
    }
  })

  const listHints = [
    { key: 'j/k', action: 'navigate' },
    { key: 'Enter', action: 'view' },
    { key: 'n', action: 'new post' },
    { key: 'r', action: 'refresh' },
    { key: 'q', action: 'quit' },
  ]

  const detailHints = [
    { key: 'j/k', action: 'navigate' },
    { key: 'R', action: 'reply' },
    { key: 'r', action: 'refresh' },
    { key: 'b', action: 'back' },
    { key: 'q', action: 'quit' },
  ]

  return (
    <Box flexDirection="column" padding={1}>
      {state.screen === 'list' && (
        <>
          <Header title="Beep" subtitle="Terminal Forum" showLogo />
          <PostList
            posts={state.posts}
            selectedIndex={state.selectedPostIndex}
            loading={state.loading}
            error={state.error}
          />
          <Footer hints={listHints} />
        </>
      )}

      {state.screen === 'detail' && (
        <>
          <Header title="Post Detail" />
          {state.selectedPost && (
            <PostDetail
              post={state.selectedPost}
              replies={state.replies}
              selectedReplyIndex={state.selectedReplyIndex}
              loadingReplies={state.loadingReplies}
              repliesError={state.repliesError}
            />
          )}
          <Footer hints={detailHints} />
        </>
      )}

      {state.screen === 'compose' && (
        <>
          <Header title="Beep" subtitle={state.composeMode === 'post' ? 'New Post' : 'Reply'} />
          <Composer
            mode={state.composeMode}
            value={state.composeText}
            onChange={(text) => setState((s) => ({ ...s, composeText: text }))}
            onSubmit={handleSubmitPost}
            onCancel={() =>
              setState((s) => ({
                ...s,
                screen: s.composeMode === 'post' ? 'list' : 'detail',
                composeText: '',
              }))
            }
            replyingTo={state.selectedPost?.authorName || state.selectedPost?.authorId}
          />
        </>
      )}
    </Box>
  )
}

function countFlatReplies(replies: Reply[]): number {
  let count = 0
  for (const reply of replies) {
    count++
    if (reply.children && reply.children.length > 0) {
      count += countFlatReplies(reply.children)
    }
  }
  return count
}

export async function renderTui() {
  render(<App />)
}
