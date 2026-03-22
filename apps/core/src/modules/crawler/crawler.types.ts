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

export type PageCategory =
  | 'homepage'
  | 'services'
  | 'products'
  | 'pricing'
  | 'about'
  | 'case_studies'
  | 'industries'
  | 'solutions'
  | 'other'

export interface ClassifiedUrl {
  url: string
  category: PageCategory
}
