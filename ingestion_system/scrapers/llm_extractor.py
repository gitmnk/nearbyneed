import os
import json
import uuid
import datetime
import google.generativeai as genai

# Setup Gemini API
api_key = os.environ.get("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

def extract_resources(text_content: str, source_url: str) -> list:
    """
    Uses Gemini to extract homeless resources from raw text.
    Returns a list of dicts matching the Resource schema.
    """
    if not api_key:
        print("⚠️ GEMINI_API_KEY not set. Cannot run LLM extractor.")
        return []

    # Using Gemini 1.5 Flash for fast, cheap extraction
    model = genai.GenerativeModel("gemini-flash-latest")
    
    prompt = f"""
    You are an AI assistant designed to extract homeless and emergency resources (food, shelter, services) from unstructured text.
    Please extract all valid resources you can find in the provided text.
    
    Return ONLY a valid JSON array of objects. Do not wrap it in markdown code blocks.
    If no resources are found, return [].
    
    The schema for each object must be:
    {{
      "name": "Name of the resource or location",
      "type": "food" | "shelter" | "services",
      "location": {{
        "address": "Full street address, city, state, zip if available. If none, leave empty string ''"
      }},
      "schedule": {{
        "days": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], // Array of short day names
        "start_time": "HH:MM", // 24-hour format, e.g. 14:00
        "end_time": "HH:MM",
        "type": "fixed" | "variable" | "intake"
      }},
      "notes": "Any other constraints, requirements, or descriptions. Keep it concise.",
      "phone": "Phone number for the specific location. If none is listed, leave it empty."
    }}
    
    Text to extract from (Source URL: {source_url}):
    {text_content[:25000]}  # limit text length to avoid token overflow if it's huge
    """
    
    try:
        response = model.generate_content(prompt)
        raw_text = response.text.strip()
        
        # Clean markdown if present
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        if raw_text.startswith("```"):
            raw_text = raw_text[3:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]
            
        data = json.loads(raw_text.strip())
        
        if not isinstance(data, list):
            data = [data]
            
        now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()
        
        # Enrich with generated fields
        enriched_resources = []
        for item in data:
            item["id"] = str(uuid.uuid4())
            item["source"] = source_url
            item["last_updated"] = now_str
            # Ensure coordinates are initialized for Geocoder later
            if "location" not in item:
                item["location"] = {"address": ""}
            elif item["location"].get("address") == "Unknown":
                item["location"]["address"] = ""
            item["location"]["lat"] = 0.0
            item["location"]["lng"] = 0.0
            enriched_resources.append(item)
            
        return enriched_resources

    except Exception as e:
        print(f"❌ Error during LLM extraction: {e}")
        return []

