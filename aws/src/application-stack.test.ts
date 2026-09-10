import { App, Aspects } from "aws-cdk-lib";
import { Annotations, Match, Template } from "aws-cdk-lib/assertions";
import { AwsSolutionsChecks } from "cdk-nag";
import { describe, expect, it } from "vitest";
import { ApplicationStack } from "./application-stack.ts";

function createStack() {
  const app = new App();
  const stack = new ApplicationStack(app, "TestStack");
  return { app, stack };
}

describe("ApplicationStack", () => {
  it("creates a private frontend with a Lambda-backed HTTP API", () => {
    const { stack } = createStack();
    const template = Template.fromStack(stack);
    template.resourceCountIs("AWS::S3::Bucket", 2);
    template.resourceCountIs("AWS::CloudFront::Distribution", 1);
    template.resourceCountIs("AWS::ApiGatewayV2::Api", 1);
    template.resourceCountIs("AWS::Lambda::Function", 2);
    template.hasResourceProperties("AWS::Lambda::Function", {
      Handler: "index.handler",
      Runtime: "nodejs24.x",
    });
    template.hasResourceProperties("AWS::ApiGatewayV2::Route", {
      RouteKey: "ANY /api/{proxy+}",
    });
    template.hasResourceProperties("AWS::CloudFront::Distribution", {
      DistributionConfig: Match.objectLike({ Enabled: true }),
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
