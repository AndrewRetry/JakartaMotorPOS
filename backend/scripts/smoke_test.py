"""Smoke-test every entity endpoint against a running backend.

Start the backend first (python app.py), then in another terminal:

    python scripts/smoke_test.py

Exits non-zero if anything fails, so it is usable in a pre-commit hook later.
"""

import json
import sys
import urllib.error
import urllib.parse
import urllib.request

BASE_URL = "http://127.0.0.1:5000/api"

# Row counts as imported from the CSVs.
EXPECTED_ROW_COUNTS = {
    "kategori": 1,
    "supplier": 89,
    "customer": 9,
    "barang": 20494,
}

# A search term that must match at least one row in each table.
SEARCH_TERMS = {
    "kategori": "lampu",
    "supplier": "yamaha",
    "customer": "budi",
    "barang": "balon osram",
}


def request_json(path):
    """GET a path and return (parsed_body, http_status)."""
    try:
        with urllib.request.urlopen(f"{BASE_URL}{path}", timeout=60) as response:
            return json.load(response), response.status
    except urllib.error.HTTPError as error:
        return json.load(error), error.code
    except urllib.error.URLError as error:
        sys.exit(f"Cannot reach {BASE_URL} -- is the backend running? ({error.reason})")


def record(passed, label, failures, failure_message):
    print(f"  {'PASS' if passed else 'FAIL'}  {label}")
    if not passed:
        failures.append(failure_message)


def check_entity(entity, expected_total, failures):
    print(f"\n{entity}")

    listing, status = request_json(f"/{entity}?limit=1")
    if status != 200:
        record(False, f"list -> HTTP {status}", failures, f"{entity}: list returned {status}")
        return

    total = listing.get("total")
    record(total == expected_total, f"row count {total} (expected {expected_total})",
           failures, f"{entity}: expected {expected_total} rows, got {total}")

    rows = listing.get("data") or []
    if not rows:
        record(False, "no rows returned", failures, f"{entity}: list returned no rows")
        return

    # The response contract: every value the API returns is a string.
    non_strings = {key: type(value).__name__
                   for key, value in rows[0].items() if not isinstance(value, str)}
    record(not non_strings, "all values are strings",
           failures, f"{entity}: non-string values {non_strings}")

    # A single-record fetch returns a bare object, not a {data: ...} envelope.
    record_id = rows[0]["id"]
    detail, status = request_json(f"/{entity}/{record_id}")
    record(status == 200 and detail.get("id") == record_id,
           f"GET /{entity}/{record_id} returns that record",
           failures, f"{entity}: detail fetch returned {status}")

    # Multi-token search: every token must match, so results are a subset.
    term = SEARCH_TERMS[entity]
    query = urllib.parse.urlencode({"q": term, "limit": 5})
    found, status = request_json(f"/{entity}?{query}")
    matched = found.get("total", 0)
    record(status == 200 and 0 < matched <= expected_total,
           f"search {term!r} -> {matched} match(es)",
           failures, f"{entity}: search {term!r} returned {matched}")


def main():
    failures = []
    for entity, expected_total in EXPECTED_ROW_COUNTS.items():
        check_entity(entity, expected_total, failures)

    print()
    if failures:
        print(f"{len(failures)} problem(s):")
        for failure in failures:
            print(f"  - {failure}")
        sys.exit(1)
    print("All smoke tests passed.")


if __name__ == "__main__":
    main()