from tests.conftest import ADMIN_EMAIL, ADMIN_PASSWORD


def test_login_success(client):
    response = client.post("/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert response.status_code == 200
    body = response.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"


def test_login_wrong_password(client):
    response = client.post("/api/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"})
    assert response.status_code == 401


def test_login_unknown_email(client):
    response = client.post("/api/auth/login", json={"email": "nobody@example.com", "password": "x"})
    assert response.status_code == 401


def test_me_requires_auth(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_me_returns_current_user(client, auth_headers):
    response = client.get("/api/auth/me", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["email"] == ADMIN_EMAIL


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_login_sets_cookie(client):
    response = client.post("/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert response.status_code == 200
    assert "arc_access_token" in response.cookies


def test_me_with_cookie_only(client):
    client.post("/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    response = client.get("/api/auth/me")
    assert response.status_code == 200
    assert response.json()["email"] == ADMIN_EMAIL


def test_me_with_bearer_only(client, auth_headers):
    client.cookies.clear()
    response = client.get("/api/auth/me", headers=auth_headers)
    assert response.status_code == 200


def test_me_with_neither_fails(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_logout_clears_cookie(client):
    client.post("/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    response = client.post("/api/auth/logout")
    assert response.status_code == 200
    assert response.json() == {"ok": True}
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_create_list_revoke_token(client, auth_headers):
    response = client.post("/api/auth/tokens", json={"name": "my-extension"}, headers=auth_headers)
    assert response.status_code == 201
    body = response.json()
    assert body["token"].startswith("arc_")
    token_id = body["id"]
    pat = body["token"]

    response = client.get("/api/auth/tokens", headers=auth_headers)
    assert response.status_code == 200
    listed = response.json()
    assert len(listed) == 1
    assert "token" not in listed[0]
    assert "token_hash" not in listed[0]

    response = client.delete(f"/api/auth/tokens/{token_id}", headers=auth_headers)
    assert response.status_code == 204

    response = client.get("/api/auth/tokens", headers=auth_headers)
    assert response.json() == []


def test_use_pat_as_bearer_then_revoked(client, auth_headers):
    response = client.post("/api/auth/tokens", json={"name": "cli"}, headers=auth_headers)
    pat = response.json()["token"]
    token_id = response.json()["id"]
    pat_headers = {"Authorization": f"Bearer {pat}"}

    response = client.get("/api/applications", headers=pat_headers)
    assert response.status_code == 200

    client.delete(f"/api/auth/tokens/{token_id}", headers=auth_headers)

    response = client.get("/api/applications", headers=pat_headers)
    assert response.status_code == 401
