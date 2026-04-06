import requests
from ..scrapers.base import BaseFetcher

class RequestsFetcher(BaseFetcher):
    def __init__(self, timeout: int = 10, headers: dict = None):
        self.timeout = timeout
        self.headers = headers or {
            'User-Agent': 'NearbyNeedBot/1.0 (+https://github.com/gitmnk/nearbyneed)'
        }

    def fetch(self, url: str) -> str:
        """Fetches static HTML or JSON using requests."""
        response = requests.get(url, headers=self.headers, timeout=self.timeout)
        response.raise_for_status()
        return response.text
