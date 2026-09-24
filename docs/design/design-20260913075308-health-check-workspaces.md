# npm Workspacesヘルスチェックサンプル設計

## Summary

React/Vite frontendからHonoの`GET /api/health`を呼び出し、ローカルとAWSで同じAPI契約とアプリケーション実装を利用するTypeScriptモノレポを構築する。

## Context

frontend、backend、AWSインフラ、共有スキーマをnpm Workspacesで管理し、最小の疎通サンプルと一貫した品質検証を提供する。

## Goals

- `GET /api/health`がHTTP 200と`{"status":"ok"}`を返す。
- frontendが読み込み中、成功、通信失敗を表示する。
- ローカルではVite proxy、AWSではCloudFrontの`/api/*`転送で同一の相対APIパスを利用する。
- 単体、コンポーネント、CDK、cdk-nag、E2Eの各検証をnpm scriptsから実行できる。
- Statements、Branches、Functions、Linesのカバレッジをそれぞれ80%以上にする。

## Non-goals

- CRUD、データベース、認証
- 実環境へのCDK deploy
- CI/CD構築
- カスタムドメインとWAF

## Proposed Design

`packages/shared`が`healthResponseSchema`と`HealthResponse`を公開する。backendのHonoアプリは`GET /api/health`を実装し、ローカルNode.jsサーバーとLambda handlerの両方から利用する。frontendは`/api/health`をfetchし、共有スキーマで応答を検証して画面状態を更新する。

AWS CDKスタックはprivate S3、CloudFront、API Gateway HTTP API、Lambda、BucketDeploymentを定義する。CloudFrontの既定behaviorはS3を、`api/*` behaviorはAPI Gatewayをoriginとする。AwsSolutionsChecksを適用し、抑制は理由と対象を限定する。

ルートnpm scriptsが各workspaceのbuild、test、coverage、lint、format、typecheckとfrontendのPlaywright E2Eを集約する。

## Alternatives Considered

- TypeScript実行用の専用ランナーは追加せず、Node.js標準の型除去機能を利用する。
- Node.js標準機能だけではReact UI、AWSリソース定義、ブラウザE2E、CDKセキュリティ検査を提供できないため、計画記載のライブラリを利用する。

## Risks and Trade-offs

- CloudFront既定証明書を利用するためカスタムドメインは提供しない。
- 公開health endpointであるため認証を行わない。
- BucketDeploymentが生成するproviderにはCDK管理の権限とruntimeに対する限定的なcdk-nag抑制が必要になる。
- CDK asset bundlingはカバレッジ計測時に時間を要するため、Vitestのtest timeoutを15秒とする。

## Testing Strategy

- 共有Zodスキーマの単体テスト
- backendのレスポンス、HTTP status、スキーマ適合テスト
- frontendの読み込み中、成功、通信失敗のコンポーネントテスト
- CDKリソース構成と未抑制cdk-nag errorのテスト
- Playwrightによるブラウザからbackendまでの疎通テスト
- Format、Lint、Typecheck、Build、Test、Coverage、Synth、Auditの実行

## Rollout Plan

ローカルで全検証とCDK synthを完了する。実環境へのdeployは対象外とする。

## Open Questions

Not specified.
