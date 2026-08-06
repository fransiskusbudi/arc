import httpx
import pytest

from app.routers import import_link

JOB_POSTING_HTML = """
<html>
<head>
<script type="application/ld+json">
{
  "@context": "https://schema.org/",
  "@type": "JobPosting",
  "title": "Senior Data Engineer",
  "hiringOrganization": {"@type": "Organization", "name": "Acme Corp"},
  "jobLocation": {
    "@type": "Place",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "London",
      "addressRegion": "England",
      "addressCountry": "UK"
    }
  },
  "baseSalary": {
    "@type": "MonetaryAmount",
    "currency": "GBP",
    "value": {"@type": "QuantitativeValue", "minValue": 100000, "maxValue": 120000, "unitText": "YEAR"}
  },
  "description": "<p>Build <b>data</b> pipelines.</p>"
}
</script>
<title>Senior Data Engineer at Acme Corp</title>
</head>
<body></body>
</html>
"""

OG_ONLY_HTML = """
<html>
<head>
<meta property="og:title" content="Product Manager at Globex" />
<meta property="og:description" content="Own the roadmap for our platform." />
<title>Product Manager - Globex Careers</title>
</head>
<body></body>
</html>
"""

EMPTY_HTML = "<html><head></head><body>Nothing here</body></html>"


def _mock_transport(html: str, status_code: int = 200) -> httpx.MockTransport:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(status_code, text=html)

    return httpx.MockTransport(handler)


def _patch_client(monkeypatch, html: str, status_code: int = 200) -> None:
    transport = _mock_transport(html, status_code)
    monkeypatch.setattr(
        import_link,
        "_build_http_client",
        lambda: httpx.Client(transport=transport, follow_redirects=True, timeout=8.0),
    )


def test_import_mode_a_json_ld(client, auth_headers, monkeypatch):
    _patch_client(monkeypatch, JOB_POSTING_HTML)
    response = client.post(
        "/api/import/link",
        json={"url": "https://boards.greenhouse.io/acme/jobs/123"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["company"] == "Acme Corp"
    assert body["role"] == "Senior Data Engineer"
    assert body["location"] == "London, England, UK"
    assert body["salary"] == "GBP 100k-120k"
    assert body["description"] == "Build data pipelines."
    assert body["source"] == "Greenhouse"
    assert body["url"] == "https://boards.greenhouse.io/acme/jobs/123"


def test_import_mode_a_og_fallback(client, auth_headers, monkeypatch):
    _patch_client(monkeypatch, OG_ONLY_HTML)
    response = client.post(
        "/api/import/link",
        json={"url": "https://www.linkedin.com/jobs/view/456"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["role"] == "Product Manager at Globex"
    assert body["description"] == "Own the roadmap for our platform."
    assert body["company"] is None
    assert body["source"] == "LinkedIn"


def test_import_mode_a_failure_no_extractable_data(client, auth_headers, monkeypatch):
    _patch_client(monkeypatch, EMPTY_HTML)
    response = client.post(
        "/api/import/link",
        json={"url": "https://jobs.somecompany.com/posting/1"},
        headers=auth_headers,
    )
    assert response.status_code == 422


def test_import_mode_a_fetch_error(client, auth_headers, monkeypatch):
    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectTimeout("timed out", request=request)

    monkeypatch.setattr(
        import_link,
        "_build_http_client",
        lambda: httpx.Client(transport=httpx.MockTransport(handler), follow_redirects=True, timeout=8.0),
    )
    response = client.post(
        "/api/import/link", json={"url": "https://example.com/job/1"}, headers=auth_headers
    )
    assert response.status_code == 422


def test_import_mode_b_passthrough(client, auth_headers):
    response = client.post(
        "/api/import/link",
        json={
            "url": "https://jobs.lever.co/acme/789",
            "extracted": {
                "company": "Lever Co",
                "role": "Backend Engineer",
                "location": "Remote",
                "salary": "USD 150k",
                "description": "Ship backend systems.",
            },
        },
        headers=auth_headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert body == {
        "company": "Lever Co",
        "role": "Backend Engineer",
        "location": "Remote",
        "salary": "USD 150k",
        "description": "Ship backend systems.",
        "source": "Lever",
        "url": "https://jobs.lever.co/acme/789",
    }


@pytest.mark.parametrize(
    "url,expected",
    [
        ("https://www.linkedin.com/jobs/view/1", "LinkedIn"),
        ("https://uk.indeed.com/viewjob?jk=1", "Indeed"),
        ("https://boards.greenhouse.io/acme/jobs/1", "Greenhouse"),
        ("https://jobs.lever.co/acme/1", "Lever"),
        ("https://apply.workable.com/acme/j/1", "Workable"),
        ("https://acme.icims.com/jobs/1", "iCIMS"),
        ("https://acme.wd1.myworkday.com/job/1".replace("myworkday.com", "workday.com"), "Workday"),
        ("https://jobs.smartrecruiters.com/Acme/1", "SmartRecruiters"),
        ("https://jobs.somecompany.com/posting/1", "jobs.somecompany.com"),
    ],
)
def test_source_derivation(client, auth_headers, url, expected):
    response = client.post(
        "/api/import/link",
        json={"url": url, "extracted": {"role": "X"}},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["source"] == expected


def test_import_requires_auth(client):
    response = client.post("/api/import/link", json={"url": "https://example.com/job/1"})
    assert response.status_code == 401
