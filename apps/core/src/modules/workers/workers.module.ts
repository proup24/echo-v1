import { Module, OnModuleInit, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { BullModule } from '@nestjs/bullmq'
import { DiscoveryEngineModule } from './discovery-engine/discovery-engine.module'
import { SegMatcherModule } from './seg-matcher/seg-matcher.module'
import { LinkedInAccountWorkerModule } from './linkedin-account-worker/linkedin-account-worker.module'
import { AccountWorkerModule } from './account-worker/account-worker.module'

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
          maxRetriesPerRequest: null,
          enableReadyCheck: true
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000
          },
          removeOnComplete: true
        }
      })
    }),
    AccountWorkerModule,
    DiscoveryEngineModule,
    SegMatcherModule,
    LinkedInAccountWorkerModule
  ],
  exports: [
    AccountWorkerModule,
    DiscoveryEngineModule,
    SegMatcherModule,
    LinkedInAccountWorkerModule
  ]
})
export class WorkersModule implements OnModuleInit {
  private readonly logger = new Logger(WorkersModule.name)

  async onModuleInit() {
    this.logger.log('WorkersModule dependencies initialized.')
  }
}
