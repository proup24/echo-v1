import { Injectable, Logger } from '@nestjs/common'
import { FirecrawlService } from './firecrawl.service'
import { UrlIndustryClassifierService } from './url-industry-classifier.service'
import type { CrawlResult } from './crawler.types'

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name)

  constructor(
    private firecrawlService: FirecrawlService,
    private urlIndustryClassifierService: UrlIndustryClassifierService
  ) {}

  async crawlAccountWebsite(websiteUrl: string): Promise<CrawlResult> {
    this.logger.log(`Starting crawl for: ${websiteUrl}`)

    const normalizedUrl = this.normalizeUrl(websiteUrl)

    // 1. Discover URLs
    const discoveredUrls = await this.firecrawlService.mapSite(normalizedUrl)

    // 2. Classify and select relevant URLs
    const selectedUrls = await this.selectRelevantUrls(
      discoveredUrls,
      normalizedUrl
    )
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

  private async selectRelevantUrls(
    urls: string[],
    baseUrl: string
  ): Promise<string[]> {
    const classified = await this.urlIndustryClassifierService.classifyUrls(
      urls,
      baseUrl
    )

    // Keep only URLs in relevant categories, sorted by path depth (shallowest first)
    const kept = classified
      .filter((c) =>
        this.urlIndustryClassifierService.isKeepCategory(c.category)
      )
      .sort((a, b) => this.getPathDepth(a.url) - this.getPathDepth(b.url))

    const homepage = baseUrl.replace(/\/+$/, '')
    const selected = new Set<string>()

    // 1. Homepage always first
    selected.add(homepage)

    // 2. One page per category — pick the shallowest URL for each
    for (const entry of kept) {
      const normalized = entry.url.replace(/\/+$/, '')
      if (normalized === homepage) continue

      const categoryAlreadyPicked = [...selected].some((url) =>
        kept.find(
          (c) =>
            c.url === url && c.category === entry.category && url !== homepage
        )
      )

      if (!categoryAlreadyPicked) {
        selected.add(entry.url)
      }
    }

    // 3. Fill up to 10 additional pages, shallowest first
    const additionalBudget = 10
    let added = 0
    for (const entry of kept) {
      if (added >= additionalBudget) break
      if (!selected.has(entry.url)) {
        selected.add(entry.url)
        added++
      }
    }

    // Return with homepage first, rest in selection order
    return [homepage, ...[...selected].filter((u) => u !== homepage)]
  }

  private getPathDepth(url: string): number {
    try {
      return new URL(url).pathname.split('/').filter(Boolean).length
    } catch {
      return url.split('/').filter(Boolean).length
    }
  }
}
