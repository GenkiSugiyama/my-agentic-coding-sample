#!/usr/bin/env node
import { App, Aspects } from "aws-cdk-lib";
import { AwsSolutionsChecks } from "cdk-nag";
import { ApplicationStack } from "../src/application-stack.ts";

const app = new App();
const stack = new ApplicationStack(app, "ApplicationStack");
Aspects.of(stack).add(new AwsSolutionsChecks({ verbose: true }));
