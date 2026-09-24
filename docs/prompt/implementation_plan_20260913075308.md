# npm Workspaces モノレポ構築計画

## Summary

npm Workspacesで以下の4ワークスペースを構築する。

- `frontend`: React + Vite + Tailwind CSS + Vitest + Playwright
- `backend`: Hono + Zod + Vitest + esbuild
- `aws`: AWS CDK + cdk-nag + Vitest
- `packages/shared`: frontend/backend共通のZodスキーマとTypeScript型

最小の疎通サンプルとして、`GET /api/health`をReact画面から呼び出し、ローカルとAWSの両方で動作する状態を完成条件とする。

## Implementation Changes

- ルートを`private: true`のnpm Workspacesプロジェクトにし、Node.js 22以上・ESM・TypeScriptを共通方針にする。
- ルートへBiome、TypeScript、Vitestカバレッジ設定と、`build`、`test`、`test:coverage`、`lint`、`format:check`、`typecheck`、`e2e`の集約スクリプトを用意する。
- `packages/shared`でヘルスチェックのZodレスポンススキーマと推論型を公開する。frontend/backendはworkspace依存として参照する。
- `backend`にHonoアプリを作成し、Node.jsローカルサーバーとAWS Lambdaハンドラーから同じアプリを利用する。`GET /api/health`は共有スキーマに適合するJSONを返す。
- `backend`はesbuildでLambda向けESM成果物を生成する。ローカル開発ではNode.jsのTypeScript実行機能を使い、専用ランナー依存は追加しない。
- `frontend`はViteのReact TypeScript構成とTailwind CSSを設定し、ヘルスチェック結果・読み込み中・通信失敗を表示する。開発時はVite proxyでbackendへ接続する。
- Playwrightはfrontendとbackendを自動起動し、ブラウザから疎通結果が表示されるところまで検証する。
- `aws`はCDKで次を定義する。
  - private S3バケットとCloudFrontによるfrontend配信
  - API Gateway HTTP APIとLambdaによるHono API
  - CloudFrontの`/api/*`をAPI Gatewayへ転送し、同一オリジンで利用
  - frontendビルド成果物のS3デプロイ
  - スタック出力としてCloudFront URLを公開
- `AwsSolutionsChecks`をCDKアプリへ適用する。抑制が必要な場合は理由をコードと`doc/memo`へ記録し、包括的な抑制は行わない。
- ライブラリ追加の目的と標準機能で代替できない理由を、AGENTS.mdの方針に従い`doc/memo`へ記録する。
- `.gitignore`へ各ワークスペースの`dist`、CDK出力、Playwright成果物、環境ファイルなどを追加する。既存のAGENTS.md変更は保持する。

## Public Interfaces

### HTTP API

- `GET /api/health`
  - 成功時: HTTP 200
  - JSON: `{ "status": "ok" }`

### Shared package

- `@workspace/shared`
  - `healthResponseSchema`
  - `HealthResponse`

環境変数を必須にせず、frontendは既定で相対パス`/api`を使用する。

## Test Plan

- TDDで共有スキーマ、Honoルート、React表示、CDKテンプレートの順に失敗テストから実装する。
- backend単体テストで正常レスポンス、HTTPステータス、共有スキーマ適合を確認する。
- frontend単体テストで読み込み中、成功、通信失敗を確認する。
- CDKテストでLambda、HTTP API、S3、CloudFront、ルーティング、セキュリティ設定を確認する。
- cdk-nagテストで未承認の警告がないことを確認する。
- Playwrightで画面を開き、backendの応答が表示されることを確認する。
- `npm run format:check`、`npm run lint`、`npm run typecheck`、`npm run build`、`npm run test`、`npm run e2e`を成功させる。
- `npx vitest --run --coverage`で全体80%以上を必須とし、可能な範囲で100%を目指す。

## Assumptions

- AWS構成はS3/CloudFront + API Gateway HTTP API + Lambdaを採用する。
- CRUDやデータベース、認証、実環境への`cdk deploy`、CI/CD構築は今回の対象外とする。
- `package-lock.json`を唯一のロックファイルとしてコミットする。
- Tailwind CSSはVite向け公式プラグイン方式を採用する。
- AWSリソース名は固定せず、CDKの論理IDと環境ごとの生成名を利用する。
