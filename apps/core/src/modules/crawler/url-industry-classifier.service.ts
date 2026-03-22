import { Injectable, Logger } from '@nestjs/common'
import { LlmService } from '../llm/llm.service'
import { PromptService } from '../llm/prompt.service'
import type { ClassifiedUrl, PageCategory } from './crawler.types'

const SKIP_PATTERNS = [
  /\/blog/,
  /\/news/,
  /\/press/,
  /\/careers/,
  /\/jobs/,
  /\/team/,
  /\/people/,
  /\/legal/,
  /\/privacy/,
  /\/terms/,
  /\/cookie/,
  /\/support/,
  /\/help/,
  /\/docs/,
  /\/faq/,
  /\/login/,
  /\/signup/,
  /\/register/,
  /\/auth/
]

const HEURISTIC_CATEGORIES: {
  pattern: RegExp
  category: PageCategory
}[] = [
  { pattern: /\/services/, category: 'services' },
  { pattern: /\/products/, category: 'products' },
  { pattern: /\/pricing/, category: 'pricing' },
  { pattern: /\/about/, category: 'about' },
  { pattern: /\/case.?stud/, category: 'case_studies' },
  { pattern: /\/industr/, category: 'industries' },
  { pattern: /\/solution/, category: 'solutions' }
]

const KEEP_CATEGORIES: Set<PageCategory> = new Set([
  'homepage',
  'services',
  'products',
  'pricing',
  'about',
  'case_studies',
  'industries',
  'solutions'
])

@Injectable()
export class UrlIndustryClassifierService {
  private readonly logger = new Logger(UrlIndustryClassifierService.name)

  constructor(
    private llmService: LlmService,
    private promptService: PromptService
  ) {}

  async classifyUrls(
    urls: string[],
    baseUrl: string
  ): Promise<ClassifiedUrl[]> {
    try {
      const prompt = this.promptService.render('classify-industry-urls', {
        baseUrl,
        urls,
        categories: [...KEEP_CATEGORIES, 'other']
      })

      const classified = await this.llmService.chatFromPrompt<ClassifiedUrl[]>(
        prompt,
        { maxTokens: 4096 }
      )

      this.logger.log(
        `LLM classified ${classified.length} of ${urls.length} URLs`
      )

      // Merge in any URLs the LLM missed using heuristic fallback
      const classifiedUrlSet = new Set(classified.map((c) => c.url))
      const missing = urls.filter((u) => !classifiedUrlSet.has(u))

      if (missing.length > 0) {
        this.logger.warn(
          `LLM missed ${missing.length} URLs, applying heuristic fallback`
        )
        const heuristicResults = this.classifyUrlsHeuristic(missing, baseUrl)
        return [...classified, ...heuristicResults]
      }

      return classified
    } catch (error) {
      this.logger.warn(
        `LLM classification failed, falling back to heuristics: ${error instanceof Error ? error.message : error}`
      )
      return this.classifyUrlsHeuristic(urls, baseUrl)
    }
  }

  classifyUrlsHeuristic(urls: string[], baseUrl: string): ClassifiedUrl[] {
    const homepage = baseUrl.replace(/\/+$/, '')

    return urls.map((url) => {
      const normalized = url.replace(/\/+$/, '')

      if (normalized === homepage) {
        return { url, category: 'homepage' as PageCategory }
      }

      if (SKIP_PATTERNS.some((pattern) => pattern.test(url))) {
        return { url, category: 'other' as PageCategory }
      }

      const match = HEURISTIC_CATEGORIES.find((h) => h.pattern.test(url))
      if (match) {
        return { url, category: match.category }
      }

      return { url, category: 'other' as PageCategory }
    })
  }

  isKeepCategory(category: PageCategory): boolean {
    return KEEP_CATEGORIES.has(category)
  }
}
