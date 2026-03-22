import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import FirecrawlApp from '@mendable/firecrawl-js'
import type { ScrapeResult } from './crawler.types'

@Injectable()
export class FirecrawlService {
  private readonly logger = new Logger(FirecrawlService.name)
  private readonly client: FirecrawlApp

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.getOrThrow<string>('FIRECRAWL_API_KEY')
    this.client = new FirecrawlApp({ apiKey })
  }

  async mapSite(url: string): Promise<string[]> {
    this.logger.log(`Mapping site: ${url}`)

    const response = await this.client.mapUrl(url)

    if (!response.success) {
      this.logger.warn(`Map failed for ${url}: ${response.error}`)
      return [url]
    }

    const urls = response.links ?? []
    this.logger.log(`Discovered ${urls.length} URLs for ${url}`)
    return urls
  }

  async scrapePage(url: string): Promise<ScrapeResult> {
    const response = await this.client.scrapeUrl(url, {
      formats: ['markdown']
    })

    if (!response.success) {
      throw new Error(`Scrape failed for ${url}: ${response.error}`)
    }

    return {
      url,
      markdown: response.markdown ?? '',
      title: response.metadata?.title,
      description: response.metadata?.description
    }
  }

  async scrapePages(urls: string[]): Promise<ScrapeResult[]> {
    const results: ScrapeResult[] = []

    for (const url of urls) {
      try {
        const result = await this.scrapePage(url)
        results.push(result)
      } catch (error) {
        this.logger.warn(
          `Failed to scrape ${url}: ${error instanceof Error ? error.message : error}`
        )
      }

      if (urls.indexOf(url) < urls.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 350))
      }
    }

    return results
  }
}
