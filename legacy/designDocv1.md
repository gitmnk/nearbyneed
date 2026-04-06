# Refined NearbyNeed Implementation Plan

This plan implements the "Where should I go right now?" engine using **Next.js**, with a focus on deterministic ranking, strict timezone handling (`America/Los_Angeles`), and a mobile-first feed.

## Goal
A high-performance, community-focused resource finder that provides instant, relevant recommendations for food, shelter, and services.

## User Review Required

> [!IMPORTANT]
> **Deterministic Ranking**: We will strictly follow the `status_weight + distance_weight + freshness_weight` formula.
> **Timezone**: All internal evaluations will use `America/Los_Angeles` to ensure consistency between users and server-side logic.

## Proposed Changes

### 1. Project Initialization
#### [NEW] [Next.js App](file:///Users/mk/Projects/nearbyneed/)
- Initialize Next.js (App Router) in the root directory.
- Setup **Tailwind CSS** for a premium mobile-first look.
- Create `/data/resources.json` with the strict schema (including `confidence` and `schedule.type`).

### 2. Backend Logic (API)
#### [NEW] [Resource API](file:///Users/mk/Projects/nearbyneed/app/api/resources/route.ts)
- **Timezone Helper**: Utilizes `Intl.DateTimeFormat` to consistently get "now" in `America/Los_Angeles`.
- **Distance**: Implements the Haversine formula (rounded to 1 decimal).
- **Status Engine**:
    - Calculates current day of week and 24h time.
    - Logic for `OPEN_NOW`, `STARTING_SOON` (within 60m), `CLOSED`, and `UNKNOWN` (for variable/intake types).
- **Scoring Engine**:
    - `status_weight`: +100 / +50 / 0 / +10.
    - `distance_weight`: -1 per mile.
    - `freshness_weight`: +20 (<1h) / +10 (<24h).
- **Response**: Strict JSON format with `results` array.

### 3. Frontend UI
#### [NEW] [Main Feed](file:///Users/mk/Projects/nearbyneed/app/page.tsx)
- **Geolocation**: `navigator.geolocation` on mount.
- **Filter Bar**: Dynamic category filtering (Food, Shelter, Services).
- **Performance**: Fetches from `/api/resources` on location change or filter change.

#### [NEW] [Components](file:///Users/mk/Projects/nearbyneed/components/)
- `ResourceCard`: Emoji-lead design, vibrant status badges, and relative "Updated X min ago" text.
- `SkeletonLoader`: For near-instant perceived load times.

### 4. Data Seeding
#### [NEW] [Resources JSON](file:///Users/mk/Projects/nearbyneed/data/resources.json)
- Transform previous SF/Oakland data into the new strict schema.
- Ensure at least one resource is `OPEN_NOW` and one is `STARTING_SOON` based on the current local time for testing.

## Open Questions
- **Native Fetch**: Use standard Node `fetch` or a specialized wrapper? (I'll stick to native for simplicity).
- **Icons**: Lucide for React? (Yes, fits the premium feel).

## Verification Plan

### Automated Logic Check
- Integration test for the `STARTING_SOON` edge case (10:30 current vs 11:00 start).
- Verification that `variable` type always results in `UNKNOWN` status.

### Manual Verification
- Visual UI review on mobile view (Responsive testing).
- Console log verification of the final `score` calculation for transparency.


# [Backup] From chat:
You are implementing a full-stack web app called NearbyNeed using Next.js.

This is NOT just a directory. The system must answer:
"Where should I go right now?"

It must prioritize:
- open now availability
- distance from user
- freshness (last updated)

-----------------------------------
PROJECT SETUP
-----------------------------------

- Use Next.js (App Router)
- Use Tailwind CSS (mobile-first UI)
- Keep architecture simple (no DB initially)
- Use a static JSON dataset at /data/resources.json

-----------------------------------
TIMEZONE REQUIREMENT (CRITICAL)
-----------------------------------

All time calculations MUST use:
America/Los_Angeles timezone

Do NOT rely on server default timezone.

-----------------------------------
DATA SCHEMA (STRICT)
-----------------------------------

Each resource must follow:

{
  "id": "string",
  "name": "string",
  "type": "food | shelter | services",
  "location": {
    "lat": number,
    "lng": number,
    "address": "string"
  },
  "schedule": {
    "days": ["Mon", "Tue"],
    "start_time": "HH:MM",
    "end_time": "HH:MM",
    "type": "fixed | variable | intake"
  },
  "last_updated": "timestamp",
  "source": "string",
  "notes": "string",
  "confidence": "high | medium | low"
}

-----------------------------------
BACKEND API
-----------------------------------

Implement:
GET /api/resources

Query params:
- lat (required)
- lng (required)
- type (optional)

-----------------------------------
BACKEND LOGIC
-----------------------------------

1. Distance Calculation
- Use Haversine formula
- Return distance in miles
- Round to 1 decimal place

2. Status Detection

Determine:
- OPEN_NOW
- STARTING_SOON (within 1 hour)
- CLOSED
- UNKNOWN (if schedule missing or type = variable/intake)

Rules:
- If schedule missing or type != "fixed" → UNKNOWN
- Compare current time (America/Los_Angeles) with schedule

3. Ranking Score (DETERMINISTIC)

score = status_weight + distance_weight + freshness_weight

Where:

status_weight:
  OPEN_NOW = +100
  STARTING_SOON = +50
  CLOSED = 0
  UNKNOWN = +10

distance_weight:
  -1 point per mile

freshness_weight:
  if updated < 1 hour → +20
  if updated < 24 hours → +10
  else → 0

4. Sorting
- Sort by score descending
- Return top 20 results

-----------------------------------
API RESPONSE FORMAT (STRICT)
-----------------------------------

Return:

{
  "results": [
    {
      "id": "string",
      "name": "string",
      "type": "food",
      "distance": 0.4,
      "status": "OPEN_NOW",
      "start_time": "15:30",
      "end_time": "17:00",
      "last_updated_minutes": 12,
      "score": 132
    }
  ]
}

-----------------------------------
FRONTEND REQUIREMENTS
-----------------------------------

- Use React (Next.js)
- Mobile-first UI
- Fast loading, minimal friction

On page load:
1. Get user location via navigator.geolocation
2. Call /api/resources
3. Render results

-----------------------------------
UI DESIGN
-----------------------------------

Top section:
🔥 "Available now near you"

Filters:
[ Food 🍲 ] [ Shelter 🏠 ] [ Services ⚙️ ]

Main content:
Feed (NOT just a map)

Each card shows:
- emoji icon
- name
- distance (miles)
- timing (start/end)
- status badge (OPEN NOW / STARTING SOON / CLOSED / UNKNOWN)
- "Updated X min ago"

-----------------------------------
EDGE CASES (IMPORTANT)
-----------------------------------

- If schedule is missing → status = UNKNOWN
- If resource starts within 1 hour → STARTING_SOON
- Handle day-of-week correctly
- Ensure time comparisons are robust

-----------------------------------
TESTING REQUIREMENTS
-----------------------------------

- Test API with different lat/lng inputs
- Mock time to verify:
  - OPEN_NOW
  - STARTING_SOON
  - CLOSED

Critical test case:
If resource starts at 11:00 and current time is 10:30
→ MUST return STARTING_SOON

-----------------------------------
PHASES
-----------------------------------

Phase 1:
- JSON dataset
- API
- feed UI

Phase 2:
- refine ranking
- add "last updated" formatting

Phase 3 (optional):
- add chat interface
- user query → API call → LLM formats response
- LLM must NOT hallucinate

-----------------------------------
DO NOT DO
-----------------------------------

- Do NOT build a generic chatbot
- Do NOT over-engineer backend or database
- Do NOT build only a map UI
- Do NOT ignore ranking logic

-----------------------------------
DELIVERABLES
-----------------------------------

- Working Next.js app (frontend + API)
- Clean, readable code
- Instructions to run locally

-----------------------------------
GOAL
-----------------------------------

User opens app → sees best nearby option instantly → decides where to go in under 10 seconds



You are tasked with designing and implementing a scalable, extensible web data ingestion system that aggregates publicly available information (initially focused on free food / meal locations) from multiple heterogeneous sources (webpages, APIs, static datasets), normalizes it into a unified schema, and stores it for downstream querying and a future chat-based interface.

The system must be designed with extensibility, maintainability, and scalability as first-class requirements.

🎯 Objectives
Ingest data from multiple sources with different structures
Support both static and dynamically rendered web pages
Normalize all data into a single canonical schema
Allow adding new data sources with minimal effort (via subclassing)
Decouple fetching, parsing, extraction, normalization, and storage
Provide a pipeline architecture that can scale horizontally
Prepare the system for future integration with search and chat (RAG)
🏗️ System Architecture Requirements

You must implement the system using a modular, object-oriented architecture with clear separation of concerns:

Core Components:
Fetcher Layer
Parser Layer
Scraper Base Class (Abstract)
Source-Specific Scrapers (Subclasses)
Normalization Layer
Scraper Factory / Registry
Pipeline Orchestrator
Storage Layer
(Optional) Enrichment Layer (geocoding, deduplication)
📦 Canonical Data Schema

All outputs from any scraper must be normalized into the following schema:

{
  "id": "string (optional, UUID)",
  "name": "string",
  "address": "string",
  "city": "string",
  "state": "string",
  "zip_code": "string",
  "latitude": "float",
  "longitude": "float",
  "hours": "string",
  "services": ["string"],
  "eligibility": "string",
  "contact": {
    "phone": "string",
    "email": "string",
    "website": "string"
  },
  "source": {
    "name": "string",
    "url": "string",
    "last_scraped_at": "timestamp"
  },
  "raw": "object (optional original extracted data)"
}
🧱 Base Scraper Design

Implement an abstract base class BaseScraper that defines the full lifecycle:

Required Methods:
fetch()
parse(raw_html)
extract(parsed_content)
normalize(extracted_data)
run()
Example:
class BaseScraper:
    def __init__(self, config, fetcher):
        self.config = config
        self.fetcher = fetcher

    def fetch(self):
        raise NotImplementedError

    def parse(self, raw_html):
        raise NotImplementedError

    def extract(self, parsed_content):
        raise NotImplementedError

    def normalize(self, extracted_data):
        raise NotImplementedError

    def run(self):
        raw_html = self.fetch()
        parsed = self.parse(raw_html)
        extracted = self.extract(parsed)
        normalized = self.normalize(extracted)
        return normalized
🌐 Fetcher Layer

Implement pluggable fetchers:

RequestsFetcher → for static pages
PlaywrightFetcher → for JavaScript-rendered pages
Interface:
class BaseFetcher:
    def fetch(self, url: str) -> str:
        raise NotImplementedError

Fetchers must be injectable into scrapers.

🧾 Parser Layer

Use a parsing utility (e.g., BeautifulSoup / lxml) to convert HTML into a traversable structure.

Example:

class HTMLParser:
    def __init__(self, html):
        self.soup = BeautifulSoup(html, "html.parser")
🧩 Source-Specific Scrapers

For each website, implement a subclass of BaseScraper.

Each subclass must:

Override parsing logic
Define extraction logic specific to that website’s DOM structure
Map extracted fields into the canonical schema via normalization

Example:

class SFHSAScraper(BaseScraper):

    def fetch(self):
        return self.fetcher.fetch(self.config["url"])

    def parse(self, raw_html):
        return HTMLParser(raw_html)

    def extract(self, parser):
        results = []
        elements = parser.soup.select(".location-card")

        for el in elements:
            results.append({
                "name": el.select_one(".name").get_text(),
                "address": el.select_one(".address").get_text()
            })

        return results

    def normalize(self, extracted_data):
        normalized = []
        for item in extracted_data:
            normalized.append({
                "name": item.get("name"),
                "address": item.get("address"),
                "city": "San Francisco",
                "state": "CA",
                "source": {
                    "name": "sfhsa",
                    "url": self.config["url"]
                }
            })
        return normalized
🏭 Scraper Factory / Registry

Implement a registry to map source names to scraper classes:

SCRAPER_REGISTRY = {
    "sfhsa": SFHSAScraper,
    "oakland": OaklandScraper
}

Factory function:

def get_scraper(source_name, config, fetcher):
    scraper_class = SCRAPER_REGISTRY[source_name]
    return scraper_class(config, fetcher)
🔁 Pipeline Orchestrator

Implement a pipeline runner that:

Instantiates the scraper
Executes the scraping lifecycle
Collects results
Sends results to storage
class Pipeline:
    def __init__(self, scraper):
        self.scraper = scraper

    def run(self):
        return self.scraper.run()
💾 Storage Layer

Implement an abstraction for persistence:

class BaseStorage:
    def save(self, records: list):
        raise NotImplementedError

Initial implementation:

JSON file storage

Future:

PostgreSQL (preferred for production)
MongoDB (optional)
🌍 Enrichment Layer (Optional but Recommended)

Add support for:

Geocoding addresses → latitude/longitude
Deduplication across sources

Geocoding interface:

def geocode(address: str):
    pass
⚠️ Error Handling & Resilience

The system must:

Retry failed network requests
Handle missing or malformed fields gracefully
Log parsing/extraction errors
Skip invalid records without crashing the pipeline
⏱️ Rate Limiting & Politeness
Add configurable delays between requests
Respect robots.txt where applicable
Avoid aggressive scraping patterns
🔌 Dynamic Content Support

For JavaScript-rendered pages:

Use Playwright or Selenium fetcher
Wait for DOM to fully load before extraction
Extract from rendered HTML
🧪 Testing Requirements
Unit tests for:
extraction logic
normalization logic
Integration tests using:
saved HTML fixtures
mock fetchers
📁 Suggested Project Structure
/scrapers
  base.py
  sfhsa.py
  oakland.py

/fetchers
  base_fetcher.py
  requests_fetcher.py
  playwright_fetcher.py

/parsers
  html_parser.py

/normalizers
  base_normalizer.py

/storage
  base_storage.py
  json_storage.py

/factory
  scraper_factory.py

/pipeline
  runner.py
➕ Extensibility Requirements

To add a new data source:

Create a new scraper subclass
Implement:
extract()
normalize()
Register it in the factory

No modifications should be required to the base system.

🚀 Future Considerations

Design the system to support:

API layer (FastAPI) on top of stored data
Search functionality (keyword + geospatial)
Chat interface (LLM + retrieval over this dataset)
Background job queue (Redis + workers)
Horizontal scaling via multiple scraper workers
Monitoring and logging infrastructure
✅ Success Criteria
Multiple sources can be scraped independently
All outputs conform to the unified schema
Adding a new source requires only a new subclass + registry entry
System is modular, testable, and extensible
Pipeline runs end-to-end without manual intervention

This system should be implemented in a way that cleanly separates:

data acquisition
transformation
storage
and orchestration