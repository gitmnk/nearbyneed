from .base import BaseScraper
from ..utils.html import HTMLParser
from uuid import uuid4
from datetime import datetime
import re
from ..utils.parsers import parse_hours

class SFHSAScraper(BaseScraper):
    def fetch(self) -> str:
        """Fetches the Community Meals page using the provided fetcher."""
        return self.fetcher.fetch(self.config["url"])

    def parse(self, raw_html: str):
        """Converts HTML to a traversable structure."""
        return HTMLParser(raw_html)

    def extract(self, parser: HTMLParser):
        """
        Extracts names, addresses, and hours from the SFHSA Community Meals page.
        """
        results = []
        body = parser.select_one('body')
        if not body:
            print("❌ ERROR: Could not find body tag!")
            return []
            
        # We use | as a separator to clearly distinguish lines between tags
        body_text = body.get_text(separator='|')
        lines = [line.strip() for line in body_text.split('|') if line.strip()]

        i = 0
        while i < len(lines):
            line = lines[i]
            
            # Check for name + address pattern
            # Heuristic: [Name] followed by [Address starting with digits] followed by [Hours containing Day]
            if i + 2 < len(lines):
                next_line = lines[i+1]
                after_next = lines[i+2]
                
                if re.match(r'^\d+', next_line) and any(day in after_next for day in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]):
                    name = line
                    address = next_line
                    
                    # Extract hours until "Map & Directions" or next potential entry
                    hours = []
                    j = i + 2
                    while j < len(lines) and "Map & Directions" not in lines[j] and j < i + 10:
                        hours.append(lines[j])
                        j += 1
                    
                    results.append({
                        "id": str(uuid4()),
                        "name": name,
                        "address": address,
                        "city": "San Francisco",
                        "state": "CA",
                        "zip_code": None,
                        "hours": " | ".join(hours),
                        "raw": {"name": name, "address": address, "hours": hours}
                    })
                    i = j 
                else:
                    i += 1
            else:
                i += 1
        
        return results

    def normalize(self, extracted_data: list):
        """Maps extracted fields to the canonical UI-ready schema."""
        normalized = []
        for item in extracted_data:
            normalized.append({
                "id": item.get("id"),
                "name": item.get("name"),
                "type": "food", # Default for SFHSA Community Meals
                "location": {
                    "lat": item.get("latitude"),
                    "lng": item.get("longitude"),
                    "address": item.get("address")
                },
                "schedule": parse_hours(item.get("hours", "")),
                "last_updated": datetime.utcnow().isoformat(),
                "source": "SFHSA",
                "notes": item.get("hours", "") # Keep the raw hours as notes
            })
        return normalized
