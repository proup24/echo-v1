import { Module } from '@nestjs/common'
import { LlmModule } from '../llm/llm.module'
import { FirecrawlService } from './firecrawl.service'
import { UrlIndustryClassifierService } from './url-industry-classifier.service'
import { CrawlerService } from './crawler.service'

@Module({
  imports: [LlmModule],
  providers: [FirecrawlService, UrlIndustryClassifierService, CrawlerService],
  exports: [CrawlerService]
})
export class CrawlerModule {}
