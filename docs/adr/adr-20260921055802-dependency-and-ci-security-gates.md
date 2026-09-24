# Dependency and CI Security Gates

## Status

Accepted

## Context

The npm workspaces repository needs one enforceable security baseline across local development and GitHub Actions. Git hooks alone are bypassable, unpinned Actions are a supply-chain risk, and newly published packages need time for ecosystem review.

## Decision

Use GitHub Actions as the required merge boundary with least-privilege permissions, full commit SHA pins, non-persistent checkout credentials, and concurrency/timeouts. Run format, lint, typecheck, tests, coverage, CDK synth, Playwright, npm audit/signature checks, actionlint, zizmor, gitleaks, and Renovate validation.

Pin Node.js 24.21.0 and npm 11.19.0. Restrict npm lifecycle scripts to the reviewed esbuild versions. Configure Renovate with a mandatory seven-day minimum release age and timestamp-required behavior for every dependency update, including vulnerability fixes. Disable automerge.

Use Husky and lint-staged for fast pre-commit feedback, but do not treat hooks as the enforcement boundary.

## Consequences

Dependency updates are deliberately delayed and urgent vulnerability remediation requires an explicit reviewed policy exception. CI takes longer and relies on fixed tool releases, but checks are reproducible and do not depend on GitHub Advanced Security or a commercial gitleaks Action license. Developers need actionlint and gitleaks on PATH for all local hook checks.
