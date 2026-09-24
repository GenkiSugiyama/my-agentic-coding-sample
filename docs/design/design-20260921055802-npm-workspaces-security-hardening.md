# npm Workspaces Security Hardening

## Summary

This design adds layered supply-chain, CI, local-development, HTTP, API, and AWS controls to the existing frontend, backend, and CDK workspaces.

## Context

The repository contains React/Vite/Tailwind/Playwright, Hono, and AWS CDK/cdk-nag workspaces. It lacked a complete CI security boundary, dependency-age policy, secret scanning, Git hook checks, and edge/API hardening.

## Goals

- Make GitHub Actions the reproducible merge security boundary.
- Detect malformed or risky workflows and leaked secrets.
- Delay all newly released dependencies for seven days.
- Limit install scripts and verify package vulnerabilities and signatures.
- Reduce the public API surface and add browser security headers, WAF, rate limiting, and tracing.
- Maintain at least 80% test coverage.

## Non-goals

- Deploying infrastructure.
- Configuring GitHub repository rulesets or organization policies from repository files.
- Purchasing GitHub Advanced Security or a gitleaks Action license.
- Introducing an API custom domain and certificate in this change.

## Proposed Design

Two workflows separate application quality gates from security checks. Actions use least privilege and immutable SHA references. CI runs workspace build, tests, coverage, synth, E2E, audit, and signature checks. Security CI runs checksum-verified actionlint and gitleaks releases, pinned zizmor, and Renovate config validation.

Node and npm versions are fixed. npm lifecycle scripts default to denied except reviewed esbuild versions. Renovate uses strict internal checks, release timestamps, a seven-day minimum age for all updates, separate major upgrades, and no automerge.

Husky invokes lint-staged and staged-secret scanning. Biome checks supported staged source files and actionlint checks staged workflow YAML.

Hono applies secure headers and request IDs, exposes only `GET /api/health`, and uses generic error responses. CloudFront applies CSP, HSTS, content-type, frame, referrer, and permissions policies. AWS WAF adds the managed common rule set and a 1,000-request IP rate limit. Lambda active tracing is enabled. The stack targets us-east-1 for CloudFront WAF.

## Alternatives Considered

Relying only on Git hooks was rejected because hooks are bypassable. Adding every security CLI as an npm dependency was rejected to limit dependency growth. A licensed gitleaks Action and GHAS-only reporting were rejected to keep the baseline portable. Disabling execute-api immediately was rejected because it would break the current origin without a custom domain.

## Risks and Trade-offs

The mandatory release delay can postpone security fixes; urgent exceptions need explicit review. WAF and X-Ray add cost. Fixed CLI downloads require maintaining versions and checksums. The execute-api endpoint remains an alternate public route until the custom-domain follow-up.

## Testing Strategy

Run format, lint, typecheck, build, unit tests, coverage, CDK assertions and synth, and Playwright. Require at least 80% coverage. Validate npm audit/signatures, install-script allowlisting, Renovate config, actionlint, zizmor auditor findings, gitleaks history scanning, and `git diff --check`.

## Rollout

Merge the workflows and repository configuration together. Make CI and Security required checks on `main`. Enable GitHub secret scanning, push protection, Dependabot alerts, Actions allowlists, and repository rulesets where the hosting plan permits.

## Open Questions

- When will an API custom domain and certificate be available so the execute-api endpoint can be disabled?
- Are GitHub Advanced Security features available for optional SARIF reporting?
- Which repository or organization administrator will apply the server-side rulesets and Actions allowlist?
