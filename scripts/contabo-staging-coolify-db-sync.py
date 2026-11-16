#!/usr/bin/env python3
"""Synchronize ONLY 786.Chat's Contabo staging DATABASE_URL via local Coolify API.

Run on the Contabo VPS as deploy, never as root. Requires an API token with
application read/update/deploy permissions. No secrets are printed or written
by this script. This does NOT change Postgres role passwords or production.
"""
from __future__ import annotations

import argparse
import getpass
import json
import os
from pathlib import Path
import re
import stat
import sys
import urllib.error
import urllib.parse
import urllib.request

COOLIFY_API = "http://127.0.0.1:8000/api/v1"
APP_NAME = "786-chat-staging-app"
STAGING_HOST = "staging.786.chat"
STAGING_DB = "chat786_staging"
DB_HOST = "ekl96xrpncvtu6clh8bzfshd"
DB_USER = "chat786_app"
DATABASE_URL_KEY = "DATABASE_URL"
STAGING_BRANCH = "contabo-staging-db-adapter-20261114"
PASSFILE = ".786-chat-staging-db-password"


def fail(message: str) -> None:
    raise RuntimeError(message)


def api_request(token: str, path: str, method: str = "GET", body: dict | None = None):
    payload = json.dumps(body).encode("utf-8") if body is not None else None
    request = urllib.request.Request(
        COOLIFY_API + path,
        data=payload,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json", "Accept": "application/json"},
        method=method,
    )
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            raw = response.read(200000)
            return json.loads(raw.decode("utf-8")) if raw.strip() else None
    except urllib.error.HTTPError as exc:
        fail(f"Coolify API returned HTTP {exc.code} during {method} {path.split('?')[0]}. Check token permissions. No password was changed.")
    except (urllib.error.URLError, TimeoutError) as exc:
        fail(f"Cannot reach local Coolify API at 127.0.0.1:8000 ({type(exc).__name__}). No password was changed.")
    except ValueError:
        fail("Coolify returned a non-JSON response; stopping without disclosing secrets.")


def hostname(value: str) -> str:
    value = value.strip()
    parsed = urllib.parse.urlparse(value if "://" in value else "https://" + value)
    return (parsed.hostname or "").lower()


def select_app(apps) -> dict:
    if isinstance(apps, dict):
        apps = apps.get("data") or apps.get("applications")
    if not isinstance(apps, list):
        fail("Unexpected Coolify application list response; no changes made.")
    selected = [a for a in apps if isinstance(a, dict) and a.get("name") == APP_NAME]
    if len(selected) != 1:
        fail(f"Expected exactly one {APP_NAME}; found {len(selected)}. No changes made.")
    app = selected[0]
    hosts = [hostname(part) for part in str(app.get("fqdn") or "").split(",") if part.strip()]
    if STAGING_HOST not in hosts or any(h in ("786.chat", "www.786.chat") for h in hosts):
        fail("Application domain did not match staging.786.chat exclusively. Refusing to modify a live/unknown app.")
    repo = str(app.get("git_repository") or "").lower()
    if not ("786-chat/786-chat" in repo or "786-chat/786-chat.git" in repo):
        fail("GitHub repository does not match the original 786-Chat/786-chat. No changes made.")
    branch = str(app.get("git_branch") or "").removeprefix("refs/heads/")
    if branch != STAGING_BRANCH:
        fail(f"Coolify is configured for branch {branch!r}, not the audited staging adapter branch. Fix source first; no changes made.")
    uuid = app.get("uuid")
    if not isinstance(uuid, str) or not re.fullmatch(r"[\w-]{10,80}", uuid):
        fail("Unexpected application UUID; no changes made.")
    return app


def select_env(envs) -> dict:
    if isinstance(envs, dict):
        envs = envs.get("data") or envs.get("envs")
    if not isinstance(envs, list):
        fail("Unexpected Coolify environment-variable list; no changes made.")
    production = [e for e in envs if isinstance(e, dict) and e.get("key") == DATABASE_URL_KEY and not e.get("is_preview", False)]
    if len(production) != 1:
        fail(f"Expected exactly one production-scope DATABASE_URL on staging; found {len(production)}. No changes made.")
    return production[0]


def read_password() -> str:
    path = Path.home() / PASSFILE
    try:
        info = path.stat()
    except FileNotFoundError:
        fail(f"Saved PostgreSQL password file is missing at ~/{PASSFILE}; do not reset anything.")
    if not stat.S_ISREG(info.st_mode) or info.st_mode & 0o077:
        fail("Password file is not private (expected mode 600). No changes made.")
    if info.st_uid != os.getuid():
        fail("Password file belongs to a different user; run as deploy, without sudo.")
    password = path.read_text(encoding="ascii").strip()
    if not re.fullmatch(r"[0-9a-f]{48}", password):
        fail("Saved PostgreSQL password format is invalid; no changes made.")
    return password


def main() -> None:
    parser = argparse.ArgumentParser(description="Safely sync Contabo staging DB credentials to Coolify")
    parser.add_argument("--apply", action="store_true", help="Update staging DATABASE_URL and queue staging deployment")
    args = parser.parse_args()
    if os.geteuid() == 0:
        fail("Run this script as deploy, without sudo/root.")
    if os.path.expanduser("~") != "/home/deploy":
        fail("This script must run as /home/deploy on the Contabo VPS.")
    password = read_password()
    token = (os.environ.get("COOLIFY_API_TOKEN") or getpass.getpass("Coolify API token (input hidden): ")).strip()
    if len(token) < 16 or any(c.isspace() for c in token):
        fail("Invalid Coolify API token format. No changes made.")
    app = select_app(api_request(token, "/applications"))
    uuid = app["uuid"]
    _current_env = select_env(api_request(token, f"/applications/{uuid}/envs"))
    print(f"CHECK PASSED: {APP_NAME} | {STAGING_HOST} | {STAGING_BRANCH}")
    print("CHECK PASSED: saved private 48-character staging database password found")
    print("No passwords or connection strings are displayed.")
    if not args.apply:
        print("DRY RUN ONLY: no settings modified. To apply, rerun with --apply.")
        return
    url = f"postgresql://{DB_USER}:{password}@{DB_HOST}:5432/{STAGING_DB}"
    api_request(token, f"/applications/{uuid}/envs", method="PATCH", body={
        "key": DATABASE_URL_KEY, "value": url, "is_preview": False, "is_literal": True,
        "is_multiline": False,
    })
    print("SUCCESS: updated only staging application's production-scope DATABASE_URL.")
    deployment = api_request(token, "/deploy?" + urllib.parse.urlencode({"uuid": uuid}), method="POST")
    if isinstance(deployment, dict) and deployment.get("deployments"):
        print("SUCCESS: new staging deployment queued. Verify Coolify deployment logs and staging login.")
    else:
        print("DEPLOY REQUEST SENT: Check Coolify staging deployments page for its result.")
    print("UNCHANGED: live 786.chat, Neon, Vercel, users, projects, and PostgreSQL role password.")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"STOP: {exc}", file=sys.stderr)
        sys.exit(1)
