import os
import requests
import re
from bs4 import BeautifulSoup

class SearchService:
    def __init__(self):
        self.priority = os.getenv("SEARCH_PROVIDER_PRIORITY", "tavily,serper").split(",")
        self.tavily_key = os.getenv("TAVILY_API_KEY")
        self.serper_key = os.getenv("SERPER_API_KEY")

    def _strip_html(self, text: str) -> str:
        if not text:
            return ""
        soup = BeautifulSoup(text, "html.parser")
        return soup.get_text(separator=" ").strip()

    def search_legal_context(self, keywords: list) -> tuple[str, list]:
        if not keywords:
            return "", []
            
        # Construct query prioritizing official sources
        query = " ".join(keywords) + " site:indiankanoon.org OR site:sci.gov.in"
        
        for provider in self.priority:
            provider = provider.strip().lower()
            
            try:
                if provider == "tavily" and self.tavily_key:
                    context, urls = self._search_tavily(query)
                    if context:
                        return context, urls
                        
                elif provider == "serper" and self.serper_key:
                    context, urls = self._search_serper(query)
                    if context:
                        return context, urls
            except Exception as e:
                print(f"SearchProvider {provider.title()} Error: {e}")
                continue
                
        return "No legal context found.", []

    def _search_tavily(self, query: str) -> tuple[str, list]:
        url = "https://api.tavily.com/search"
        payload = {
            "api_key": self.tavily_key,
            "query": query,
            "search_depth": "basic",
            "max_results": 3
        }
        res = requests.post(url, json=payload)
        res.raise_for_status()
        data = res.json()
        
        snippets = []
        urls = []
        for r in data.get("results", []):
            clean_text = self._strip_html(r.get("content", ""))
            snippets.append(f"[Source: {r.get('title', 'Unknown')}]\n{clean_text}")
            if r.get('url'): urls.append(r.get('url'))
            
        return "\n\n".join(snippets), urls

    def _search_serper(self, query: str) -> tuple[str, list]:
        url = "https://google.serper.dev/search"
        headers = {
            "X-API-KEY": self.serper_key,
            "Content-Type": "application/json"
        }
        payload = {
            "q": query,
            "num": 3
        }
        res = requests.post(url, headers=headers, json=payload)
        res.raise_for_status()
        data = res.json()
        
        snippets = []
        urls = []
        for r in data.get("organic", []):
            clean_text = self._strip_html(r.get("snippet", ""))
            snippets.append(f"[Source: {r.get('title', 'Unknown')}]\n{clean_text}")
            if r.get('link'): urls.append(r.get('link'))
            
        return "\n\n".join(snippets), urls
