/* eslint-disable @typescript-eslint/no-useless-constructor */
import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as codecommit from "aws-cdk-lib/aws-codecommit";
import { App, CodeCommitSourceCodeProvider } from "@aws-cdk/aws-amplify-alpha";

export class AmplifyInfraStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
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
    
    //Destroy this resource if 'cdk destroy' is invoked. Default is RETAIN
    amplifyReactSampleRepo.applyRemovalPolicy(RemovalPolicy.DESTROY);

    // Part 2 - Creation of the Amplify Application
    const amplifyApp = new App(this, "sample-react-app ", {
      sourceCodeProvider: new CodeCommitSourceCodeProvider({
        repository: amplifyReactSampleRepo,
      }),
    });

    amplifyApp.applyRemovalPolicy(RemovalPolicy.DESTROY);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const masterBranch = amplifyApp.addBranch("master");
    }
}
