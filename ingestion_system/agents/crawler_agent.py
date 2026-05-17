import sys
import os
import json
import re
import datetime

# Add parent directory to path so we can import from ingestion_system
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from ingestion_system.fetchers.playwright_fetcher import PlaywrightFetcher
from ingestion_system.scrapers.llm_extractor import extract_resources
from ingestion_system.utils.storage import JSONStorage
from ingestion_system.utils.geocoder import Geocoder
from ingestion_system.utils.deduplicator import SimpleDeduplicator

CRAWL_LOG_PATH = "data/crawl_log.json"
CRAWL_CACHE_DIR = "data/crawl_cache"


def url_to_filename(url: str, crawled_at: str) -> str:
    """Converts a URL into a safe filename for the crawl cache."""
    slug = re.sub(r'https?://', '', url)
    slug = re.sub(r'[^a-zA-Z0-9]', '_', slug)
    slug = re.sub(r'_+', '_', slug).strip('_')[:80]
    ts = crawled_at.replace(':', '').replace('-', '').replace('T', '_').split('.')[0]
    return f"{slug}_{ts}.txt"


def save_raw_text(url: str, text: str, crawled_at: str) -> str:
    """Saves the full raw page text to disk. Returns the relative file path."""
    os.makedirs(CRAWL_CACHE_DIR, exist_ok=True)
    filename = url_to_filename(url, crawled_at)
    filepath = os.path.join(CRAWL_CACHE_DIR, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(f"URL: {url}\nCrawled At: {crawled_at}\n\n")
        f.write(text)
    return filepath


def append_crawl_log(entry: dict):
    """Appends a crawl log entry to crawl_log.json (de-duplicates by URL)."""
    log = []
    if os.path.exists(CRAWL_LOG_PATH):
        try:
            with open(CRAWL_LOG_PATH, "r") as f:
                log = json.load(f)
        except (json.JSONDecodeError, IOError):
            log = []

    # De-duplicate: filter out any existing entry with a matching URL
    target_url = entry.get("url")
    if target_url:
        log = [item for item in log if item.get("url") != target_url]

    log.append(entry)

    with open(CRAWL_LOG_PATH, "w") as f:
        json.dump(log, f, indent=2)


def run_crawler():
    print("--- NearbyNeed URL Crawler Agent ---")

    # Initialize components
    fetcher = PlaywrightFetcher()
    geocoder = Geocoder()
    storage = JSONStorage("data/resources.json")

    urls_file = "data/target_urls.txt"
    if not os.path.exists(urls_file):
        print(f"❌ Target URLs file not found at {urls_file}")
        return

    # Read URLs
    with open(urls_file, "r") as f:
        urls = [line.strip() for line in f if line.strip() and not line.startswith("#")]

    if not urls:
        print("ℹ️ No URLs to crawl.")
        return

    print(f"🔍 Found {len(urls)} URLs to crawl.")

    all_new_records = []

    # Process each URL
    for url in urls:
        print(f"🌐 Fetching: {url}")
        crawled_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
        try:
            html_content = fetcher.fetch(url)
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(html_content, "html.parser")
            text_content = soup.get_text(separator=' ', strip=True)

            # --- Save full raw text to disk ---
            raw_text_file = save_raw_text(url, text_content, crawled_at)
            print(f"  💾 Saved raw text -> {raw_text_file}")

            print(f"🧠 Parsing with Gemini...")
            records = extract_resources(text_content, url)
            print(f"  ✓ Found {len(records)} resources.")

            # Build crawl log entry
            extracted_summary = [
                {
                    "name": r.get("name", ""),
                    "phone": r.get("phone", ""),
                    "address": r.get("location", {}).get("address", "")
                }
                for r in records
            ]
            phone_missing_count = sum(1 for r in extracted_summary if not r["phone"])

            append_crawl_log({
                "url": url,
                "crawled_at": crawled_at,
                "raw_text_file": raw_text_file,
                "resources_extracted": extracted_summary,
                "total_resources": len(records),
                "phone_missing_count": phone_missing_count
            })

            for r in records:
                all_new_records.append(r)

        except Exception as e:
            print(f"❌ Error processing {url}: {e}")
            append_crawl_log({
                "url": url,
                "crawled_at": crawled_at,
                "raw_text_file": None,
                "resources_extracted": [],
                "total_resources": 0,
                "phone_missing_count": 0,
                "error": str(e)
            })

    if not all_new_records:
        print("⚠️ No resources extracted from any URL.")
        return

    # Enrich (Geocode)
    print(f"🌍 Geocoding {len(all_new_records)} records...")
    enriched_records = []
    for record in all_new_records:
        address = record.get("location", {}).get("address", "")
        if address and address.strip():
            lat, lng = geocoder.get_coords(address)
            if lat and lng:
                record["location"]["lat"] = lat
                record["location"]["lng"] = lng
                print(f"  ✓ Geocoded: {record['name']} -> {lat}, {lng}")
        enriched_records.append(record)

    # Deduplicate within new batch
    new_unique_records = SimpleDeduplicator.deduplicate(enriched_records)

    if new_unique_records:
        print("💾 Saving to resources.json...")
        existing_records = storage.load()

        scraped_sources = set(urls)
        filtered_records = [r for r in existing_records if r.get("source") not in scraped_sources]

        final_records = filtered_records + new_unique_records
        storage.save(final_records)
        print("✅ Crawl complete.")
    else:
        print("⚠️ No unique new records to save.")


if __name__ == "__main__":
    run_crawler()
