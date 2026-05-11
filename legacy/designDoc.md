# NearbyNeed Design Document

**Goal**: A high-speed, trusted, zero-money platform for finding homeless resources in San Francisco and Oakland.

## Core Principles

- **Zero-Money Guarantee**: All transactions on the platform are $0. Any request for money is a violation of community trust.
- **Trust via Verification**: Resources are marked as "Verified" when seeded from official city data or vetted by admins.
- **Freshness via Community**: "Still Here" (thumbs up) feature allows real-time confirmation from people at the location.
- **Immediate Misuse Prevention**: "Report" (flag) feature with immediate auto-hide thresholds for flagged items.
- **Performance First**: Minimalist Vanilla HTML/CSS/JS architecture for near-instant loading on low-end devices or poor connections.

## Core Features

1.  **Location-Aware Discovery**: Automatically detects user location (SF or Oakland) and shows relevant resources immediately. No search bar for maximum speed.
2.  **Verified Seed Data**: Initial resources are pulled from official SF (DataSF) and Oakland Open Data portals.
3.  **Community Feedback Loop**:
    - **Still Here**: Refreshes the "Last Confirmed" timestamp.
    - **Report Issue**: Flags incorrect info, closed locations, or misuse/fraud.
4.  **Accessibility**: Clean, high-contrast typography and simple navigation for diverse user needs.

## Data Sourcing

Detailed resource information is sourced and verified from:
- **San Francisco**: [DataSF](https://datasf.org/) (SODA API for Homelessness and Social Services).
- **Oakland**: [City of Oakland Open Data](https://data.oaklandca.gov/) (311 and Social Services datasets).
- **Secondary Reference**: [Bay Area 211](https://www.211bayarea.org/).

## Technical Stack

- **Frontend**: Vanilla HTML5, CSS3 (Grid/Flex), ES6+ Javascript.
- **Icons**: [Lucide Icons](https://lucide.dev/).
- **Fonts**: Inter (Google Fonts).
- **Infrastructure**: Designed for PWA (Progressive Web App) capabilities in future phases.




NearbyNeed is a mobile-first web app that helps people experiencing homelessness quickly find free resources near them in San Francisco and Oakland.

🎯 The Core Problem It Solves
When someone needs food, shelter, or services right now, they shouldn't have to wade through complex websites or call multiple numbers. NearbyNeed gives them a single, instant, location-aware list of what's available nearby — for $0.

🏗️ How It Works
The Frontend (user-facing app):

Detects the user's location and shows relevant resources sorted by distance + availability
Displays status badges: OPEN NOW, STARTING SOON, CLOSED
Shows phone numbers so people can call ahead to confirm availability
Has an AI chat interface (Gemini) for natural language queries like "I need food right now"
The Ingestion Pipeline (backend data engine):

Scraper: Pulls official data from SF Human Services Agency (SFHSA) and city open data portals
Crawler Agent: Takes a list of URLs, fetches pages using Playwright, and uses Gemini to extract structured resource data
Discovery Agent: Uses Gemini to generate search queries, then DuckDuckGo to find new resource URLs to crawl
Phone Enrichment: Searches DuckDuckGo and uses Gemini to find phone numbers for resources that don't have them
All extracted data is geocoded, deduplicated, and saved to data/resources.json
🔑 Core Principles
Zero-Money Guarantee — everything is free, always
Verified Data Only — no hallucinated or fallback data surfaced to users
Speed — loads fast on low-end devices / poor connections
Community trust — "Still Here" confirmations + flagging for bad info
📍 Current State
The project has a working Next.js frontend with ~50 SFHSA resources loaded, an AI-powered ingestion pipeline, and a debug page for tracing where each resource came from. We've been cleaning up data integrity issues — removing fallbacks and hardcoded logic to ensure everything shown is from a real, verified source.


NearbyNeed — Next Session TODO
a. De-duplicate crawl log entries
Problem: Re-crawling the same URL appends a new entry to crawl_log.json without removing the old one.
Fix: When writing to crawl_log.json, check if an entry for the same URL already exists. If so, replace it (upsert by URL), keeping only the most recent crawl.
Location: ingestion_system/agents/crawler_agent.py → append_crawl_log()
Logic: Load existing log → filter out any entry with matching url → append the new entry → save.

b. Extract phone numbers directly from crawled pages
Problem: We're currently using DuckDuckGo + Gemini to search for phone numbers separately, which is unreliable and rate-limited. Phone numbers are likely already in the raw crawled text.
Fix: After saving the raw page text, run a phone extraction pass directly on raw_text_file content before sending to the LLM for structured extraction.
Approach:

Run a regex pass first (\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}) to find candidates in the raw text.
Use Gemini to match each candidate to a resource name found on the page.
Assign verified phone numbers at crawl time, not in a separate enrichment step.
Location: ingestion_system/scrapers/llm_extractor.py → update the extraction prompt to more aggressively look for phone numbers, and/or add a pre-pass regex in crawler_agent.py.
c. Link debug page to the crawled source URL
Problem: Engineers can see which URL a resource came from, but can't quickly jump to the live page to verify content or debug parsing issues.
Fix: In the Crawl Archive tab of app/debug/page.tsx, make the URL in each crawl entry a clickable <a target="_blank"> link to the live page (it already is one — but verify it's clearly visible and not truncated). Also consider adding a direct link on each resource row in the Resources tab that opens the source URL.
Location: app/debug/page.tsx
Note: The "View Raw" button already loads the cached .txt. The live URL link is for comparing cached vs. current live page content.