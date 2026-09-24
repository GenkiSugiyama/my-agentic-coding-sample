#!/usr/bin/env node
import { App, Aspects } from "aws-cdk-lib";
import { AwsSolutionsChecks } from "cdk-nag";
import { ApplicationStack } from "../src/application-stack.ts";

const app = new App();
const stack = new ApplicationStack(app, "ApplicationStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: "us-east-1",
  },
});
Aspects.of(stack).add(new AwsSolutionsChecks({ verbose: true }));
