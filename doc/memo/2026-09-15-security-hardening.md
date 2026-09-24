# Security hardening changes (2026-09-15)

## Library changes

- Added Husky 9.1.7 and lint-staged 17.5.1 as root development dependencies.
- Standard-library-only alternatives cannot install portable Git hooks across supported developer environments or reliably limit formatting to staged files.
- actionlint, zizmor, and gitleaks were not added as npm dependencies. CI uses pinned releases or a full commit SHA.

## Removed or narrowed behavior

- Replaced the API Gateway wildcard route `ANY /api/{proxy+}` with `GET /api/health`. This removes unintended method and path exposure; future routes must be declared explicitly.
- Removed the `AwsSolutions-CFR2` suppression after associating an AWS WAF web ACL with CloudFront.
- The API Gateway execute-api endpoint remains enabled. Disabling it without a custom API domain would also prevent the current CloudFront HTTP origin from reaching the API. A custom domain and certificate are required before closing this path.

## cdk-nag suppression

- Added an `AwsSolutions-IAM5` suppression scoped to `Resource::*` under the backend Lambda role.
- Evidence: Lambda active X-Ray tracing requires write-only X-Ray API calls that do not support resource-level ARNs.
- Review when AWS adds resource-level authorization for these X-Ray write operations.

## Operational impact

- AWS WAF and X-Ray add recurring or usage-based AWS charges.
- CloudFront-scoped WAF deployment requires the stack to target us-east-1.
- The CDK app and tests now set us-east-1 explicitly; the asset-bucket suppression is restricted to the corresponding bootstrapped asset ARN.
- npm install scripts are restricted with `allowScripts`; esbuild 0.25.12 and 0.28.2 are the only approved versions.
