import path from "node:path";
import {
  CfnOutput,
  Duration,
  RemovalPolicy,
  Stack,
  type StackProps,
} from "aws-cdk-lib";
import * as apigatewayv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as logs from "aws-cdk-lib/aws-logs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as wafv2 from "aws-cdk-lib/aws-wafv2";
import { NagSuppressions } from "cdk-nag";
import type { Construct } from "constructs";

const repositoryRoot =
  path.basename(process.cwd()) === "aws"
    ? path.resolve(process.cwd(), "..")
    : process.cwd();

export class ApplicationStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const accessLogs = new s3.Bucket(this, "AccessLogs", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      lifecycleRules: [{ expiration: Duration.days(90) }],
      objectOwnership: s3.ObjectOwnership.OBJECT_WRITER,
      removalPolicy: RemovalPolicy.RETAIN,
    });
    const frontendBucket = new s3.Bucket(this, "Frontend", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.RETAIN,
      serverAccessLogsBucket: accessLogs,
      versioned: true,
    });

    const apiLogGroup = new logs.LogGroup(this, "ApiAccessLogs", {
      retention: logs.RetentionDays.THREE_MONTHS,
      removalPolicy: RemovalPolicy.DESTROY,
    });
    const functionLogGroup = new logs.LogGroup(this, "BackendLogs", {
      retention: logs.RetentionDays.THREE_MONTHS,
      removalPolicy: RemovalPolicy.DESTROY,
    });
    const backendRole = new iam.Role(this, "BackendRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });
    functionLogGroup.grantWrite(backendRole);
    NagSuppressions.addResourceSuppressions(
      backendRole,
      [
        {
          id: "AwsSolutions-IAM5",
          reason:
            "Lambda active tracing requires X-Ray write APIs, which do not support resource-level permissions.",
          appliesTo: ["Resource::*"],
        },
      ],
      true,
    );
    const backendFunction = new lambdaNodejs.NodejsFunction(this, "Backend", {
      entry: path.resolve(repositoryRoot, "backend/src/lambda.ts"),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_24_X,
      architecture: lambda.Architecture.ARM_64,
      bundling: { format: lambdaNodejs.OutputFormat.ESM, target: "node24" },
      logGroup: functionLogGroup,
      memorySize: 256,
      role: backendRole,
      timeout: Duration.seconds(10),
      tracing: lambda.Tracing.ACTIVE,
    });

    const api = new apigatewayv2.HttpApi(this, "Api");
    api.addRoutes({
      path: "/api/health",
      methods: [apigatewayv2.HttpMethod.GET],
      integration: new integrations.HttpLambdaIntegration(
        "BackendIntegration",
        backendFunction,
      ),
    });
    const defaultStage = api.defaultStage?.node
      .defaultChild as apigatewayv2.CfnStage;
    defaultStage.accessLogSettings = {
      destinationArn: apiLogGroup.logGroupArn,
      format: JSON.stringify({
        requestId: "$context.requestId",
        routeKey: "$context.routeKey",
        status: "$context.status",
      }),
    };
    apiLogGroup.grantWrite(
      new iam.ServicePrincipal("apigateway.amazonaws.com"),
    );

    const responseHeadersPolicy = new cloudfront.ResponseHeadersPolicy(
      this,
      "SecurityHeaders",
      {
        securityHeadersBehavior: {
          contentSecurityPolicy: {
            contentSecurityPolicy:
              "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'",
            override: true,
          },
          contentTypeOptions: { override: true },
          frameOptions: {
            frameOption: cloudfront.HeadersFrameOption.DENY,
            override: true,
          },
          referrerPolicy: {
            referrerPolicy:
              cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
            override: true,
          },
          strictTransportSecurity: {
            accessControlMaxAge: Duration.days(730),
            includeSubdomains: true,
            override: true,
            preload: true,
          },
        },
        customHeadersBehavior: {
          customHeaders: [
            {
              header: "Permissions-Policy",
              value: "camera=(), geolocation=(), microphone=()",
              override: true,
            },
          ],
        },
      },
    );
    const webAcl = new wafv2.CfnWebACL(this, "WebAcl", {
      defaultAction: { allow: {} },
      scope: "CLOUDFRONT",
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: "application-web-acl",
        sampledRequestsEnabled: true,
      },
      rules: [
        {
          name: "AWSManagedRulesCommonRuleSet",
          priority: 0,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              name: "AWSManagedRulesCommonRuleSet",
              vendorName: "AWS",
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: "managed-common-rules",
            sampledRequestsEnabled: true,
          },
        },
        {
          name: "RateLimitPerIp",
          priority: 1,
          action: { block: {} },
          statement: {
            rateBasedStatement: { aggregateKeyType: "IP", limit: 1_000 },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: "rate-limit-per-ip",
            sampledRequestsEnabled: true,
          },
        },
      ],
    });

    const distribution = new cloudfront.Distribution(this, "Distribution", {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(frontendBucket),
        responseHeadersPolicy,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      additionalBehaviors: {
        "api/*": {
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          origin: new origins.HttpOrigin(
            api.apiEndpoint.replace("https://", ""),
            {
              protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
            },
          ),
          originRequestPolicy:
            cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
          responseHeadersPolicy,
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
      },
      defaultRootObject: "index.html",
      enableLogging: true,
      logBucket: accessLogs,
      webAclId: webAcl.attrArn,
    });

    const deployment = new s3deploy.BucketDeployment(this, "DeployFrontend", {
      destinationBucket: frontendBucket,
      distribution,
      distributionPaths: ["/*"],
      sources: [
        s3deploy.Source.asset(path.resolve(repositoryRoot, "frontend/dist")),
      ],
    });

    NagSuppressions.addResourceSuppressions(accessLogs, [
      {
        id: "AwsSolutions-S1",
        reason: "This bucket is itself the destination for access logs.",
      },
    ]);
    NagSuppressions.addResourceSuppressions(
      api,
      [
        {
          id: "AwsSolutions-APIG4",
          reason: "The health endpoint is intentionally public.",
        },
      ],
      true,
    );
    NagSuppressions.addResourceSuppressions(distribution, [
      {
        id: "AwsSolutions-CFR1",
        reason: "Geo restrictions are not required for this public sample.",
      },
      {
        id: "AwsSolutions-CFR4",
        reason:
          "The default CloudFront certificate is used and all viewer requests are redirected to HTTPS; a custom domain is outside scope.",
      },
    ]);
    NagSuppressions.addResourceSuppressions(
      deployment,
      [
        {
          id: "AwsSolutions-L1",
          reason:
            "The provider Lambda runtime is managed by the AWS CDK BucketDeployment construct.",
        },
        {
          id: "AwsSolutions-IAM4",
          reason:
            "The provider role and managed policy are generated by the AWS CDK BucketDeployment construct.",
        },
        {
          id: "AwsSolutions-IAM5",
          reason:
            "BucketDeployment requires object-level and CloudFront invalidation wildcards in its generated provider role.",
        },
      ],
      true,
    );

    const providerPath = `/${this.node.path}/Custom::CDKBucketDeployment8693BB64968944B69AAFB0CC9EB8756C`;
    NagSuppressions.addResourceSuppressionsByPath(
      this,
      `${providerPath}/Resource`,
      [
        {
          id: "AwsSolutions-L1",
          reason:
            "The provider runtime is controlled by the CDK BucketDeployment construct.",
        },
      ],
    );
    NagSuppressions.addResourceSuppressionsByPath(
      this,
      `${providerPath}/ServiceRole/Resource`,
      [
        {
          id: "AwsSolutions-IAM4",
          reason:
            "The provider role is controlled by the CDK BucketDeployment construct.",
          appliesTo: [
            "Policy::arn:<AWS::Partition>:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
          ],
        },
      ],
    );
    NagSuppressions.addResourceSuppressionsByPath(
      this,
      `${providerPath}/ServiceRole/DefaultPolicy/Resource`,
      [
        {
          id: "AwsSolutions-IAM5",
          reason:
            "The deployment provider needs wildcard object operations on its asset and destination buckets and CloudFront invalidations.",
          appliesTo: [
            "Action::s3:GetObject*",
            "Action::s3:GetBucket*",
            "Action::s3:List*",
            "Resource::arn:<AWS::Partition>:s3:::cdk-hnb659fds-assets-<AWS::AccountId>-<AWS::Region>/*",
            "Resource::arn:<AWS::Partition>:s3:::cdk-hnb659fds-assets-<AWS::AccountId>-us-east-1/*",
            "Action::s3:DeleteObject*",
            "Action::s3:Abort*",
            "Resource::<Frontend23D93C55.Arn>/*",
            "Resource::*",
          ],
        },
      ],
    );
    new CfnOutput(this, "ApplicationUrl", {
      value: `https://${distribution.distributionDomainName}`,
    });
  }
}
