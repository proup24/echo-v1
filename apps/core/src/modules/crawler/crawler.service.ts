import { Injectable, Logger } from '@nestjs/common'
import { FirecrawlService } from './firecrawl.service'
import type { CrawlResult } from './crawler.types'

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

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name)

  constructor(private firecrawlService: FirecrawlService) {}

  async crawlAccountWebsite(websiteUrl: string): Promise<CrawlResult> {
    this.logger.log(`Starting crawl for: ${websiteUrl}`)

    const normalizedUrl = this.normalizeUrl(websiteUrl)

    // 1. Discover URLs
    const discoveredUrls = await this.firecrawlService.mapSite(normalizedUrl)

    // 2. Filter and limit
    const selectedUrls = this.filterAndLimitUrls(discoveredUrls, normalizedUrl)
    this.logger.log(
      `Selected ${selectedUrls.length} of ${discoveredUrls.length} discovered URLs`
    )

    // 3. Scrape selected pages
    const scrapeResults = await this.firecrawlService.scrapePages(selectedUrls)

    if (scrapeResults.length === 0) {
      throw new Error(`No pages were successfully scraped for ${websiteUrl}`)
    }

    // 4. Merge into single markdown
    const mergedMarkdown = scrapeResults
      .map((r) => `## ${r.title || r.url}\n\n${r.markdown}`)
      .join('\n\n---\n\n')

    this.logger.log(`Crawl complete: ${scrapeResults.length} pages scraped`)

    return {
      website: websiteUrl,
      sourceUrls: scrapeResults.map((r) => r.url),
      mergedMarkdown
    }
  }

  private normalizeUrl(url: string): string {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`
    }
    return url.replace(/\/+$/, '')
  }

  private filterAndLimitUrls(urls: string[], baseUrl: string): string[] {
    // Always include the homepage
    const homepage = baseUrl.replace(/\/+$/, '')
    const filtered = urls.filter(
      (url) => !SKIP_PATTERNS.some((pattern) => pattern.test(url))
    )

    // Ensure homepage is first
    const withHomepage = [
      homepage,
      ...filtered.filter((u) => u.replace(/\/+$/, '') !== homepage)
    ]

    // Dynamic page limits
    const totalDiscovered = urls.length
    let maxPages: number
    if (totalDiscovered < 20) {
      maxPages = 15
    } else if (totalDiscovered <= 100) {
      maxPages = 15
    } else {
      maxPages = 12
    }

    return withHomepage.slice(0, maxPages)
  }
}
