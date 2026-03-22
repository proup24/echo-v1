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
Centralized Anthropic Claude service (`modules/llm/`) with task-specific methods (e.g., `classifyUrls()`, future `generateSummary()`). Uses Claude Haiku for fast, cheap inference. All prompt logic lives here.

### Seg Matcher
Matches discovered leads against defined Segments.
