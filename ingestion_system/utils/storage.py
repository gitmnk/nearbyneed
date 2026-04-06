import json
import os
from dateutil import parser
from datetime import datetime
from ..scrapers.base import BaseStorage

class JSONStorage(BaseStorage):
    def __init__(self, file_path: str):
        self.file_path = file_path

    def load(self):
        """Loads existing records from the JSON file."""
        if not os.path.exists(self.file_path):
            return []
        try:
            with open(self.file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            return []

    def save(self, records: list):
        """Saves normalized records to a JSON file as a top-level array."""
        os.makedirs(os.path.dirname(self.file_path), exist_ok=True)
        
        with open(self.file_path, 'w', encoding='utf-8') as f:
            json.dump(records, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Successfully saved {len(records)} records to {self.file_path}")
