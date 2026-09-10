# 作業再開メモ

最終更新: 2026-09-10 (UTC)

## 目的

`implementation_plan.md` に従い、React/Vite frontend、Hono backend、AWS CDK、共通Zodスキーマからなるnpm Workspacesモノレポを構築する。

## 現在の状態

- 実装本体は完了しているが、最終セルフチェックと計画書の保存処理は未完了。
- 変更はコミットしていない。既存の `AGENTS.md` のユーザー変更は保持している。
- `implementation_plan.md` はルートに保持しており、まだ削除・アーカイブしていない。
- `frontend/`: React 19、Vite、Tailwind CSS、Vitest、Playwright。health APIの読み込み中・成功・失敗表示を実装済み。
- `backend/`: Honoの `GET /api/health`、Node.jsローカルサーバー、Lambdaハンドラー、esbuildを実装済み。
- `packages/shared/`: `healthResponseSchema` と `HealthResponse` を実装済み。
- `aws/`: private S3、CloudFront、HTTP API、Lambda、BucketDeployment、cdk-nagを実装済み。
- 依存追加理由、セキュリティ対応、cdk-nag抑制、カバレッジ除外は `doc/memo/2026-09-10-initial-workspaces.md` に記録済み。
- Playwright Chromiumと必要なOS共有ライブラリは現在の開発コンテナへ導入済み。

## 成功済みの検証

- `npm run format:check`: 成功
- `npm run lint`: 成功
- `npm run typecheck`: 成功
- `npm run build`: 成功
- `npm run test`: 4ファイル・7テスト成功
- `npm run e2e`: Chromiumで1テスト成功
- `npm run synth --workspace @workspace/aws`: 成功
- `npm audit`: 脆弱性0件
- 一度成功したカバレッジ:
  - Statements: 95.74%
  - Branches: 83.33%
  - Functions: 83.33%
  - Lines: 95.55%

## 作業停止時の問題

最終セルフチェックの `npx vitest --run --coverage` で、AWS CDKの最初のテストだけが既定の5秒を超えてタイムアウトした。通常テストでは成功しており、CDKによるLambda assetのバンドルがカバレッジ計測時に遅くなったことが原因と考えられる。

`selfcheck` スキルの規則に従い、失敗後の修正はユーザー承認を得るまで行っていない。

また、READMEのCDK synth例が機械置換時の文字列展開により `npm run synth --workspace /aws` になっている。正しくは `npm run synth --workspace @workspace/aws`。これも次回修正する。

## 次回の作業

1. ユーザーの承認を得て、`vitest.config.ts` の `testTimeout` を15秒程度へ変更する。
2. READMEのworkspace指定を `@workspace/aws` に修正し、末尾改行を整える。
3. 次を再実行する。
   - `npm run format:check`
   - `npm run lint`
   - `npm run typecheck`
   - `npm run build`
   - `npm run test`
   - `npx vitest --run --coverage`
   - `npm run e2e`
   - `npm run synth --workspace @workspace/aws`
   - `npm audit`
4. `git diff` と `git status` を確認し、要件・`implementation_plan.md`・実装の差分を最終照合する。
5. 全検証成功後、`save-implementation-plan` スキルに従って以下を行う。
   - 計画を `docs/prompt/implementation_plan_yyyyMMddHHmmss.md` に完全保存する。
   - ADRとDesign Docを作成する。
   - 保存内容を検証してからルートの `implementation_plan.md` を削除する。
6. 完了後、この再開メモを削除する場合は `doc/memo` に処理削除として記録する。

## 再開時の注意

- `AGENTS.md` はユーザーが編集した既存変更なので上書きしない。
- cdk-nag抑制はCDK `BucketDeployment` の生成リソースなど、コードに記載した限定範囲だけに適用する。
- `save-implementation-plan` は最終検証がすべて成功するまで実行しない。
