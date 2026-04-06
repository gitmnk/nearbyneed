from abc import ABC, abstractmethod
from typing import Any, List, Dict, Optional

class BaseFetcher(ABC):
    @abstractmethod
    def fetch(self, url: str) -> str:
        """Fetches the content from the given URL."""
        pass

class BaseScraper(ABC):
    def __init__(self, config: Dict[str, Any], fetcher: BaseFetcher):
        self.config = config
        self.fetcher = fetcher

    @abstractmethod
    def fetch(self) -> str:
        """Fetch raw content from the source."""
        pass

    @abstractmethod
    def parse(self, raw_content: str) -> Any:
        """Parse raw content into a traversable structure (e.g., BeautifulSoup or JSON)."""
        pass

    @abstractmethod
    def extract(self, parsed_content: Any) -> List[Dict[str, Any]]:
        """Extract relevant data from the parsed content."""
        pass

    @abstractmethod
    def normalize(self, extracted_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Normalize extracted data into the canonical schema."""
        pass

    def run(self) -> List[Dict[str, Any]]:
        """Execute the full scraping lifecycle."""
        raw = self.fetch()
        parsed = self.parse(raw)
        extracted = self.extract(parsed)
        return self.normalize(extracted)

class BaseStorage(ABC):
    @abstractmethod
    def save(self, records: List[Dict[str, Any]]):
        """Save normalized records to storage."""
        pass
