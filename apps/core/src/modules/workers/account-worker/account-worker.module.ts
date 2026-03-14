import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { GENERATE_ACCOUNT_PRESET } from './processors'
import { AccountWorkerProcessor } from './account-worker.processor'

@Module({
  imports: [
    BullModule.registerQueue({
      name: GENERATE_ACCOUNT_PRESET
    })
  ],
  providers: [AccountWorkerProcessor],
  exports: [BullModule]
})
export class AccountWorkerModule {}
