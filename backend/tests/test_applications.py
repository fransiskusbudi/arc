import datetime as dt


def _create_application(client, auth_headers, **overrides):
    payload = {
        "company": "Acme Corp",
        "role": "Data Lead",
        "source": "LinkedIn",
        "status": "lead",
        "cv_variant": "v1",
    }
    payload.update(overrides)
    return client.post("/api/applications", json=payload, headers=auth_headers)


def test_create_application(client, auth_headers):
    response = _create_application(client, auth_headers)
    assert response.status_code == 201
    body = response.json()
    assert body["company"] == "Acme Corp"
    assert body["status"] == "lead"
    assert body["id"] is not None


def test_create_requires_auth(client):
    response = client.post("/api/applications", json={"company": "Acme", "role": "Lead"})
    assert response.status_code == 401


def test_list_applications(client, auth_headers):
    _create_application(client, auth_headers, company="Acme")
    _create_application(client, auth_headers, company="Globex")
    response = client.get("/api/applications", headers=auth_headers)
    assert response.status_code == 200
    companies = {app["company"] for app in response.json()}
    assert companies == {"Acme", "Globex"}


def test_list_filter_by_status(client, auth_headers):
    _create_application(client, auth_headers, company="Acme", status="lead")
    _create_application(client, auth_headers, company="Globex", status="applied")
    response = client.get("/api/applications", params={"status": "applied"}, headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["company"] == "Globex"


def test_list_search_by_company(client, auth_headers):
    _create_application(client, auth_headers, company="Acme Corp")
    _create_application(client, auth_headers, company="Globex Inc")
    response = client.get("/api/applications", params={"q": "acme"}, headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["company"] == "Acme Corp"


def test_get_application(client, auth_headers):
    created = _create_application(client, auth_headers).json()
    response = client.get(f"/api/applications/{created['id']}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["id"] == created["id"]


def test_get_application_not_found(client, auth_headers):
    response = client.get("/api/applications/9999", headers=auth_headers)
    assert response.status_code == 404


def test_update_application(client, auth_headers):
    created = _create_application(client, auth_headers).json()
    response = client.put(
        f"/api/applications/{created['id']}", json={"status": "applied"}, headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["status"] == "applied"


def test_delete_application(client, auth_headers):
    created = _create_application(client, auth_headers).json()
    response = client.delete(f"/api/applications/{created['id']}", headers=auth_headers)
    assert response.status_code == 204
    response = client.get(f"/api/applications/{created['id']}", headers=auth_headers)
    assert response.status_code == 404


def test_create_application_with_recruiter(client, auth_headers):
    response = _create_application(client, auth_headers, recruiter="Daniel Neaves")
    assert response.status_code == 201
    assert response.json()["recruiter"] == "Daniel Neaves"


def test_due_filter(client, auth_headers):
    today = dt.date.today()
    soon = (today + dt.timedelta(days=3)).isoformat()
    far = (today + dt.timedelta(days=30)).isoformat()

    due_soon = _create_application(
        client, auth_headers, company="DueSoon", status="applied", next_followup=soon
    ).json()
    _create_application(
        client, auth_headers, company="DueFar", status="applied", next_followup=far
    )
    _create_application(client, auth_headers, company="NoFollowup", status="applied")
    due_but_terminal = _create_application(
        client, auth_headers, company="DueButRejected", status="lead", next_followup=soon
    ).json()
    client.put(
        f"/api/applications/{due_but_terminal['id']}",
        json={"status": "rejected"},
        headers=auth_headers,
    )

    response = client.get("/api/applications", params={"due": True}, headers=auth_headers)
    assert response.status_code == 200
    companies = [app["company"] for app in response.json()]
    assert companies == ["DueSoon"]
    assert response.json()[0]["id"] == due_soon["id"]


def test_status_history_recorded(client, auth_headers):
    created = _create_application(client, auth_headers).json()
    client.put(f"/api/applications/{created['id']}", json={"status": "applied"}, headers=auth_headers)
    client.put(f"/api/applications/{created['id']}", json={"status": "interviewing"}, headers=auth_headers)
    response = client.get(f"/api/applications/{created['id']}/history", headers=auth_headers)
    assert response.status_code == 200
    statuses = [entry["status"] for entry in response.json()]
    assert statuses == ["lead", "applied", "interviewing"]
