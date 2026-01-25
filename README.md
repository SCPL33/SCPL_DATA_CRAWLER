# Universal Scraping Model (Prototype)

This project provides a lightweight UI-driven crawler that accepts any CSV, finds the Website/URL column, cleans the data, and crawls each site in batches. The crawler focuses on pages likely to contain company contact or product details and stores each batch as JSON for downstream extraction.

## Features

- Upload any CSV and auto-detect the Website/URL column.
- Remove missing values, invalid URLs, and duplicates.
- Show a summary of how many rows will be crawled.
- Crawl URLs in batches (default 20) and store batch results as JSON.
- Only keep pages that look relevant to company/contact/product details.
- Multilingual relevance matching (common company/contact/product keywords across many languages).

## Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Run

```bash
python app.py
```

Open `http://localhost:5000` in your browser.

## Output

Batch results are written to `data/results/` as JSON files with metadata and relevant page snippets.
