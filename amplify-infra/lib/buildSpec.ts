import { BuildSpec } from 'aws-cdk-lib/aws-codebuild';

export default BuildSpec.fromObjectToYaml({
  version: '1.0',
  applications: [
    {
      frontend: {
        phases: {
          preBuild: {
            commands: [
              'npm ci',
            ],
          },
          build: {
            commands: [
              'npm run build',
            ],
          },
        },
        artifacts: {
          baseDirectory: 'build',
          files: ['**/*'],
        },
        cache: {
            paths: [
                'node_modules/**/*'
            ]
        }
      },
    },
  ],
});