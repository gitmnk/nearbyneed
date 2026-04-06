from typing import List, Dict, Any

class SimpleDeduplicator:
    @staticmethod
    def deduplicate(records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Deduplicates records based on a hash of the name and address.
        Maintains the most recently scraped record when duplicates are found.
        """
        seen = {}
        unique_records = []
        
        for record in records:
            name = record.get("name", "").strip().lower()
            location = record.get("location", {})
            addr = location.get("address", "").strip().lower()
            key = f"{name}|{addr}"
            
            if key not in seen:
                seen[key] = record
            else:
                # Potential conflict resolution logic (e.g., keep the more complete one)
                pass

        return list(seen.values())
