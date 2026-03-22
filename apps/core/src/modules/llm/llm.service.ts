import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Anthropic from '@anthropic-ai/sdk'
import type { ChatMessage, ChatOptions, ChatResponse } from './llm.types'
import type { PromptResult } from './prompt.types'

const DEFAULT_MODEL = 'claude-haiku-3-5-20241022'
const DEFAULT_MAX_TOKENS = 1024

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name)
  private readonly client: Anthropic

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.getOrThrow<string>('ANTHROPIC_API_KEY')
    this.client = new Anthropic({ apiKey })
  }

  async chat(
    messages: ChatMessage[],
    options?: ChatOptions
  ): Promise<ChatResponse> {
    const response = await this.client.messages.create({
      model: options?.model ?? DEFAULT_MODEL,
      max_tokens: options?.maxTokens ?? DEFAULT_MAX_TOKENS,
      temperature: options?.temperature ?? 0,
      system: options?.system ?? undefined,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content
      }))
    })

    const content =
      response.content[0].type === 'text' ? response.content[0].text : ''

    return {
      content,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens
    }
  }

  async chatJson<T>(prompt: string, options?: ChatOptions): Promise<T> {
    const response = await this.chat(
      [{ role: 'user', content: prompt }],
      options
    )

    const cleaned = response.content
      .replace(/^```json?\n?/, '')
      .replace(/\n?```$/, '')
      .trim()

    return JSON.parse(cleaned) as T
  }

  async chatFromPrompt<T>(
    prompt: PromptResult,
    options?: Omit<ChatOptions, 'system'>
  ): Promise<T> {
    return this.chatJson<T>(prompt.user, {
      ...options,
      system: prompt.system
    })
  }
}
