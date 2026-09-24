# Edge Security and API Exposure

## Status

Accepted

## Context

The application serves a React frontend through CloudFront and a public Hono health endpoint through API Gateway and Lambda. The original wildcard API route and missing edge controls exposed more behavior than necessary. CloudFront-scoped WAF requires us-east-1. Disabling the API Gateway execute-api endpoint would break the current CloudFront origin because no custom API domain and certificate exist.

## Decision

Target the CDK stack at us-east-1. Attach AWS managed common WAF rules and an IP rate limit to CloudFront, apply security response headers, and enable active Lambda X-Ray tracing. Limit the API contract to `GET /api/health`, add secure headers and request IDs, and return generic 404 and 500 responses.

Keep the execute-api endpoint enabled until a custom API domain and certificate are introduced for the CloudFront origin. Track closing the default endpoint as follow-up work. Keep cdk-nag suppressions narrowly scoped and document their evidence in `doc/memo`.

## Consequences

WAF and X-Ray incur additional AWS cost. The health endpoint remains directly reachable through execute-api, although its route and method surface are minimal. A future custom-domain migration is required to make CloudFront the only public entry point. Region-specific asset ARNs must be covered by the reviewed BucketDeployment suppression.
