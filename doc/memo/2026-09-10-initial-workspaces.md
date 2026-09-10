# npm Workspaces初期構築に伴う依存ライブラリ

## 判断

- React/Vite/Tailwind CSSはブラウザUIとビルド要件を満たすために追加する。
- HonoはHTTP API、Zodはワークスペース間の実行時スキーマ共有に使用する。
- AWS CDKとcdk-nagはInfrastructure as Codeとセキュリティ検査に使用する。
- Vitest、Testing Library、Playwrightは単体・コンポーネント・E2Eテストに使用する。
- Biomeは共通Formatter/Linter、esbuildはLambda成果物の生成に使用する。

## 標準機能による代替の検討

Node.js標準機能だけではReact UI、AWSリソース定義、ブラウザE2E、CDKセキュリティ検査を提供できない。TypeScriptのローカル実行にはNode.js標準の型除去機能を利用し、専用ランナーは導入しない。

## セキュリティ対応

初回インストールでVitest 4.1.10以下の開発サーバーに任意ファイル読み取りの脆弱性が検出されたため、修正版のVitest 5系と同じメジャーのcoverage providerを採用する。 Biome設定のスキーマはlockfileで解決されたCLI 2.5.13に合わせ、設定解釈の差異を防止する。

## cdk-nag抑制

CloudFront既定ドメインではカスタム証明書を指定できないためCFR4を抑制する。

CloudFront既定証明書では`minimumProtocolVersion`の指定が無効になるため、誤解を招く設定を削除した。HTTPSへのリダイレクトは維持する。公開サンプルのためCFR1/CFR2/APIG4を抑制する。BucketDeploymentが内部生成するプロバイダーに限りL1/IAM4/IAM5を抑制し、アプリケーションLambdaには適用しない。

アプリケーションLambdaには専用IAMロールを割り当て、CloudWatch Logsへの書き込みだけを許可する。X-Rayは今回の最小構成では利用せず、不要なワイルドカード権限を避けるため無効化する。

## カバレッジ対象外

`backend/src/lambda.ts`、`backend/src/server.ts`、`frontend/src/main.tsx`は、テスト済みのアプリケーションを各ランタイムへ接続するだけのエントリーポイントであるため、カバレッジ集計から除外する。Lambdaの成果物生成とブラウザ起動はbuildおよびE2Eで検証する。
