# NearbyNeed Resource Schema

This document outlines the standard JSON structure used for resources in the NearbyNeed platform. This structure is used by our AI crawlers and can be shared with local agencies to provide realtime updates.

**CRITICAL DATA REQUIREMENT:** ALL DATA surfaced to the USER should be from a verified source. NO making up data. Fallback or hallucinated fields are strictly prohibited.

```json
{
  "id": "UUID string (e.g., '123e4567-e89b-12d3-a456-426614174000')",
  "name": "Name of the facility, pantry, or program",
  "type": "food | shelter | services",
  "location": {
    "lat": 37.7749,  // Latitude (Float, automatically geocoded)
    "lng": -122.4194, // Longitude (Float, automatically geocoded)
    "address": "Full street address, city, state, zip"
  },
  "schedule": {
    "days": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], // Array of short day names
    "start_time": "HH:MM", // 24-hour format, e.g. "14:00"
    "end_time": "HH:MM",
    "type": "fixed | variable | intake"
  },
  "last_updated": "ISO8601 string (e.g., '2026-05-10T17:34:00Z')",
  "source": "URL or agency name that provided this data",
  "notes": "Any other constraints, requirements, or descriptions. Keep concise.",
  "phone": "Phone number if available (e.g., '415-555-1234')"
}
```

## Instructions for Agencies
If your agency wishes to provide realtime updates to NearbyNeed, please host a JSON file matching this exact schema (either a single object or an array of objects) and provide the URL to the NearbyNeed team. Our crawler will automatically ingest it.
