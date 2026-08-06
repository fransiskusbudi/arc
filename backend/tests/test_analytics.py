def _create_application(client, auth_headers, **overrides):
    payload = {
        "company": "Acme Corp",
        "role": "Data Lead",
        "source": "LinkedIn",
        "status": "lead",
        "cv_variant": "v1",
    }
    payload.update(overrides)
    response = client.post("/api/applications", json=payload, headers=auth_headers)
    return response.json()


def _seed(client, auth_headers):
    a = _create_application(client, auth_headers, company="Acme", source="LinkedIn", cv_variant="v1")
    b = _create_application(client, auth_headers, company="Globex", source="Referral", cv_variant="v2")
    _create_application(client, auth_headers, company="Initech", source="LinkedIn", cv_variant="v1")

    client.put(f"/api/applications/{a['id']}", json={"status": "applied"}, headers=auth_headers)
    client.put(f"/api/applications/{a['id']}", json={"status": "interviewing"}, headers=auth_headers)
    client.put(f"/api/applications/{a['id']}", json={"status": "offer"}, headers=auth_headers)

    client.put(f"/api/applications/{b['id']}", json={"status": "applied"}, headers=auth_headers)
    client.put(f"/api/applications/{b['id']}", json={"status": "rejected"}, headers=auth_headers)


def test_summary(client, auth_headers):
    _seed(client, auth_headers)
    response = client.get("/api/analytics/summary", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 3
    assert body["by_status"]["offer"] == 1
    assert body["by_status"]["rejected"] == 1
    assert body["active"] == 2  # offer + lead, rejected excluded


def test_funnel(client, auth_headers):
    _seed(client, auth_headers)
    response = client.get("/api/analytics/funnel", headers=auth_headers)
    assert response.status_code == 200
    stages = {stage["stage"]: stage["count"] for stage in response.json()}
    assert stages["lead"] == 3
    assert stages["applied"] == 2
    assert stages["interviewing"] == 1
    assert stages["offer"] == 1


def test_sources(client, auth_headers):
    _seed(client, auth_headers)
    response = client.get("/api/analytics/sources", headers=auth_headers)
    assert response.status_code == 200
    by_source = {row["source"]: row for row in response.json()}
    assert by_source["LinkedIn"]["total"] == 2
    assert by_source["LinkedIn"]["interviews_or_better"] == 1
    assert by_source["Referral"]["total"] == 1
    assert by_source["Referral"]["interviews_or_better"] == 0


def test_timeline(client, auth_headers):
    _seed(client, auth_headers)
    response = client.get("/api/analytics/timeline", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert len(body) == 12
    assert sum(point["count"] for point in body) == 3


def test_response_times(client, auth_headers):
    _seed(client, auth_headers)
    response = client.get("/api/analytics/response-times", headers=auth_headers)
    assert response.status_code == 200
    transitions = {row["transition"] for row in response.json()}
    assert transitions == {"lead_to_applied", "applied_to_interviewing", "interviewing_to_offer"}


def test_cv_variants(client, auth_headers):
    _seed(client, auth_headers)
    response = client.get("/api/analytics/cv-variants", headers=auth_headers)
    assert response.status_code == 200
    by_variant = {row["cv_variant"]: row for row in response.json()}
    assert by_variant["v1"]["total"] == 2
    assert by_variant["v1"]["interviews_or_better"] == 1
    assert by_variant["v2"]["total"] == 1
