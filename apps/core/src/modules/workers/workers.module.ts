import { Module } from '@nestjs/common'
import { DiscoveryEngineModule } from './discovery-engine/discovery-engine.module'
import { SegMatcherModule } from './seg-matcher/seg-matcher.module'
import { LinkedinAgentModule } from './linkedin-agent/linkedin-agent.module'

@Module({
  imports: [DiscoveryEngineModule, SegMatcherModule, LinkedinAgentModule],
  exports: [DiscoveryEngineModule, SegMatcherModule, LinkedinAgentModule]
})
export class WorkersModule {}
