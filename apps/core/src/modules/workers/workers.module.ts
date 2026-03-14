import { Module, OnModuleInit, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { BullModule } from '@nestjs/bullmq'
import { DiscoveryEngineModule } from './discovery-engine/discovery-engine.module'
import { SegMatcherModule } from './seg-matcher/seg-matcher.module'
import { LinkedinAgentModule } from './linkedin-agent/linkedin-agent.module'

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
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
    DiscoveryEngineModule,
    SegMatcherModule,
    LinkedinAgentModule
  ],
  exports: [DiscoveryEngineModule, SegMatcherModule, LinkedinAgentModule]
})
export class WorkersModule implements OnModuleInit {
  private readonly logger = new Logger(WorkersModule.name)

  async onModuleInit() {
    this.logger.log('WorkersModule dependencies initialized.')
  }
}
