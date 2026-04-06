import json
import os
import sys
import time
from ingestion_system.fetchers.requests_fetcher import RequestsFetcher
from ingestion_system.fetchers.playwright_fetcher import PlaywrightFetcher
from ingestion_system.scrapers.factory import get_scraper
from ingestion_system.scrapers.runner import PipelineRunner
from ingestion_system.utils.storage import JSONStorage
from ingestion_system.utils.geocoder import Geocoder
from ingestion_system.utils.deduplicator import SimpleDeduplicator

def main():
    print("--- NearbyNeed Ingestion System (V2) ---")
    
    # Initialize components
    # We use Playwright for SFHSA as it can be dynamic
    playwright_fetcher = PlaywrightFetcher()
    geocoder = Geocoder()
    storage = JSONStorage("data/resources.json")
    
    # Config for SFHSA Community Meals (Higher quality source)
    cfg = {
        "name": "SFHSA-Community-Meals",
        "source": "sfhsa",
        "url": "https://www.sfhsa.org/services/disability-aging/groceries-meals/community-meals",
        "fetcher_type": "playwright"
    }

    try:
        # 1. Scrape
        scraper = get_scraper(cfg["source"], cfg, playwright_fetcher)
        runner = PipelineRunner(scraper)
        raw_records = runner.run()

        # 2. Enrich (Geocode)
        print(f"🌍 Enriching {len(raw_records)} records with coordinates...")
        enriched_records = []
        for record in raw_records:
            lat, lng = geocoder.get_coords(record["location"]["address"])
            if lat and lng:
                record["location"]["lat"] = lat
                record["location"]["lng"] = lng
                print(f"  ✓ Geocoded: {record['name']} -> {lat}, {lng}")
            enriched_records.append(record)

        # 3. Deduplicate (Newly scraped set only)
        new_unique_records = SimpleDeduplicator.deduplicate(enriched_records)
        
        # 4. Filter & Replace Strategy
        if new_unique_records:
            print(f"🔄 Source Refresh: Updating source '{cfg['source']}'...")
            existing_records = storage.load()
            
            # Remove old records from THIS source ONLY
            # Note: We match on the source identifier
            filtered_records = [r for r in existing_records if r.get("source") != "SFHSA"]
            
            # Combine
            final_records = filtered_records + new_unique_records
            
            # 5. Save
            storage.save(final_records)
        else:
            print("⚠️ WARNING: Scraper returned 0 results. Skipping update to preserve existing data.")
            
    except Exception as e:
        print(f"❌ Error in pipeline: {str(e)}")

if __name__ == "__main__":
    main()
