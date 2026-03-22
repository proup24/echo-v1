export interface ScrapeResult {
  url: string
  markdown: string
  title?: string
  description?: string
}

export interface CrawlResult {
  website: string
  sourceUrls: string[]
  mergedMarkdown: string
}
