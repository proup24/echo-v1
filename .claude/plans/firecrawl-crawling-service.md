# FireCrawl Website Crawling Service

## Context

Echo needs to understand B2B companies ("Accounts") by analyzing their websites. This service intelligently scrapes company websites — fetching only pages that contain positioning, services/products, pricing, and industry information. The crawl must be efficient and adaptive to website size (1000+ accounts at scale).

## Requirements

- Crawl account websites to extract company positioning, services, products, pricing, and industry focus
- Skip blogs, team pages, careers, legal/privacy, support docs
- Adapt crawl depth based on website size
- Store crawled content in Supabase Postgres for later LLM analysis
- Handle errors gracefully (individual page failures don't abort entire crawl)

## Design

### Strategy: LLM-Guided Adaptive Crawling

**3-phase pipeline per account:** Discover → Classify → Scrape

1. **Discover** — FireCrawl `/map` endpoint to get all discoverable URLs (1 credit)
2. **Classify** — Claude Haiku ranks URLs by relevance, categorizes them, filters noise
3. **Scrape** — FireCrawl `/scrape` on selected pages, extract markdown text

### Dynamic Page Limits

| Discovered URLs | Max Pages to Scrape |
|----------------|---------------------|
| < 20           | up to 15            |
| 20–100         | up to 15            |
| 100+           | up to 12            |

Always include homepage. Filter out URLs with relevance score < 20.

### Database Changes

New migration creating:

**`crawled_page` table:**
- `id` (int8 PK), `account_id` (FK → account), `url`, `category` (enum), `content_markdown`, `title`, `description`, `crawl_status`, `error_message`, `crawled_at`, `created_at`
- UNIQUE constraint on `(account_id, url)` for upsert support
- Indexes on `account_id` and `category`

**`account` table additions:**
- `crawl_status`, `crawl_completed_at`, `total_pages_discovered`, `total_pages_crawled`

**Page categories:** homepage, services, products, pricing, about, case_studies, industries, solutions, other

### New Files

| File | Purpose |
|------|---------|
| `apps/core/src/modules/crawler/crawler.types.ts` | Shared interfaces (ClassifiedUrl, ScrapedPage, CrawlResult, PageCategory) |
| `apps/core/src/modules/crawler/firecrawl.service.ts` | FireCrawl API client via Axios — `mapSite()` and `scrapePage()` |
| `apps/core/src/modules/crawler/url-classifier.service.ts` | Claude Haiku URL classifier + heuristic fallback |
| `apps/core/src/modules/crawler/crawler.service.ts` | Pipeline orchestrator — discover → classify → scrape → store |
| `apps/core/src/modules/crawler/crawler.module.ts` | NestJS module wiring |

### Modified Files

| File | Change |
|------|--------|
| `apps/core/src/modules/workers/account-worker/account-worker.module.ts` | Import CrawlerModule |
| `apps/core/src/modules/workers/account-worker/account-worker.processor.ts` | Inject & call CrawlerService |
| `.env.local` | Add FIRECRAWL_API_KEY, FIRECRAWL_BASE_URL, ANTHROPIC_API_KEY |
| `package.json` | Add `@anthropic-ai/sdk` |

### Dependencies

- `@anthropic-ai/sdk` — Claude Haiku for URL classification
- Existing `axios` — FireCrawl API calls (no SDK needed)

## Implementation Steps

1. Create the database migration and regenerate Supabase types
2. Install `@anthropic-ai/sdk`
3. Create `crawler.types.ts` — shared interfaces
4. Create `firecrawl.service.ts` — FireCrawl API client (map + scrape)
5. Create `url-classifier.service.ts` — LLM classification + heuristic fallback
6. Create `crawler.service.ts` — orchestrator
7. Create `crawler.module.ts` — wire providers
8. Update `account-worker.module.ts` — import CrawlerModule
9. Update `account-worker.processor.ts` — call CrawlerService after fetching account
10. Add env vars to `.env.local`

## Error Handling

- `/map` failure → fall back to scraping homepage only
- LLM classification failure → fall back to heuristic URL pattern matching (regex on paths)
- Individual `/scrape` failure → log in `crawled_page` with `crawl_status = 'failed'`, continue
- All scrapes fail → mark account `crawl_status = 'failed'`, BullMQ retries (3 attempts)
- Rate limiting: 350ms delay between scrape calls, worker concurrency set to 2

## Cost Per Account

- FireCrawl: ~12-16 credits (1 map + 11-15 scrapes)
- Claude Haiku: ~$0.001
- At 1000 accounts: ~12K-16K FireCrawl credits, ~$1 LLM cost

## Verification

1. Add a test account with a known website to Supabase
2. Dispatch a `generate-account-preset` job
3. Verify `/map` returns URLs, classifier selects relevant pages, scraper fetches markdown
4. Check `crawled_page` table for stored results with correct categories
5. Check `account` table for updated crawl status
