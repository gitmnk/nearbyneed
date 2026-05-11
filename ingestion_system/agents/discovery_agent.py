import sys
import os
import json
import time
import google.generativeai as genai
from duckduckgo_search import DDGS

# Setup Gemini
api_key = os.environ.get("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

def run_discovery(limit=3):
    print("--- NearbyNeed Discovery Agent ---")
    if not api_key:
        print("⚠️ GEMINI_API_KEY not set. Cannot run LLM query generator.")
        return

    urls_file = "data/target_urls.txt"
    existing_urls = set()
    if os.path.exists(urls_file):
        with open(urls_file, "r") as f:
            existing_urls = set(line.strip() for line in f if line.strip() and not line.startswith("#"))

    model = genai.GenerativeModel("gemini-flash-latest")
    
    # 1. Ask Gemini for search queries
    prompt = """
    We are building a directory of homeless resources (food pantries, shelters, drop-in centers) in San Francisco and Oakland.
    Generate 3 specific web search queries that would help us discover *new* or *lesser-known* resource pages or directories.
    Return ONLY a JSON array of strings. No markdown, no extra text.
    """
    
    try:
        response = model.generate_content(prompt)
        raw_text = response.text.strip()
        if raw_text.startswith("```json"): raw_text = raw_text[7:]
        if raw_text.startswith("```"): raw_text = raw_text[3:]
        if raw_text.endswith("```"): raw_text = raw_text[:-3]
        
        queries = json.loads(raw_text.strip())
    except Exception as e:
        print(f"❌ Error generating queries: {e}")
        # Fallback queries
        queries = [
            "new food pantries San Francisco 2026",
            "homeless drop-in centers Oakland CA schedule",
            "emergency shelter availability San Francisco"
        ]

    print(f"🔍 Generated {len(queries)} search queries. Limiting results to {limit} per query.")
    
    new_urls_found = set()
    ddgs = DDGS()

    # 2. Search Web
    for query in queries:
        print(f"  > Searching: '{query}'")
        try:
            results = ddgs.text(query, max_results=limit)
            for res in results:
                url = res.get("href")
                # Basic filtering
                if url and "yelp.com" not in url and "facebook.com" not in url:
                    if url not in existing_urls and url not in new_urls_found:
                        new_urls_found.add(url)
        except Exception as e:
            print(f"    ❌ Search error: {e}")
        
        # Rate limit of 1 crawl per second
        time.sleep(1)

    # 3. Append new URLs
    if new_urls_found:
        print(f"✨ Found {len(new_urls_found)} new potential resource URLs.")
        with open(urls_file, "a") as f:
            for url in new_urls_found:
                f.write(f"{url}\n")
                print(f"  + Added: {url}")
    else:
        print("ℹ️ No new URLs discovered this run.")

if __name__ == "__main__":
    limit = 3
    if len(sys.argv) > 1 and sys.argv[1].isdigit():
        limit = int(sys.argv[1])
    run_discovery(limit=limit)
