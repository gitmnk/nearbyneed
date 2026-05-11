import os
import json
import time
from duckduckgo_search import DDGS
import google.generativeai as genai

api_key = os.environ.get("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

model = genai.GenerativeModel("gemini-flash-latest")

def extract_phone(snippets, name):
    """Uses Gemini to extract the phone number from search snippets."""
    if not api_key:
        return ""
    prompt = f"""
    You are a data extractor. Find the phone number of "{name}" in San Francisco from these search results:
    {snippets}
    
    If you find it, output ONLY the phone number. Do not say "The phone number is". 
    If it is not present in the text, output exactly: NOT_FOUND
    """
    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        if "NOT_FOUND" in text.upper():
            return ""
        return text
    except:
        return ""

def main():
    file_path = "data/resources.json"
    if not os.path.exists(file_path):
        print("No resources.json found.")
        return

    with open(file_path, "r") as f:
        resources = json.load(f)

    ddgs = DDGS()
    updated = 0

    print(f"Checking {len(resources)} resources for missing/fallback phone numbers...")

    for i, r in enumerate(resources):
        # The fallback we added previously was "(415) 355-6700"
        if not r.get("phone") or r.get("phone") == "(415) 355-6700":
            name = r.get("name", "")
            address = r.get("location", {}).get("address", "")
            
            print(f"[{i+1}/{len(resources)}] Searching phone for: {name}...")
            
            query = f"{name} {address} San Francisco phone number"
            try:
                # Search DDG with html backend for better snippet reliability
                results = ddgs.text(query, max_results=3, backend="html")
                snippets = "\n".join([res.get("body", "") for res in results])
                
                # Use Gemini to extract
                phone = extract_phone(snippets, name)
                
                if phone:
                    print(f"  -> Found: {phone}")
                    r["phone"] = phone
                    updated += 1
                else:
                    print(f"  -> Not found. (LLM got: {snippets[:50]}...)")
                    r["phone"] = ""  # Clear the fallback if it had one
                    
            except Exception as e:
                print(f"  -> Error: {e}")
                r["phone"] = ""

            # Rate limit DDG
            time.sleep(1)

    if updated > 0:
        with open(file_path, "w") as f:
            json.dump(resources, f, indent=2)
        print(f"✅ Saved {updated} new phone numbers.")
    else:
        # Save anyway to clear the fallbacks
        with open(file_path, "w") as f:
            json.dump(resources, f, indent=2)
        print("Cleared fallbacks. No new phone numbers found.")

if __name__ == "__main__":
    main()
