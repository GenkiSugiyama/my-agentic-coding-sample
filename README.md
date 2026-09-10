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

## AWS template

frontendを先にビルドしたうえで、CDKテンプレートを生成します。

```sh
npm run build
npm run synth --workspace /aws
```

実環境へのデプロイはこのサンプルの対象外です。