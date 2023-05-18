# Deploying a Static Website with AWS Amplify and CDK

![AWS](https://img.shields.io/badge/AWS-%23FF9900.svg?style=for-the-badge&logo=amazon-aws&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)

Sample React application that will be hosted on AWS Amplify (created with _npx create-react-app_). we will be using AWS Cloud Development Kit (AWS CDK) to develop the infrastructure and the configurations required to host the application on Amplify.

![Amplify diagram](./public/amplify.png)

Deploying infrastructure with AWS CDK will enable DevOps teams to:

* standardize infrastructure components
* deploy in a repeatable manner
* develop with familiar programming language

Managed Service Providers that offer website hosting services will also benefit from an automated deployment and management of multiple Amplify applications across various customers.

**Important**: in CDK v2, amplify is in alpha stages An experimental construct library for this service is available in preview. Since it is not stable yet, it is distributed as a separate package so that you can pin its version independently of the rest of the CDK. So we are using: _@aws-cdk/aws-amplify-alpha_

## AWS CDK Installation

The AWS CDK Toolkit, the CLI command cdk, is the primary tool for interacting with your AWS CDK app. It will be used to deploy the CDK code to the target AWS environment. To install, use the command below.

```sh
npm install -g aws-cdk
```

## Building the infrastructure with AWS CDK (already created in this repo)

The below command creates the CDK app which will be developed in Typescript. The CDK app will be stored in the new folder amplify-infra. The typescript code for the cdk app will be defined in the file amplify-infra-stack.ts which is in the lib folder of the CDK application (amplify-react-sample/amplify-infra/lib/amplify-infra-stack.ts).

```sh
cd ~/amplify-sample-app
mkdir amplify-infra
cd amplify-infra
cdk init --language typescript
```

## To install the CDK modules required to build the application, run the following commands (already added in this repo)

```sh
npm install @aws-cdk/aws-codecommit @aws-cdk/aws-amplify
```

It is recommended that the version of the installed modules is the same as the version of the cdk core module. To implement this, identify the version of the installed @aws-cdk/core module (from the package.json file) and add the value to the install command of any new module. For example, npm install @aws-cdk/aws-codecommit@X.XX.X

## Creation of the source control repository (optional)

Currently, CDK provides the option of using GitHub, GitLab and AWS CodeCommit as the source repository. 

### Using CodeCommit

```typescript
// ~/amplify-react-sample/amplify-infra/lib/amplify-infra-stack.ts

import * as cdk from "@aws-cdk/core";
import * as codecommit from "@aws-cdk/aws-codecommit";

export class AmplifyInfraStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Part 1 [Optional] - Creation of the source control repository
    const amplifyReactSampleRepo = new codecommit.Repository(
      this,
      "AmplifyReactTestRepo",
      {
        repositoryName: "amplify-react-test-repo",
        description:
          "CodeCommit repository that will be used as the source repository for the sample react app and the cdk app",
      }
    );
  }
}
```

To build the application and deploy the resources to AWS cloud, run the following commands:

```sh
cd ~/amplify-sample-app/amplify-infra
npm run build
cdk deploy
```

## Creation of the Amplify Application

CDK provides a construct [App](https://docs.aws.amazon.com/cdk/api/latest/docs/@aws-cdk_aws-amplify.App.html) to define and configure an Amplify application. The sample code below shows an example of an Amplify Application created from a source code in CodeCommit. The build specification to define the actions to be performed during the automated Amplify build stage can be defined by adding “amplify.yml” to the repository **(~/amplify-sample-app/amplify.yml)**. A sample content of the file as used in this example is shown below.

```typescript
// ~/amplify-react-sample/amplify-infra/lib/amplify-infra-stack.ts

import * as cdk from "@aws-cdk/core";
import * as codecommit from "@aws-cdk/aws-codecommit";
import * as amplify from "@aws-cdk/aws-amplify";

export class AmplifyInfraStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Part 1 [Optional] - Creation of the source control repository
    const amplifyReactSampleRepo = new codecommit.Repository(
      this,
      "AmplifyReactTestRepo",
      {
        repositoryName: "amplify-react-test-repo",
        description:
          "CodeCommit repository that will be used as the source repository for the sample react app and the cdk app",
      }
    );

    // Part 2 - Creation of the Amplify Application
    const amplifyApp = new amplify.App(this, "sample-react-app ", {
      sourceCodeProvider: new amplify.CodeCommitSourceCodeProvider({
        repository: amplifyReactSampleRepo,
      }),
    });
    const masterBranch = amplifyApp.addBranch("master");
  }
}
```

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: build
    files:
      - "**/*"
  cache:
    paths:
      - node_modules/**/*
```

This will create the CodeCommit repository which can be used as the source repository for the sample React app and cdk app. Commit the “amplify-sample-app” folder (which contains the sample React app and the cdk code) to the repository using standard git commands.

### Using Github

Amplify application can also be created from a code base in GitHub repository. CDK provides a class [GitHubSourceCodeProvider](https://docs.aws.amazon.com/cdk/api/latest/docs/@aws-cdk_aws-amplify.GitHubSourceCodeProvider.html) within the **@aws-cdk/aws-amplify package** which enables an amplify application to be created by specifying the repository owner, name and a [personal access token](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token). The token will need to be granted the “repo” scope to give amplify the necessary permission to access the repository. For example, amplify will create a webhook in the GitHub repository which will be triggered when one or more commits are pushed to a repository branch or tag. In the code example below, the token generated is stored encrypted as a key-value pair in AWS Secrets Manager and will be retrieved at runtime to access the GitHub repository.

```typescript
// ~/amplify-react-sample/amplify-infra/lib/amplify-infra-stack.ts

import * as cdk from "@aws-cdk/core";
import * as amplify from "@aws-cdk/aws-amplify";

export class AmplifyInfraStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Part 2 - Creation of the Amplify Application
    const amplifyApp = new amplify.App(this, "sample-react-app ", {
      sourceCodeProvider: new amplify.GitHubSourceCodeProvider({
        owner: "[Repository-Owner]",
        repository: "[Repository-Name]",
        oauthToken: cdk.SecretValue.secretsManager("[Secret-Name]", {
          jsonField: "[Secret-Key]",
        }),
      }),
    });
    const masterBranch = amplifyApp.addBranch("master");
  }
}
```



## Available Scripts (React)

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

## Credits

This repo was created following [this post](https://aws.amazon.com/pt/blogs/mobile/deploying-a-static-website-with-aws-amplify-and-cdk/) instructions.

**Important:** this post is in CDK v1 so i upgraded the code following [this article](https://aws.amazon.com/pt/blogs/mobile/use-aws-cdk-v2-with-the-aws-amplify-cli-extensibility-features-beta/) and [AWS CDK documentation](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_amplify-readme.html)