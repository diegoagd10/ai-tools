#!/usr/bin/env bash
# Applies this repo's GitHub rules: main only changes through a pull request whose checks pass, for
# admins too. Run it once per repo, with admin access: `./scripts/protect-main.sh [owner/repo]`.
# Branch protection needs a public repo or GitHub Pro, and CodeQL a public repo or GitHub Advanced
# Security. The required names must match the jobs in .github/workflows.
set -euo pipefail

repo="${1:-$(gh repo view --json nameWithOwner --jq .nameWithOwner)}"

gh api --method PUT "repos/$repo/branches/main/protection" --input - >/dev/null <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["Vite+ check", "Unit tests and coverage", "Web tests", "Docker images", "analyze"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": { "required_approving_review_count": 0 },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON

gh api --method PUT "repos/$repo/vulnerability-alerts" >/dev/null
gh api --method PUT "repos/$repo/automated-security-fixes" >/dev/null
gh api --method PATCH "repos/$repo" --input - >/dev/null <<'JSON'
{
  "delete_branch_on_merge": true,
  "security_and_analysis": {
    "secret_scanning": { "status": "enabled" },
    "secret_scanning_push_protection": { "status": "enabled" }
  }
}
JSON

echo "Protected main on $repo"
