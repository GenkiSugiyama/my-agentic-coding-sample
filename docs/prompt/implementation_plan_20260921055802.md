# npm Workspaces Security Hardening Implementation Plan

## Objective

React/Vite/Playwright frontend、Hono backend、AWS CDK infrastructure を含む npm workspaces に、ローカルと GitHub Actions の両方で一貫して機能するセキュリティゲートを追加する。

## Constraints and Decisions

- セキュリティ検査は Git hook だけに依存せず、GitHub Actions を最終的な強制境界とする。
- GitHub Actions は最小権限、完全な commit SHA pin、checkout credential 非永続化を原則とする。
- Renovate は全 dependency update に `minimumReleaseAge: 7 days` と `minimumReleaseAgeBehaviour: timestamp-required` を適用する。
- 脆弱性修正を含む全 dependency update に release age を適用する。緊急時の例外は設定変更を明示的にレビューする。
- 開発依存の追加は Husky と lint-staged に限定する。actionlint、zizmor、gitleaks は CI でバージョン固定された配布物または Action として実行する。
- GitHub Actions が利用する外部 Action は Renovate に digest 更新させる。
- CloudFront に managed response headers policy と AWS WAF managed rules/rate limit を追加する。追加費用はセキュリティ強化要件の一部として受容する。
- API Gateway の default endpoint は、CloudFront origin 用の custom domain と証明書を導入するまで有効のままとし、公開 route を `GET /api/health` のみに制限する。
- cdk-nag suppression は必要最小限にし、抑制追加・変更は `doc/memo` に記録する。

## Ordered Tasks

### 1. GitHub Actions quality gate

- [x] CI workflow を追加する。
- [x] format、lint、typecheck、coverage、CDK synth、Playwright E2E を実行する。
- [x] permissions、timeouts、concurrency、SHA pin、checkout credential を安全に設定する。

Acceptance: workflow が actionlint/zizmor の設計要件を満たし、ローカルで対応する npm scripts が成功する。

### 2. Secret scanning

- [x] gitleaks workflow を追加し、PR/push/manual/schedule で全履歴を検査する。
- [x] staged files 用のローカル gitleaks script を追加する。
- [x] 誤検知のない最小 `.gitleaks.toml` を用意する。

Acceptance: CI と pre-commit の両方に secret scan があり、秘密値を設定ファイルへ追加しない。

### 3. GitHub Actions static security analysis

- [x] actionlint と zizmor の workflow を追加する。
- [x] actionlint/zizmor 用のローカルまたは npm wrapper scripts を追加する。
- [x] workflow 自身を両検査で検証する。

Acceptance: actionlint と zizmor に blocking finding がない。

### 4. Renovate supply-chain policy

- [x] `renovate.json` を追加する。
- [x] minimumReleaseAge、timestamp-required、strict internal checks を設定する。
- [x] major update の分離、automerge 無効、Action digest 更新を設定する。
- [x] CI で Renovate config を検証する。

Acceptance: Renovate schema/config validation が成功し、通常更新に7日待機が適用される。

### 5. Runtime and npm policy

- [x] Node と npm の具体的バージョンを固定する。
- [x] `.npmrc` に engine、lockfile、exact-save のポリシーを追加する。
- [x] npm audit と registry signature 検証 scripts/CI を追加する。
- [x] install script allowlist の互換性を検証し、安全に適用できる範囲を設定する。

Acceptance: `npm ci`、build、audit が成功し、必要な native/build packages のみ install script を実行できる。

### 6. Husky and lint-staged

- [x] Husky と lint-staged を追加する。
- [x] staged files の format/lint と gitleaks を pre-commit に設定する。
- [x] CI では Husky installation を無効化する。

Acceptance: hook が staged files のみを高速に検査し、hook を迂回しても CI が同等以上を検査する。

### 7. Frontend and CloudFront HTTP hardening

- [x] CSP、HSTS、nosniff、frame/referrer/permissions policies を追加する。
- [x] Playwright または CDK assertion で headers をテストする。

Acceptance: synthesized distribution に security headers policy があり、期待するヘッダーがテストされる。

### 8. Hono/API boundary hardening

- [x] secure headers、request ID、統一404/error response を追加する。
- [x] 公開 route/method を `GET /api/health` に限定する。
- [x] security behavior の単体テストを先に追加する。

Acceptance: 許可 route は正常応答し、不正 method/path は情報を漏らさず拒否される。

### 9. AWS boundary hardening

- [x] WAF managed rule groups と rate-based rule を CloudFront に関連付ける。
- [ ] API Gateway default endpoint を無効化し、CloudFront origin custom header を検証する（custom domain と証明書の導入まで保留）。
- [x] Lambda tracing を有効化する。
- [x] cdk-nag suppressions を縮小し、CDK assertions を追加する。
- [x] suppression/behavior changes を `doc/memo` に記録する。

Acceptance: CDK tests と synth が成功し、unsuppressed cdk-nag error がない。default endpoint の閉鎖は custom domain 導入時の follow-up とする。

### 10. Documentation and final verification

- [x] README に setup、hooks、CI、Renovate、secret response、AWS cost implications を記載する。
- [x] format、lint、typecheck、test、coverage、synth、E2E を実行する。
- [x] actionlint、zizmor、gitleaks、Renovate config validation を実行する。
- [x] implementation plan と実装差分を同期する。
- [x] `save-implementation-plan` skill で prompt、ADR、Design Doc を保存する。

Acceptance: 全検査が成功し、coverage 80%以上、既存機能のデグレードがない。

## Open Questions

- GitHub Advanced Security の利用可否は不明。初期実装は GHAS 非依存の blocking checks とし、SARIF upload は必須にしない。
- gitleaks-action の組織ライセンス有無は不明。ライセンス依存を避けるため、CI では公式 CLI の固定 release を利用する。
- GitHub repository rulesets、Actions allowlist、secret scanning のサーバー側設定は repository files から変更できないため、実装完了後の運用手順として明記する。
