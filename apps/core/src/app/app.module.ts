import { Module, Global } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { getSupabaseClient } from '@echo/supabase-client'
import { WorkersModule } from 'src/modules/workers/workers.module'

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    })
  ],
  providers: [
    {
      provide: 'SUPABASE_CLIENT',
      useFactory: () => getSupabaseClient()
    },
    WorkersModule
  ],
  exports: ['SUPABASE_CLIENT']
})
export class AppModule {}
