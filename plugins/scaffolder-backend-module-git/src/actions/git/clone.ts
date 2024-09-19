import { resolveSafeChildPath } from '@backstage/backend-plugin-api';
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import nodegit from 'nodegit';
import { z } from 'zod';

export function createGitCloneAction() {
  const inputSchema = z.object({
    repositoryUrl: z.string().url(),
    workingDirectory: z.string().optional().default('./'),
  });

  const outputSchema = z.object({
    defaultBranch: z.string(),
  });

  return createTemplateAction<{
    repositoryUrl: string;
    workingDirectory?: string;
  }>({
    id: 'git:clone',
    description: 'Clone a git repository',
    schema: {
      input: inputSchema,
      output: outputSchema,
    },
    async handler(ctx) {
      const input = inputSchema.safeParse(ctx.input);
      if (!input.success) {
        throw new Error(
          `Invalid input: ${Object.keys(input.error.flatten().fieldErrors)}`,
        );
      }

      const localPath = resolveSafeChildPath(ctx.workspacePath, input.data.workingDirectory);

      await nodegit.Clone(input.data.repositoryUrl, localPath);
    },
  });
}
