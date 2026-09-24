import { App, Aspects } from "aws-cdk-lib";
import { Annotations, Match, Template } from "aws-cdk-lib/assertions";
import { AwsSolutionsChecks } from "cdk-nag";
import { describe, expect, it } from "vitest";
import { ApplicationStack } from "./application-stack.ts";

function createStack() {
  const app = new App();
  const stack = new ApplicationStack(app, "TestStack", {
    env: { region: "us-east-1" },
  });
  return { app, stack };
}

describe("ApplicationStack", () => {
  it("creates a private frontend with a hardened Lambda-backed HTTP API", () => {
    const { stack } = createStack();
    const template = Template.fromStack(stack);
    template.resourceCountIs("AWS::S3::Bucket", 2);
    template.resourceCountIs("AWS::CloudFront::Distribution", 1);
    template.resourceCountIs("AWS::ApiGatewayV2::Api", 1);
    template.resourceCountIs("AWS::Lambda::Function", 2);
    template.hasResourceProperties("AWS::Lambda::Function", {
      Handler: "index.handler",
      Runtime: "nodejs24.x",
      TracingConfig: { Mode: "Active" },
    });
    template.hasResourceProperties("AWS::ApiGatewayV2::Route", {
      RouteKey: "GET /api/health",
    });
    template.hasResourceProperties("AWS::CloudFront::Distribution", {
      DistributionConfig: Match.objectLike({
        Enabled: true,
        WebACLId: Match.anyValue(),
      }),
    });
    template.hasResourceProperties("AWS::CloudFront::ResponseHeadersPolicy", {
      ResponseHeadersPolicyConfig: Match.objectLike({
        SecurityHeadersConfig: Match.objectLike({
          ContentSecurityPolicy: Match.objectLike({
            ContentSecurityPolicy: Match.stringLikeRegexp("default-src 'self'"),
          }),
          StrictTransportSecurity: Match.objectLike({
            AccessControlMaxAgeSec: 63_072_000,
          }),
        }),
      }),
    });
    template.hasResourceProperties("AWS::WAFv2::WebACL", {
      DefaultAction: { Allow: {} },
      Scope: "CLOUDFRONT",
    });
  });

  it("has no unsuppressed cdk-nag errors", () => {
    const { app, stack } = createStack();
    Aspects.of(stack).add(new AwsSolutionsChecks({ verbose: true }));
    app.synth();
    expect(
      Annotations.fromStack(stack).findError("*", Match.stringLikeRegexp(".*")),
    ).toEqual([]);
  });
});
