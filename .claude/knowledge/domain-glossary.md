# Echo Domain Glossary

## Core Concepts & Terminology

### Account
A company (usually B2B) that Echo is matching with leads (our clients). Stored in the `account` table.

### Discovery Engine
The system that identifies leads for an Account's target industry, ICP and persona.

### Account Website
Crawled website content for an Account. All scraped pages are merged into a single markdown file stored in Supabase Storage (`account-websites` bucket). The `account_website` table holds the storage path (`markdown_url`), the original website URL, and a `summary` field for LLM-generated positioning briefs.

### Crawler Module
Standalone service (`modules/crawler/`) that maps site URLs via FireCrawl's `/map` endpoint, filters relevant pages using LLM classification, scrapes them via `/scrape`, and returns merged markdown. Does not handle persistence — that's the processor's job.

### LLM Module
Centralized Anthropic Claude service (`modules/llm/`). Two services:
- **LlmService** — wraps `@anthropic-ai/sdk` with `chat()`, `chatJson<T>()`, and `chatFromPrompt<T>()`. Default model: Claude Haiku 3.5.
- **PromptService** — loads Handlebars `.hbs` template files from `modules/llm/prompts/`. Each file has `---system---` and `---user---` sections. Templates are compiled once and cached in memory.

### URL Industry Classifier
Service in the crawler module (`url-industry-classifier.service.ts`) that classifies discovered URLs by page category using LLM. Falls back to regex-based heuristics if the LLM call fails. Used by `CrawlerService.selectRelevantUrls()` to guarantee category coverage (1 page per category) plus 10 additional shallowest pages.

### Page Categories
The set of URL categories used for classification: `homepage`, `services`, `products`, `pricing`, `about`, `case_studies`, `industries`, `solutions`, `other`. All except `other` are "keep" categories — URLs classified as `other` are discarded.

### Seg Matcher
Matches discovered leads against defined Segments.
