/* eslint-disable @typescript-eslint/no-useless-constructor */
import * as dotenv from 'dotenv'
import { RemovalPolicy, Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { App, GitHubSourceCodeProvider, AutoBranchCreation } from "@aws-cdk/aws-amplify-alpha";
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { SecretValue } from 'aws-cdk-lib';
import buildSpec from './buildSpec';

dotenv.config()


export class AmplifyInfraStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const role = new Role(this, 'AmplifyRoleWebApp', {
      assumedBy: new ServicePrincipal('amplify.amazonaws.com'),
      description: 'Custom role permitting resources creation from Amplify',
      managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess-Amplify')],
    });

    const owner: string = process.env.GIT_USER || '';
    const repository: string = process.env.GIT_REPO || '';
    // console.log('GIT_USER:', process.env.GIT_USER);
    // console.log('GIT_REPO:', process.env.GIT_REPO);

    const sourceCodeProvider = new GitHubSourceCodeProvider({
      // GitHub token should be saved in a secure place, we recommend AWS Secret Manager:
      oauthToken: SecretValue.secretsManager('github-access-token'), // replace github-access-token by the name of the Secrets Manager resource storing your GitHub token
      owner,
      repository,
    });

    const autoBranchCreation: AutoBranchCreation = {
      autoBuild: true,
      patterns: ['feature/*'],
      pullRequestPreview: true,
    };
    
    const autoBranchDeletion = true;

    // Part 2 - Creation of the Amplify Application
    const amplifyApp = new App(this, "sample-react-app ", {
      appName: 'React basic app',
      description: 'My React APP deployed with Amplify',
      role,
      sourceCodeProvider,
      buildSpec,
      autoBranchCreation,
      autoBranchDeletion
    });

    amplifyApp.applyRemovalPolicy(RemovalPolicy.DESTROY);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const mainBranch = amplifyApp.addBranch("master", {
      autoBuild: true, // set to true to automatically build the app on new pushes
      stage: "PRODUCTION",
    });

    new CfnOutput(this, 'appId', {
      value: amplifyApp.appId,
    });
  
  }
}
