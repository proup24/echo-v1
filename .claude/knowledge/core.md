# Core API Structure

## Module Dependency Tree

```
AppModule (global)
├── ConfigModule (global)
├── SUPABASE_CLIENT (global provider)
└── WorkersModule
    ├── BullModule (Redis)
    ├── AccountWorkerModule
    │   └── CrawlerModule
    │       └── LlmModule
    ├── DiscoveryEngineModule (stub)
    ├── SegMatcherModule (stub)
    └── LinkedInAccountWorkerModule (stub)
```

## Modules

### LLM Module (`modules/llm/`)

| Service | Purpose |
|---------|---------|
| LlmService | Anthropic Claude wrapper — `chat()`, `chatJson<T>()`, `chatFromPrompt<T>()` |
| PromptService | Loads Handlebars `.hbs` templates with `---system---`/`---user---` sections, caches compiled templates |

- Default model: `claude-haiku-3-5-20241022`
- Prompts live in `modules/llm/prompts/*.hbs`, copied to `dist/prompts/` via webpack assets config

**Prompt templates:**

| Template | Used by | Variables |
|----------|---------|-----------|
| `classify-industry-urls.hbs` | UrlIndustryClassifierService | baseUrl, urls[], categories[] |

### Crawler Module (`modules/crawler/`)

| Service | Purpose |
|---------|---------|
| FirecrawlService | FireCrawl API client — `mapSite()`, `scrapePage()`, `scrapePages()` (350ms throttle) |
| UrlIndustryClassifierService | LLM-based URL classification by page category, with regex heuristic fallback |
| CrawlerService | Orchestrator: discover → classify → select (1 per category + 10 shallowest) → scrape → merge markdown |

### Workers Module (`modules/workers/`)

| Worker | Queue | Status |
|--------|-------|--------|
| AccountWorkerProcessor | `process-account-website` | Implemented — crawls website, uploads markdown to Supabase Storage |
| DiscoveryEngineModule | — | Stub |
| SegMatcherModule | — | Stub |
| LinkedInAccountWorkerModule | — | Stub |

## Shared Libraries

### @echo/supabase-client (`libs/shared/supabase-client/`)

- `getSupabaseClient()` → `TypedSupabaseClient` (Service Role Key, bypasses RLS)
- `Database` type auto-generated from Supabase schema via `npm run supabase:types`

## Database Tables

| Table | Key Columns |
|-------|-------------|
| `account` | id, name, website, description |
| `account_website` | id, account_id (FK), website, markdown_url, summary |

## Entry Point

`apps/core/src/main.ts` — NestJS app on port 3000 with `api/` global prefix.
