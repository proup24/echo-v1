import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { getSupabaseClient } from '@echo/supabase-client';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Global()
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  providers: [
    {
      provide: 'SUPABASE_CLIENT',
      useFactory: () => getSupabaseClient(),
    },
    AppService
  ],
  controllers: [AppController],
  exports: ['SUPABASE_CLIENT'],
})
export class AppModule {}
