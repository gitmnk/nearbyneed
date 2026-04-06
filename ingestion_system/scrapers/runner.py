from typing import List, Dict, Any, Optional
from .base import BaseScraper, BaseStorage

class PipelineRunner:
    def __init__(self, scraper: BaseScraper, storage: Optional[BaseStorage] = None):
        self.scraper = scraper
        self.storage = storage

    def run(self) -> List[Dict[str, Any]]:
        """Starts the full scraping lifecycle."""
        print(f"🚀 Running pipeline for source: {self.scraper.config.get('name', 'Unknown')}")
        results = self.scraper.run()
        
        if self.storage:
            self.storage.save(results)
            
        print(f"✅ Pipeline run complete! Found: {len(results)} items.")
        return results
