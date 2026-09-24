# CloudFrontを入口とするfrontend/API配信

## Status

Proposed

## Context

React frontendとHono APIをAWS上で同一オリジンとして公開し、frontendから環境変数なしで相対パス`/api`を利用できる構成が必要である。

## Decision

private S3バケットのfrontendをCloudFrontで配信し、`/api/*`をAPI Gateway HTTP APIとLambda上のHonoアプリへ転送する。frontend成果物はBucketDeploymentでS3へ配置する。AwsSolutionsChecksを適用し、必要な抑制は限定したリソースと理由を明記する。

## Consequences

- frontendとAPIを単一のCloudFrontドメインから提供できる。
- S3への直接公開を避けられる。
- カスタムドメイン、WAF、認証は対象外のため、公開サンプルとして限定的なcdk-nag抑制が必要になる。
- 実環境へのdeployはこの決定の対象外である。
