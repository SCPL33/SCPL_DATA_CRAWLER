import re
from collections import deque
from typing import Dict, List, Set
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

KEYWORDS = {
    "about",
    "contact",
    "company",
    "services",
    "products",
    "solutions",
    "address",
    "location",
    "career",
    "support",
    "phone",
    "email",
    "team",
    "privacy",
    "terms",
    "संपर्क",
    "हमारे बारे में",
    "उत्पाद",
    "सेवाएं",
    "服务",
    "联系我们",
    "关于",
    "제품",
    "연락처",
    "公司",
    "تواصل",
    "من نحن",
}

EMAIL_PATTERN = re.compile(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", re.IGNORECASE)
PHONE_PATTERN = re.compile(r"\+?\d[\d\s\-().]{7,}\d")


def is_relevant_page(text: str) -> bool:
    lowered = text.lower()
    if any(keyword in lowered for keyword in KEYWORDS):
        return True
    if EMAIL_PATTERN.search(text) or PHONE_PATTERN.search(text):
        return True
    return False


def collect_links(base_url: str, soup: BeautifulSoup) -> List[str]:
    links = []
    for anchor in soup.find_all("a", href=True):
        href = anchor["href"].strip()
        if href.startswith("#"):
            continue
        full_url = urljoin(base_url, href)
        links.append(full_url)
    return links


def same_domain(base_url: str, target_url: str) -> bool:
    return urlparse(base_url).netloc == urlparse(target_url).netloc


def extract_snippet(text: str, limit: int = 280) -> str:
    cleaned = " ".join(text.split())
    return cleaned[:limit]


def crawl_site(start_url: str, max_pages: int = 30) -> Dict[str, List[Dict[str, str]]]:
    visited: Set[str] = set()
    queue = deque([start_url])
    relevant_pages = []
    errors = []

    while queue and len(visited) < max_pages:
        url = queue.popleft()
        if url in visited:
            continue
        if not same_domain(start_url, url):
            continue

        visited.add(url)
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
        except requests.RequestException as exc:
            errors.append({"url": url, "error": str(exc)})
            continue

        soup = BeautifulSoup(response.text, "lxml")
        text = soup.get_text(" ", strip=True)
        if is_relevant_page(text):
            relevant_pages.append(
                {
                    "page_url": url,
                    "snippet": extract_snippet(text),
                }
            )

        for link in collect_links(url, soup):
            if link not in visited and same_domain(start_url, link):
                queue.append(link)

    return {
        "start_url": start_url,
        "pages_checked": len(visited),
        "relevant_pages": relevant_pages,
        "errors": errors,
    }


def crawl_batch(urls: List[str]) -> List[Dict[str, List[Dict[str, str]]]]:
    return [crawl_site(url) for url in urls]
