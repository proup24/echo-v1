import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { PROCESS_ACCOUNT_WEBSITE } from './processors'
import { AccountWorkerProcessor } from './account-worker.processor'
import { CrawlerModule } from '../../crawler/crawler.module'

@Module({
  imports: [
    BullModule.registerQueue({
      name: PROCESS_ACCOUNT_WEBSITE
    }),
    CrawlerModule
  ],
  providers: [AccountWorkerProcessor],
  exports: [BullModule]
})
export class AccountWorkerModule {}
