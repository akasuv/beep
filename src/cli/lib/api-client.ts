import type {
  ApiResponse,
  Identity,
  Post,
  Reply,
  CreatePostRequest,
  CreateReplyRequest,
  RegisterIdentityRequest,
  UpdateIdentityRequest,
} from '../../shared/types.js'
import { loadConfig } from './config.js'

function getBaseUrl(): string {
  const config = loadConfig()
  return config.server
}

async function fetchApi<T>(
  path: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const url = `${getBaseUrl()}${path}`

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    return (await response.json()) as ApiResponse<T>
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function getIdentity(publicKey: string): Promise<ApiResponse<Identity>> {
  return fetchApi<Identity>(`/api/identity/${publicKey}`)
}

export async function registerIdentity(
  data: RegisterIdentityRequest
): Promise<ApiResponse<Identity>> {
  return fetchApi<Identity>('/api/identity', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateIdentity(
  data: UpdateIdentityRequest
): Promise<ApiResponse<Identity>> {
  return fetchApi<Identity>('/api/identity', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function getPosts(
  limit = 50,
  offset = 0
): Promise<ApiResponse<Post[]>> {
  return fetchApi<Post[]>(`/api/posts?limit=${limit}&offset=${offset}`)
}

export async function getPost(id: string): Promise<ApiResponse<Post>> {
  return fetchApi<Post>(`/api/posts/${id}`)
}

export async function createPost(
  data: CreatePostRequest
): Promise<ApiResponse<Post>> {
  return fetchApi<Post>('/api/posts', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getReplies(
  postId: string,
  tree = false
): Promise<ApiResponse<Reply[]>> {
  return fetchApi<Reply[]>(`/api/posts/${postId}/replies?tree=${tree}`)
}

export async function createReply(
  postId: string,
  data: CreateReplyRequest
): Promise<ApiResponse<Reply>> {
  return fetchApi<Reply>(`/api/posts/${postId}/replies`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
