# NearbyNeed Workspace Operational Rules & Guardrails

Welcome to the NearbyNeed autonomous agent workspace. These rules are programmatically enforced and must be followed by all agents operating in this workspace.

---

## 1. Project Domain, Scope & System Boundaries

To guarantee that all agents understand the core product scope and architectural boundaries of NearbyNeed, the following principles are enforced:

### Core Purpose
- **NearbyNeed** is a high-performance local support and emergency resources discovery platform.
- It allows users (including vulnerable individuals and caseworkers) to find nearby support services (e.g., food pantries, shelters, hygiene facilities) using natural language and intent-driven search.

### System Architecture Scope
- **Serverless & Static Deployment**: The web application is built to compile into a static site deployable directly to GitHub Pages. Therefore, **all dynamic search logic, client-side caching, and API calls must happen on the client**. The introduction of relational databases, dynamic backend servers, or server-side rendering logic is strictly forbidden.
- **LLM-Powered Search**: The search engine utilizes Gemini APIs on the client-side to parse unstructured, conversational inputs (e.g., "I need a warm place to sleep tonight") into structured, localized resource filters dynamically.
- **Strict Data Provenance**: Data is harvested and compiled via a Python scraping/crawling framework located in [ingestion_system/](file:///Users/mk/Projects/nearbyneed/ingestion_system). Agents must ensure **absolute data provenance**—hallucinated, placeholder, or fallback contact information (such as fake phone numbers or addresses) is completely forbidden.

### In-Scope Work
- Enhancing dynamic resource cards (clickable addresses, dialable phone links, Google Maps directions).
- Improving search intent parsing, client-side performance, and semantic caching.
- Expanding and auditing the Python ingestion scripts and the Data Provenance Debugger interface.

### Out-of-Scope Work
- Creating backend servers, adding heavy ORM layers, or changing the repository deployment configuration away from the static model.
- Utilizing synthetic fallback data or omitting strict provenance verification.

---

## 2. Multi-Agent Lifecycle & Workflow

To maintain architectural integrity, all tasks must proceed through the following phased lifecycle:

### Phase 1: Planning (FeatureDeveloper & QA_Validator)
- Before modifying any files or running terminal commands, the active agent **MUST** create a comprehensive implementation plan.
- **Mandatory Code Reuse Inventory**: The agent must search the repository for existing utility wrappers or libraries (using ripgrep/grep tools) matching the required capability and explicitly list them in the implementation plan under a **"Reusable Code Analysis"** section.
- The plan should be written as a markdown artifact or a detailed proposal document.

### Phase 2: Manager Review & Approval (TechLead_Manager)
- The sub-agent **MUST** submit the plan to the `TechLead_Manager` for architectural review.
- The sub-agent **MUST NOT** execute any terminal commands, create directories, or write code changes until receiving an explicit **"PROCEED"** status/approval from `TechLead_Manager`.
- Any terminal changes proposed during work must be explicitly approved by `TechLead_Manager` under the `review_policy`.
- **UI Verification Note**: The `TechLead_Manager` **MUST** always verify user-interface implementations by requesting and reviewing a UI screenshot or recording to guarantee responsive wrapping, high-fidelity interactivity, and premium aesthetics before final validation.

### Phase 3: Implementation (FeatureDeveloper)
- Once "PROCEED" is received, implementation may begin.
- Adhere strictly to the Next.js and Python project conventions (described below).

### Phase 4: Validation (QA_Validator)
- All changes must be validated by running the workspace's native verification suites.
- Tasks are only considered complete once all validation steps pass successfully.

---

## 3. Code Reuse & Shared Assets (Mandatory Verification)

To avoid redundant code duplication, agents **must** inspect, import, and extend the following existing codebase components rather than re-implementing them:

### Frontend Shared Assets
1. **Gemini Dispatcher & Intent Parsing**:
   - **File**: [llmApiWrapper.ts](file:///Users/mk/Projects/nearbyneed/lib/llmApiWrapper.ts)
   - **Key exports**: `parseIntent(query)` parses conversational strings into structured JSON with prompt and candidate token metadata using `@google/generative-ai`.
   - **Usage rule**: Do not instantiate a separate `GoogleGenerativeAI` instance on the frontend unless explicitly requested by the manager.
2. **Resource Ranking & Proximity Math**:
   - **File**: [resourceUtils.ts](file:///Users/mk/Projects/nearbyneed/lib/resourceUtils.ts)
   - **Key exports**: `getDistance(...)` (Haversine formula for mile proximity), `getNowInLA()` (standardizes Los Angeles timezone clock operations), `rankResources(...)` (weights distance, operational status, and last-updated metadata to output sorted results).
   - **Usage rule**: Always use these standardized formulas for coordinate or operational status checking.

### Python Ingestion Shared Assets
1. **Schedule/Hours String Formatter**:
   - **File**: [parsers.py](file:///Users/mk/Projects/nearbyneed/ingestion_system/utils/parsers.py)
   - **Key exports**: `parse_hours(hours_str)` normalizes raw text schedule formats (e.g., 'Monday–Friday: 11:30 am–12:30 pm') into standardized schema hours.
   - **Usage rule**: Always run crawler and scraper parsing logic through this module.

---

## 4. Tech Stack Conventions & Constraints

Agents must operate using the correct tools and conventions for NearbyNeed's dual-stack architecture:

### Frontend & Web Application
- **Framework**: Next.js 16.2.2 (React 19)
- **Language**: TypeScript (`tsconfig.json` rules apply)
- **Styling**: Tailwind CSS v4 (via `@tailwindcss/postcss`)
- **Package Manager**: `npm` (Use `package-lock.json`)
- **Crucial Rule**: Refer to the Next.js rules in `AGENTS.md` (check `node_modules/next/dist/docs/` for breaking changes and deprecations in Next.js 16).

### Ingestion System & Scraping
- **Language**: Python 3
- **Environment**: Virtual environment located at `.venv/`
- **Dependencies**: Listed in `requirements.txt` (Playwright, BeautifulSoup4, Requests, Google Generative AI)
- **Execution**: To run the scraper/crawler pipeline, execute `ingestion_system/run_agents.sh` with either `crawler` or `discovery`.

---

## 5. Native Verification Suites (Mandatory)

Before marking a task as complete, the following verification commands **MUST** be executed and shown to pass:

1. **Frontend Linting Check**:
   ```bash
   npm run lint
   ```
   *No ESLint or TypeScript compile errors are allowed in production files.*

2. **Frontend Production Build Check**:
   ```bash
   npm run build
   ```
   *The project must build and compile into static assets successfully (Next.js static export test).*

3. **Python Ingestion Validation**:
   If changes affect the ingestion system, verify syntax and run the main entry point:
   ```bash
   source .venv/bin/activate
   PYTHONPATH=. python ingestion_system/main.py
   ```
   *Ensure no exceptions are raised during data enrichment or crawling runs.*

---

## 6. Guardrails & Restrictions
- **No unauthorized system modifications**: Do not modify system-level configurations outside `/Users/mk/Projects/nearbyneed`.
- **Environment variables**: Use `.env.local` for local secrets. Never commit `GEMINI_API_KEY` or other API keys to version control.
- **Git Hygiene**: Do not commit build directories (`.next/`, `out/`, `test_deploy/`) or dependencies (`node_modules/`, `.venv/`). Refer to `.gitignore`.
