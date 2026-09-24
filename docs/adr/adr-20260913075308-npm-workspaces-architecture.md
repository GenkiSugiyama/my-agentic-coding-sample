# npm WorkspacesによるTypeScriptモノレポ

## Status

Proposed

## Context

React frontend、Hono backend、AWS CDK、および両アプリケーションで共有するZodスキーマを、一貫したビルド・検証手順で管理する必要がある。

## Decision

npm Workspacesを利用し、`frontend`、`backend`、`aws`、`packages/shared`の4ワークスペースをNode.js 22以上・ESM・TypeScriptで構成する。`@workspace/shared`はhealth APIのZodスキーマと推論型を公開し、frontendとbackendが参照する。ルートのnpm scriptsからbuild、test、coverage、lint、format、typecheck、E2Eを集約実行する。

## Consequences

- 単一のlockfileと共通コマンドで依存関係と品質検証を管理できる。
- API境界のスキーマと型をfrontend/backendで共有できる。
- 各ワークスペースはルート構成とworkspace間のビルド順序に依存する。
