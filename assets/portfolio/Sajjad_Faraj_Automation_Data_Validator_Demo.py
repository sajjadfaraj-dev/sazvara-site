#!/usr/bin/env python3
"""Small portfolio demonstration: clean and validate a CSV dataset.

Purpose: show a bounded automation workflow that normalizes common fields,
flags unresolved records, and produces an explicit QA report instead of
silently guessing.

Stdlib only. Usage:
  python 03_Automation_Data_Validator.py input.csv output_clean.csv output_issues.csv
"""
from __future__ import annotations

import csv
import re
import sys
from pathlib import Path

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
URL_RE = re.compile(r"^https?://[^/\s]+(?:/.*)?$", re.I)


def normalize_id(value: str) -> str:
    value = (value or "").strip().upper().replace(" ", "")
    match = re.match(r"ORG-?(\d+)", value)
    return f"ORG-{int(match.group(1)):03d}" if match else value


def normalize_name(value: str) -> str:
    value = " ".join((value or "").split())
    return value.replace("داده پرداز", "داده‌پرداز")


def normalize_phone(value: str) -> str:
    digits = re.sub(r"\D", "", value or "")
    if not digits:
        return ""
    if digits.startswith("98") and len(digits) > 10:
        digits = "0" + digits[2:]
    return digits if digits.startswith("0") else "0" + digits


def normalize_email(value: str) -> str:
    return (value or "").strip().lower()


def normalize_url(value: str) -> str:
    value = (value or "").strip()
    if not value:
        return ""
    if not re.match(r"^https?://", value, re.I):
        value = "https://" + value
    return value.rstrip("/")


def validate_row(row: dict[str, str], seen: dict[tuple[str, str], str]) -> tuple[dict[str, str], list[str]]:
    clean = dict(row)
    clean["Record ID"] = normalize_id(row.get("Record ID", ""))
    clean["Organization"] = normalize_name(row.get("Organization", ""))
    city = (row.get("City", "") or "").strip()
    clean["City"] = {"Tehran": "تهران", "tehran": "تهران"}.get(city, city)
    clean["Phone"] = normalize_phone(row.get("Phone", ""))
    clean["Email"] = normalize_email(row.get("Email", ""))
    clean["Website"] = normalize_url(row.get("Website", ""))
    status = (row.get("Status", "") or "").strip()
    clean["Status"] = {"active": "فعال", "Active": "فعال", "inactive": "غیرفعال"}.get(status, status)

    issues: list[str] = []
    if not clean["Phone"]:
        issues.append("Missing phone")
    if not EMAIL_RE.match(clean["Email"]):
        issues.append("Invalid email")
    if not URL_RE.match(clean["Website"]):
        issues.append("Missing/invalid website")

    key = (clean["Organization"].replace("‌", "").replace(" ", ""), clean["Phone"] or clean["Email"])
    if key in seen:
        issues.append(f"Possible duplicate of {seen[key]}")
    else:
        seen[key] = clean["Record ID"]

    clean["QA Result"] = " | ".join(issues) if issues else "OK"
    return clean, issues


def run(input_csv: Path, clean_csv: Path, issues_csv: Path) -> tuple[int, int]:
    with input_csv.open(newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        if not reader.fieldnames:
            raise ValueError("Input CSV has no header row")

    seen: dict[tuple[str, str], str] = {}
    cleaned: list[dict[str, str]] = []
    issues_out: list[dict[str, str]] = []

    for row in rows:
        clean, issues = validate_row(row, seen)
        cleaned.append(clean)
        if issues:
            issues_out.append({
                "Record ID": clean["Record ID"],
                "Organization": clean["Organization"],
                "Issues": " ; ".join(issues),
                "Action": "Review",
            })

    clean_fields = list(reader.fieldnames) + ["QA Result"]
    with clean_csv.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=clean_fields)
        writer.writeheader()
        writer.writerows(cleaned)

    issue_fields = ["Record ID", "Organization", "Issues", "Action"]
    with issues_csv.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=issue_fields)
        writer.writeheader()
        writer.writerows(issues_out)

    return len(rows), len(issues_out)


def main() -> int:
    if len(sys.argv) != 4:
        print("Usage: python 03_Automation_Data_Validator.py input.csv output_clean.csv output_issues.csv", file=sys.stderr)
        return 2
    total, flagged = run(Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3]))
    print(f"Processed: {total}")
    print(f"Flagged for review: {flagged}")
    print(f"Passed QA: {total - flagged}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
