## Policy

- セキュリティを最優先とし、低下の恐れがあれば作業を止め合意を得る
- KISS原則に従う
- 各タスクの分割単位は最長30分
- 以下の変更時は必ず`doc/memo`に記録
  - コメントアウト
  - 処理削除
  - ライブラリ変更
- 依存パッケージは極力増やさず、追加時は標準機能で代替可能かを検討
- 実装前に既存コードを調査し、同じ責務の処理を重複実装しない
- コード変更は依頼に直接関係する箇所に限定する
  - 関係のないリファクタリングは実装せず、必要性の指摘に留める
- Git Commitは、ユーザーから明示的に依頼された場合のみ行う

## Library

- 標準ライブラリまたは導入済みライブラリで実装できる場合、新しいライブラリを導入しない
- 新しいライブラリが必要な場合は、標準機能および導入済みライブラリで代替できないことを確認する
- 新規導入できるライブラリのライセンスは、MIT、Apache License 2.0、BSDのいずれかに限定する
- 導入前にライセンスを確認し、判定できない場合や上記以外のライセンスの場合は作業を止めてユーザーの合意を得る

## Debug

- デバッグでは一度に1つの観点だけを検証する
- 別の観点を試す前に、その観点のために加えた一時的な変更を正確に元へ戻す
- 元へ戻す際は、ユーザーの変更や検証開始前から存在した変更を上書きしない

## Doc

- `implementation_plan.md`を用いて実装した場合、以下を行う。
  - ファイルの内容と実装を比較し、差分があれば`implementation_plan.md`を最新化する。
  - `save-implementation-plan`スキルでの事後作業を推奨する。

## Tips

- 実行コマンドはCI/CD用を使用
- CLIはPagerを使わない

## Test

- Kent Beck準拠のTDDを順守
  - 処理変更の度に`npm run test`を実行し、常に成功させる
  - Formatter/Linterも常に通す

## E2Eテスト

- FrontendまたはBackendのコードを作成・変更・削除した場合、主要なユーザーフローをPlaywrightでE2E検証する
- E2Eテストは、すべてのunit testが成功した後の最終チェックとして実施する
- OpenAPIのスキーマまたはAPIクライアントに影響する変更では、E2Eテスト前に次の順序で更新する
  1. Backendの`/doc`からOpenAPI JSONを取得できる状態にする
  2. `openapi-typescript`で`packages/shared/src/generated/types.ts`を更新する
  3. 生成した型を利用する`openapi-fetch`クライアントを更新する
- OpenAPI生成基盤が未導入の状態では、依存パッケージを無断で追加しない。対象タスクに導入が必要な場合は、不足している基盤と必要な変更をユーザーへ報告して合意を得る
- E2Eはサーバーとフロントエンドを起動する既存のCI用コマンド`npm run e2e`で実行する
- テストデータは毎回リセット可能にし、他のテストと状態を共有しない
- Playwrightの失敗時にスクリーンショットと動画を自動保存する
- CIではPlaywrightを`--reporter=list,html`で実行する

## フロントエンド/バックエンド連携

- サーバーとクライアント間では、OpenAPIスキーマを共有し、型安全性を確保する
- バリデーション付きスキーマは、`@hono/zod-openapi`からimportしたZodで定義する
- `@hono/zod-openapi`を用いたルータは次の構成にする
  1. `createRoute()`でルーティング情報を定義する
  2. `RouteHandler`の型を用いてハンドラを定義する
  3. `OpenAPIHono`でルーティング情報とハンドラを紐づける
- Backendのエントリポイントは次の構成にする
  - 作成したルータをエントリポイントへマウントする
  - `/doc`でOpenAPI JSONを提供する
  - `@hono/swagger-ui`ミドルウェアを用いて`/ui`でSwagger UIを提供する
- Backendを起動したうえで、次のコマンドによりクライアント型を生成する
  - `npx openapi-typescript http://localhost:8787/doc -o packages/shared/src/generated/types.ts`
- 生成した型を利用する`openapi-fetch`のAPIクライアントは`packages/shared/src/`に配置する

## Taskの完了条件

- 常にデグレードがないことを確認する
- Format/Lint/Testが一貫して成功している
- テストカバレッジは80%以上を必達、100%を目指す
  - カバレッジ取得コマンド: `npx vitest --run --coverage`

## Context exclusions

- `node_modules/`, `dist/`, `coverage/` は調査対象に含めない
- `.env` および秘密情報を含むファイルは読み取らない
- 自動生成ファイルは、明示的に依頼された場合を除いて変更しない