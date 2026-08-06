"""Parsing helpers for POST /api/import/link (schema.org JobPosting JSON-LD, OG fallback)."""

import json
import re
from html.parser import HTMLParser
from urllib.parse import urlparse

DESCRIPTION_MAX_LEN = 2000
FIELD_MAX_LEN = 255

_SOURCE_DOMAINS = {
    "linkedin.com": "LinkedIn",
    "indeed.com": "Indeed",
    "greenhouse.io": "Greenhouse",
    "lever.co": "Lever",
    "workable.com": "Workable",
    "icims.com": "iCIMS",
    "workday.com": "Workday",
    "smartrecruiters.com": "SmartRecruiters",
}

_TAG_RE = re.compile(r"<[^>]+>")
_WHITESPACE_RE = re.compile(r"\s+")


def derive_source(url: str) -> str:
    hostname = (urlparse(url).hostname or "").lower()
    if hostname.startswith("www."):
        hostname = hostname[4:]
    for domain, label in _SOURCE_DOMAINS.items():
        if hostname == domain or hostname.endswith("." + domain):
            return label
    return hostname or url


def truncate(value: str | None, limit: int) -> str | None:
    if not isinstance(value, str):
        return None
    cleaned = value.strip()
    return cleaned[:limit] if cleaned else None


def clean_description(value: object) -> str | None:
    if not isinstance(value, str) or not value:
        return None
    text = _TAG_RE.sub(" ", value)
    text = _WHITESPACE_RE.sub(" ", text).strip()
    return text[:DESCRIPTION_MAX_LEN] if text else None


class _HtmlDataExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.ld_json_blocks: list[str] = []
        self.meta: dict[str, str] = {}
        self.title: str | None = None
        self._in_ld_json = False
        self._in_title = False
        self._ld_json_buffer: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attrs_d = dict(attrs)
        if tag == "script" and (attrs_d.get("type") or "").lower() == "application/ld+json":
            self._in_ld_json = True
            self._ld_json_buffer = []
        elif tag == "meta":
            key = attrs_d.get("property") or attrs_d.get("name")
            content = attrs_d.get("content")
            if key and content is not None:
                self.meta[key] = content
        elif tag == "title":
            self._in_title = True

    def handle_endtag(self, tag: str) -> None:
        if tag == "script" and self._in_ld_json:
            self._in_ld_json = False
            self.ld_json_blocks.append("".join(self._ld_json_buffer))
        elif tag == "title":
            self._in_title = False

    def handle_data(self, data: str) -> None:
        if self._in_ld_json:
            self._ld_json_buffer.append(data)
        elif self._in_title and self.title is None:
            self.title = data.strip()


def _find_job_posting(node: object) -> dict | None:
    if isinstance(node, dict):
        type_ = node.get("@type")
        types = type_ if isinstance(type_, list) else [type_]
        if "JobPosting" in types:
            return node
        for value in node.values():
            found = _find_job_posting(value)
            if found is not None:
                return found
    elif isinstance(node, list):
        for item in node:
            found = _find_job_posting(item)
            if found is not None:
                return found
    return None


def _extract_location(job_location: object) -> str | None:
    if isinstance(job_location, list):
        job_location = job_location[0] if job_location else None
    if not isinstance(job_location, dict):
        return None
    address = job_location.get("address")
    if isinstance(address, str):
        return address
    if not isinstance(address, dict):
        return None
    parts = [address.get("addressLocality"), address.get("addressRegion"), address.get("addressCountry")]
    parts = [p for p in parts if isinstance(p, str) and p]
    return ", ".join(parts) if parts else None


def _format_amount(n: float) -> str:
    if n >= 1000:
        formatted = f"{n / 1000:g}k"
    else:
        formatted = f"{n:g}"
    return formatted


def _extract_salary(base_salary: object) -> str | None:
    if base_salary is None:
        return None
    if isinstance(base_salary, str):
        return base_salary.strip() or None
    if not isinstance(base_salary, dict):
        return None

    currency = base_salary.get("currency") or ""
    value = base_salary.get("value")
    if isinstance(value, dict):
        min_value = value.get("minValue")
        max_value = value.get("maxValue")
        single_value = value.get("value")
        if isinstance(min_value, (int, float)) and isinstance(max_value, (int, float)):
            return f"{currency} {_format_amount(min_value)}-{_format_amount(max_value)}".strip()
        if isinstance(single_value, (int, float)):
            return f"{currency} {_format_amount(single_value)}".strip()
    elif isinstance(value, (int, float)):
        return f"{currency} {_format_amount(value)}".strip()

    return json.dumps(base_salary)


def _extract_company(hiring_org: object) -> str | None:
    if isinstance(hiring_org, dict):
        name = hiring_org.get("name")
        return name if isinstance(name, str) else None
    if isinstance(hiring_org, str):
        return hiring_org
    return None


def parse_job_html(html: str) -> dict[str, str | None] | None:
    """Extract job fields from HTML: JSON-LD JobPosting first, then OG/title fallback."""
    parser = _HtmlDataExtractor()
    parser.feed(html)

    for block in parser.ld_json_blocks:
        try:
            data = json.loads(block)
        except (json.JSONDecodeError, ValueError):
            continue
        job_posting = _find_job_posting(data)
        if job_posting is not None:
            result = {
                "company": _extract_company(job_posting.get("hiringOrganization")),
                "role": job_posting.get("title") if isinstance(job_posting.get("title"), str) else None,
                "location": _extract_location(job_posting.get("jobLocation")),
                "salary": _extract_salary(job_posting.get("baseSalary")),
                "description": clean_description(job_posting.get("description")),
            }
            if any(result.values()):
                return result

    role = parser.meta.get("og:title") or parser.title
    description = clean_description(parser.meta.get("og:description"))
    if role is None and description is None:
        return None
    return {"company": None, "role": role, "location": None, "salary": None, "description": description}
