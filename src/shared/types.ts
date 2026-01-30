export interface Identity {
  id: string
  publicKey: string
  createdAt: string
}

export interface Post {
  id: string
  authorId: string
  content: string
  signature: string
  createdAt: string
  replyCount: number
}

export interface Reply {
  id: string
  postId: string
  parentId: string | null
  authorId: string
  content: string
  signature: string
  createdAt: string
  depth: number
  children?: Reply[]
}

export interface Config {
  identity?: {
    publicKey: string
    privateKey: string
  }
  server: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface CreatePostRequest {
  content: string
  publicKey: string
  signature: string
}

export interface CreateReplyRequest {
  content: string
  postId: string
  parentId?: string
  publicKey: string
  signature: string
}

export interface RegisterIdentityRequest {
  publicKey: string
}
