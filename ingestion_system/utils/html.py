from bs4 import BeautifulSoup

class HTMLParser:
    def __init__(self, html: str):
        self._soup = BeautifulSoup(html, "html.parser")

    def select(self, selector: str):
        """Standard CSS selector support via BeautifulSoup."""
        return self._soup.select(selector)

    def select_one(self, selector: str):
        """CSS selector for a single element."""
        return self._soup.select_one(selector)
