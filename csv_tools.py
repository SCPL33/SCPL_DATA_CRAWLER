import csv
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from urllib.parse import urlparse


def normalize_url(value: str) -> Optional[str]:
    cleaned = value.strip()
    if not cleaned:
        return None

    if not cleaned.startswith(("http://", "https://")):
        cleaned = f"http://{cleaned}"

    parsed = urlparse(cleaned)
    if not parsed.netloc:
        return None

    return cleaned


def find_website_column(csv_path: Path) -> Optional[str]:
    with csv_path.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.reader(handle)
        headers = next(reader, None)
        if not headers:
            return None

    normalized = {header.strip().lower(): header for header in headers}
    for candidate in ("website", "web site", "url", "website url", "site"):
        if candidate in normalized:
            return normalized[candidate]

    for header in headers:
        header_lower = header.lower()
        if "website" in header_lower or "url" in header_lower:
            return header

    return None


def clean_urls_from_csv(csv_path: Path, website_column: str) -> Tuple[List[str], Dict[str, int]]:
    urls = []
    missing = 0
    invalid = 0
    with csv_path.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            raw_value = row.get(website_column, "") if row else ""
            if raw_value is None or not str(raw_value).strip():
                missing += 1
                continue

            normalized = normalize_url(str(raw_value))
            if not normalized:
                invalid += 1
                continue

            urls.append(normalized)

    unique_urls = sorted(set(urls))
    stats = {
        "total_rows": len(urls) + missing + invalid,
        "missing": missing,
        "invalid": invalid,
        "duplicates": len(urls) - len(unique_urls),
        "unique": len(unique_urls),
    }
    return unique_urls, stats
