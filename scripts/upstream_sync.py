#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import textwrap
import urllib.error
import urllib.request
from pathlib import Path


CHANGELOG_VERSION_RE = re.compile(r"^\|\s*(v[0-9A-Za-z.\-]+)\s*\|", re.MULTILINE)
ENV_VAR_LINE_RE = re.compile(r"^[+-]\s*[A-Z][A-Z0-9_]{2,}\s*=", re.MULTILINE)


def run(*args: str, check: bool = True) -> str:
    completed = subprocess.run(
        args,
        check=check,
        capture_output=True,
        text=True,
    )
    return completed.stdout.strip()


def git(*args: str, check: bool = True) -> str:
    return run("git", *args, check=check)


def append_output(name: str, value: str) -> None:
    output_path = os.environ.get("GITHUB_OUTPUT")
    if not output_path:
        return

    with open(output_path, "a", encoding="utf-8") as handle:
        handle.write(f"{name}<<__EOF__\n{value}\n__EOF__\n")


def parse_versions(changelog_path: Path) -> list[str]:
    if not changelog_path.exists():
        return []
    text = changelog_path.read_text(encoding="utf-8")
    return CHANGELOG_VERSION_RE.findall(text)


def fetch_releases(repo: str, token: str | None) -> list[dict[str, object]]:
    request = urllib.request.Request(
        f"https://api.github.com/repos/{repo}/releases?per_page=20",
        headers={
            "Accept": "application/vnd.github+json",
            "User-Agent": "deeptutor-upstream-sync",
            **({"Authorization": f"Bearer {token}"} if token else {}),
        },
    )
    with urllib.request.urlopen(request) as response:
        payload = json.load(response)
    return [release for release in payload if not release.get("draft")]


def release_already_present(tag: str, base_ref: str) -> bool:
    result = subprocess.run(
        ["git", "merge-base", "--is-ancestor", f"refs/tags/{tag}", base_ref],
        capture_output=True,
        text=True,
    )
    return result.returncode == 0


def detect_high_risk_changes(changed_files: list[str], diff_text: str) -> list[str]:
    findings: list[str] = []

    if "requirements.txt" in changed_files:
        findings.append("- `requirements.txt` changed.")

    if "pyproject.toml" in changed_files:
        findings.append("- `pyproject.toml` changed.")

    env_files = [
        path
        for path in changed_files
        if path.startswith(".env")
        or path.endswith(".env")
        or ".env." in path
        or path.endswith(".env.example")
        or path.endswith("/.env.example")
    ]
    if env_files or ENV_VAR_LINE_RE.search(diff_text):
        details = ", ".join(f"`{path}`" for path in env_files[:8]) or "diff hunk content"
        findings.append(f"- Environment variable changes detected in {details}.")

    schema_files = [
        path
        for path in changed_files
        if path.endswith(".sql")
        or "schema" in path.lower()
        or "migration" in path.lower()
        or "alembic" in path.lower()
    ]
    if schema_files:
        findings.append(
            "- Database schema-related files changed: "
            + ", ".join(f"`{path}`" for path in schema_files[:8])
            + "."
        )

    api_route_files = [
        path
        for path in changed_files
        if path.startswith("deeptutor/api/routers/")
        or (path.startswith("web/app/api/") and path.endswith("/route.ts"))
    ]
    if api_route_files:
        findings.append(
            "- API route files changed: "
            + ", ".join(f"`{path}`" for path in api_route_files[:8])
            + "."
        )

    if "web/lib/deeptutor.ts" in changed_files:
        findings.append("- Main DeepTutor client interface `web/lib/deeptutor.ts` changed.")

    return findings


def render_pr_body(
    *,
    tag: str,
    release_url: str,
    release_notes: str,
    deeptutor_files: list[str],
    high_risk_findings: list[str],
) -> str:
    files_section = (
        "\n".join(f"- `{path}`" for path in deeptutor_files)
        if deeptutor_files
        else "- No files under `deeptutor/` changed."
    )

    high_risk_section = (
        "\n".join(high_risk_findings)
        if high_risk_findings
        else "- No high-risk changes detected in the flagged areas."
    )

    notes = release_notes.strip() or "_No upstream release notes were provided._"

    return textwrap.dedent(
        f"""\
        ## Upstream release

        - Release: [{tag}]({release_url})

        ## Release notes

        {notes}

        ## Changed files in `deeptutor/`

        {files_section}

        ## High-risk changes

        {high_risk_section}

        ## Review checklist

        - [ ] reviewed release notes
        - [ ] no breaking API changes affect `web/lib/deeptutor.ts`
        - [ ] tested locally
        - [ ] no new required env vars unaccounted for
        """
    ).strip() + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description="Prepare an upstream sync branch and PR body.")
    parser.add_argument("--base-ref", default="main")
    parser.add_argument("--upstream-remote", default="upstream")
    parser.add_argument("--repo", default="HKUDS/DeepTutor")
    parser.add_argument("--changelog", default="CHANGELOG-upstream.md")
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    changelog_path = Path(args.changelog)
    merged_versions = parse_versions(changelog_path)
    token = os.environ.get("GITHUB_TOKEN")

    try:
        releases = fetch_releases(args.repo, token)
    except urllib.error.URLError as error:
        print(f"Failed to fetch upstream releases: {error}", file=sys.stderr)
        return 1

    release = next(
        (
            candidate
            for candidate in releases
            if str(candidate["tag_name"]) not in merged_versions
        ),
        None,
    )

    if not release:
        append_output("new_release", "false")
        append_output("reason", "No upstream release is newer than the merge log.")
        return 0

    tag = str(release["tag_name"])
    title = f"Upstream sync: DeepTutor {tag}"
    branch = f"upstream-sync/{tag}"

    if release_already_present(tag, args.base_ref):
        append_output("new_release", "false")
        append_output(
            "reason",
            f"Upstream release {tag} is already present on {args.base_ref}; update CHANGELOG-upstream.md when appropriate.",
        )
        return 0

    git("fetch", args.upstream_remote, "--tags", "--prune")

    base_sha = git("rev-parse", args.base_ref)
    git("checkout", "-B", branch, args.base_ref)

    try:
        git("merge", "--no-ff", "-m", f"chore(upstream): sync DeepTutor {tag}", f"refs/tags/{tag}")
    except subprocess.CalledProcessError:
        subprocess.run(["git", "merge", "--abort"], capture_output=True, text=True)
        raise

    head_sha = git("rev-parse", "HEAD")
    changed_files = [
        path for path in git("diff", "--name-only", f"{base_sha}..{head_sha}").splitlines() if path
    ]
    deeptutor_files = [
        path for path in changed_files if path == "deeptutor" or path.startswith("deeptutor/")
    ]
    diff_text = git("diff", "--unified=0", f"{base_sha}..{head_sha}")
    high_risk_findings = detect_high_risk_changes(changed_files, diff_text)

    body = render_pr_body(
        tag=tag,
        release_url=str(release["html_url"]),
        release_notes=str(release.get("body") or ""),
        deeptutor_files=deeptutor_files,
        high_risk_findings=high_risk_findings,
    )

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(body, encoding="utf-8")

    append_output("new_release", "true")
    append_output("branch", branch)
    append_output("tag", tag)
    append_output("title", title)
    append_output("body_path", str(output_path))
    append_output("base_sha", base_sha)
    append_output("head_sha", head_sha)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
