import { resolveSafeChildPath } from '@backstage/backend-plugin-api';
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import nodegit from 'nodegit';
import { z } from 'zod';
import { getCredentialsCallback, getIntegration } from './utils';
import { ScmIntegrationRegistry } from '@backstage/integration';

export function createGitPushAction(options: {
  integrations: ScmIntegrationRegistry;
}) {
  const inputSchema = z.object({
    remoteName: z
      .string()
      .optional()
      .default('origin')
      .describe('The remote to push to'),
    workingDirectory: z
      .string()
      .optional()
      .default('.')
      .describe('The directory to clone the repository into'),
    mergePush: z
      .boolean()
      .optional()
      .default(false)
      .describe('Whether to merge the changes before pushing'),
    mergePushTitle: z
      .string()
      .optional()
      .default('')
      .describe('The title of the merge commit'),
    mergePushTarget: z
      .string()
      .optional()
      .default('master')
      .describe('The target branch to merge into'),
    mergePushDeleteSourceBranch: z
      .boolean()
      .optional()
      .default(true)
      .describe('Whether to delete the source branch after merging'),
  });

  return createTemplateAction<{
    remoteName?: string;
    workingDirectory?: string;
  }>({
    id: 'git:push',
    description: 'Push changes to a remote branch',
    schema: {
      input: inputSchema,
    },
    async handler(ctx) {
      const input = inputSchema.safeParse(ctx.input);
      if (!input.success) {
        throw new Error(
          `Invalid input: ${Object.keys(input.error.flatten().fieldErrors)}`,
        );
      }

      const localPath = resolveSafeChildPath(
        resolveSafeChildPath(ctx.workspacePath, input.data.workingDirectory),
        '.git',
      );

      const repository = await nodegit.Repository.open(localPath);

      ctx.logger.info(`Using remote ${input.data.remoteName}`);
      const remote = await repository.getRemote(input.data.remoteName);
      const remoteUrl = remote.url();
      ctx.logger.info(`Remote found at ${remoteUrl}`);

      const currentBranch = await repository.getCurrentBranch();
      ctx.logger.info(`Pushing branch ${currentBranch.shorthand()}`);

      const integration = getIntegration(remoteUrl, options.integrations);
      
      var mergePushOptions = {};
      if (input.data.mergePush) {
        mergePushOptions = {
          'merge_request.create': true,
          'merge_request.title': input.data.mergePushTitle,
          'merge_request_target': input.data.mergePushTarget,
          'merge_request.remove_source_branch': input.data.mergePushDeleteSourceBranch,
        };
      }
      await remote.push([`${currentBranch.name()}:${currentBranch.name()}`], {
        callbacks: {
          credentials: getCredentialsCallback(integration),
        },
        ...mergePushOptions,
      });
    },
  });
}
