# Implementation Plan - AI Intent Parsing & Actionable Resources

We will integrate Gemini 1.5 Flash to parse user intent from a new natural language search bar. This will allow the app to dynamically rank resources based on specific needs, urgency, and demographics.

## User Review Required

> [!IMPORTANT]
> **Gemini API Key:** We need a Gemini API key. I will assume we'll use an environment variable `NEXT_PUBLIC_GEMINI_API_KEY` or a Server Action. Please confirm if you have a key ready to use.
> **Deployment Context:** Since the app is built for GitHub Pages (static export), we should use a client-side integration with a secure key (if restricted) or a bridge if we transition to a dynamic host.

## Proposed Changes

### 1. AI Intent Logic
#### [NEW] [intentUtils.ts](file:///Users/mk/Projects/nearbyneed/lib/intentUtils.ts)
*   Create a utility using `@google/generative-ai`.
*   Implement a prompt that takes user text and returns a JSON object: `{ type: 'food' | 'shelter' | 'services', urgency: number, needs: string[] }`.

### 2. UI Components
#### [MODIFY] [FilterBar.tsx](file:///Users/mk/Projects/nearbyneed/components/FilterBar.tsx)
*   Replace/Augment the simple toggle buttons with a sleek, expansive search input.
*   Add a "Thinking..." state for when Gemini is parsing.

#### [MODIFY] [ResourceCard.tsx](file:///Users/mk/Projects/nearbyneed/components/ResourceCard.tsx)
*   Add "Get Directions" button using `https://www.google.com/maps/dir/?api=1&destination=lat,lng`.
*   Add "Contact" button for phone numbers (if available in schema).

### 3. Application State
#### [MODIFY] [page.tsx](file:///Users/mk/Projects/nearbyneed/app/page.tsx)
*   Integrate the `parseIntent` call into the filter lifecycle.
*   Update `rankResources` to weigh results based on the AI-parsed `urgency` and `needs`.

## Verification Plan

### Automated Tests
*   Mock natural language queries (e.g., "I'm looking for a place to sleep tonight") and verify the returned `type` is 'shelter'.
*   Verify Haversine distance ranking still works after intent filtering.

### Manual Verification
*   Test the search bar in a browser session.
*   Verify that clicking "Get Directions" opens Google Maps with the correct coordinates.
