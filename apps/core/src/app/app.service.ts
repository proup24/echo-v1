import { Injectable, Inject } from '@nestjs/common'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@echo/supabase-client'

@Injectable()
export class AppService {
  constructor(
    @Inject('SUPABASE_CLIENT') private supabase: SupabaseClient<Database>
  ) {}

  async getAccounts() {
    const { data, error } = await this.supabase.from('account').select('*')
    if (error) throw error
    return data
  }
}
