export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatOptions {
  model?: string
  maxTokens?: number
  temperature?: number
  system?: string
}

export interface ChatResponse {
  content: string
  inputTokens: number
  outputTokens: number
}
