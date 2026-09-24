# AI Agentic Coding Sample

React frontend、Hono API、AWS CDKをnpm Workspacesで管理するTypeScriptモノレポです。

## Requirements

- Node.js 22以上
- npm 10以上
- E2E実行時はPlaywright Chromium（`npx playwright install --with-deps chromium`）

## Setup

```sh
npm ci
```

ローカル開発では、別々のターミナルでbackendとfrontendを起動します。

```sh
npm run dev:backend
npm run dev:frontend
```

frontendは `http://localhost:5173`、backendは `http://localhost:8787` で起動し、Viteが `/api` をbackendへ転送します。

## Quality checks

```sh
npm run format:check
npm run lint
npm run typecheck
npm run build
npm run test
npm run test:coverage
npm run e2e
```

## Security controls

Use Node.js 24.21.0 and npm 11.19.0. Install and verify dependencies with:

```sh
npm ci
npm run security:audit
npm run security:signatures
```

npm install scripts are denied unless listed in `allowScripts`. Only the reviewed esbuild versions required by this build are currently allowed. Review any new warning before running `npm install-scripts approve` or `deny`.

The Husky pre-commit hook runs lint-staged and gitleaks. Install gitleaks 8.28.0 or later and actionlint 1.7.7 or later on the local PATH. Hooks are a convenience; the GitHub Actions CI and Security workflows are the required merge gates.

Renovate waits seven days for every dependency release, including vulnerability fixes, and requires a release timestamp. An urgent exception requires an explicit, reviewed configuration change.

CloudFront uses a security response-headers policy plus AWS WAF managed common rules and an IP rate limit. CloudFront WAF resources must be deployed in us-east-1. WAF and X-Ray incur additional AWS charges.

The API Gateway execute-api endpoint remains reachable until a custom API domain and certificate are introduced for the CloudFront origin. Only `GET /api/health` is declared; close the default endpoint as part of that follow-up.

If gitleaks finds a secret, revoke and rotate the credential; deleting it from the latest commit is insufficient. Any false-positive allowlist entry must be narrowly scoped and documented in `doc/memo` with a reason and review date.

On GitHub, require the CI and Security checks for `main`, require full-length action SHA pins, and enable secret scanning, push protection, and Dependabot alerts.

## AWS template

frontendを先にビルドしたうえで、CDKテンプレートを生成します。

```sh
npm run build
npm run synth --workspace @workspace/aws
```

実環境へのデプロイはこのサンプルの対象外です。
