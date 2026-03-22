import { Module } from '@nestjs/common'
import { FirecrawlService } from './firecrawl.service'
import { CrawlerService } from './crawler.service'

@Module({
  providers: [FirecrawlService, CrawlerService],
  exports: [CrawlerService]
})
export class CrawlerModule {}
