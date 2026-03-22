import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Job } from 'bullmq'
import { Inject } from '@nestjs/common'
import type { TypedSupabaseClient } from '@echo/supabase-client'
import { PROCESS_ACCOUNT_WEBSITE } from './processors'
import { CrawlerService } from '../../crawler/crawler.service'

const STORAGE_BUCKET = 'account-websites'

@Processor(PROCESS_ACCOUNT_WEBSITE)
export class AccountWorkerProcessor extends WorkerHost {
  constructor(
    @Inject('SUPABASE_CLIENT') private supabase: TypedSupabaseClient,
    private crawlerService: CrawlerService
  ) {
    super()
  }

  async process(job: Job<{ accountId: number }, any, string>): Promise<any> {
    const { accountId } = job.data

    await job.log(`Processing account website for "${accountId}"`)

    const { data, error } = await this.supabase
      .from('account')
      .select('*')
      .eq('id', accountId)
      .maybeSingle()

    if (error) {
      await job.log(`Database error: ${error.message}`)
      throw error
    }

    if (!data) {
      await job.log(`Account ${accountId} not found`)
      throw new Error(`Account ${accountId} not found`)
    }

    if (!data.website) {
      await job.log(`No website URL for account ${accountId}, skipping crawl`)
      return data
    }

    // 1. Crawl the website
    await job.log(`Crawling website: ${data.website}`)
    const crawlResult = await this.crawlerService.crawlAccountWebsite(
      data.website
    )
    await job.log(
      `Crawl complete: ${crawlResult.sourceUrls.length} pages scraped`
    )

    // 2. Upload merged markdown to Supabase Storage
    const storagePath = `${accountId}/website.md`
    const { error: uploadError } = await this.supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, crawlResult.mergedMarkdown, {
        contentType: 'text/markdown',
        upsert: true
      })

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`)
    }
    await job.log(`Uploaded markdown to ${storagePath}`)

    // 3. Upsert account_website row
    const { error: dbError } = await this.supabase
      .from('account_website')
      .upsert(
        {
          account_id: accountId,
          website: data.website,
          markdown_url: storagePath
        },
        { onConflict: 'account_id' }
      )

    if (dbError) {
      throw new Error(`Database upsert failed: ${dbError.message}`)
    }
    await job.log(`account_website record saved`)

    return data
  }
}
