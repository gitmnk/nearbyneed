from playwright.sync_api import sync_playwright
from ..scrapers.base import BaseFetcher

class PlaywrightFetcher(BaseFetcher):
    def __init__(self, headless: bool = True, wait_until: str = 'networkidle'):
        self.headless = headless
        self.wait_until = wait_until

    def fetch(self, url: str) -> str:
        """Fetches dynamic HTML using Playwright for JS-rendered pages."""
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=self.headless)
            page = browser.new_page()
            page.goto(url, wait_until=self.wait_until)
            content = page.content()
            browser.close()
            return content
