import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Job } from 'bullmq'
import { Inject } from '@nestjs/common'
import type { TypedSupabaseClient } from '@echo/supabase-client'
import { GENERATE_ACCOUNT_PRESET } from './processors'

@Processor(GENERATE_ACCOUNT_PRESET)
export class AccountWorkerProcessor extends WorkerHost {
  constructor(
    @Inject('SUPABASE_CLIENT') private supabase: TypedSupabaseClient
  ) {
    super()
  }

  async process(job: Job<{ accountId: number }, any, string>): Promise<any> {
    const { accountId } = job.data

    await job.log(`Starting account preset generation for "${accountId}"`)

    const { data, error } = await this.supabase
      .from('account')
      .select('*')
      .eq('id', accountId)
      .maybeSingle()

    if (error) {
      await job.log(`Database error: ${error.message}`)
      throw error
    }

    return data
  }
}
