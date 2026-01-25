from datetime import datetime
import json
import os
from pathlib import Path
import uuid

from flask import Flask, redirect, render_template, request, send_from_directory, url_for

from crawler import crawl_batch
from csv_tools import clean_urls_from_csv, find_website_column

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
UPLOAD_DIR = DATA_DIR / "uploads"
CLEAN_DIR = DATA_DIR / "cleaned"
RESULTS_DIR = DATA_DIR / "results"

ALLOWED_EXTENSIONS = {".csv"}

app = Flask(__name__)


@app.get("/")
def index():
    return render_template("index.html")


@app.post("/upload")
def upload_csv():
    if "file" not in request.files:
        return render_template("index.html", error="Please upload a CSV file.")

    file = request.files["file"]
    if not file.filename:
        return render_template("index.html", error="Please choose a CSV file.")

    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        return render_template("index.html", error="Only CSV files are supported.")

    run_id = uuid.uuid4().hex
    upload_path = UPLOAD_DIR / f"{run_id}.csv"
    file.save(upload_path)

    website_column = find_website_column(upload_path)
    if not website_column:
        return render_template(
            "index.html",
            error="Could not find a website/url column. Please include a Website or URL column.",
        )

    cleaned_urls, stats = clean_urls_from_csv(upload_path, website_column)

    cleaned_path = CLEAN_DIR / f"{run_id}.json"
    with cleaned_path.open("w", encoding="utf-8") as handle:
        json.dump(cleaned_urls, handle, indent=2)

    return render_template(
        "review.html",
        run_id=run_id,
        website_column=website_column,
        stats=stats,
        total=len(cleaned_urls),
        sample_urls=cleaned_urls[:10],
    )


@app.post("/crawl")
def crawl_urls():
    run_id = request.form.get("run_id")
    batch_size = request.form.get("batch_size", type=int, default=20)
    if not run_id:
        return redirect(url_for("index"))

    cleaned_path = CLEAN_DIR / f"{run_id}.json"
    if not cleaned_path.exists():
        return redirect(url_for("index"))

    with cleaned_path.open("r", encoding="utf-8") as handle:
        urls = json.load(handle)

    batch_size = max(1, min(batch_size, 100))
    batches = [urls[i : i + batch_size] for i in range(0, len(urls), batch_size)]

    result_files = []
    for index, batch in enumerate(batches, start=1):
        batch_results = crawl_batch(batch)
        result_file = RESULTS_DIR / f"{run_id}_batch_{index}.json"
        with result_file.open("w", encoding="utf-8") as handle:
            json.dump(
                {
                    "run_id": run_id,
                    "batch": index,
                    "batch_size": len(batch),
                    "generated_at": datetime.utcnow().isoformat() + "Z",
                    "results": batch_results,
                },
                handle,
                indent=2,
            )
        result_files.append(result_file.name)

    return render_template(
        "results.html",
        run_id=run_id,
        total=len(urls),
        batch_size=batch_size,
        batch_count=len(batches),
        result_files=result_files,
    )


@app.get("/results/<path:filename>")
def download_result(filename):
    return send_from_directory(RESULTS_DIR, filename, as_attachment=True)


if __name__ == "__main__":
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    os.makedirs(CLEAN_DIR, exist_ok=True)
    os.makedirs(RESULTS_DIR, exist_ok=True)
    app.run(host="0.0.0.0", port=5000, debug=True)
