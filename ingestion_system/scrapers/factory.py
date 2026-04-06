from typing import Dict, Type, Any
from .base import BaseScraper, BaseFetcher
from .sfhsa import SFHSAScraper

# Registry of available scraper classes
SCRAPER_REGISTRY: Dict[str, Type[BaseScraper]] = {
    "sfhsa": SFHSAScraper,
}

def get_scraper(source_name: str, config: Dict[str, Any], fetcher: BaseFetcher) -> BaseScraper:
    """Factory function to instantiate the appropriate scraper."""
    if source_name not in SCRAPER_REGISTRY:
        raise ValueError(f"Unknown scraper source: {source_name}")
    
    scraper_class = SCRAPER_REGISTRY[source_name]
    return scraper_class(config, fetcher)
