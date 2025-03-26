import { z } from 'zod';
import { resolveSafeChildPath } from '@backstage/backend-plugin-api';
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
const { spawn } = require('child_process');

export function createGitCommandAction() {
  const inputSchema = z.object({
    command: z
      .string()
      .optional()
      .default('bash')
      .describe(
        'The command to run. Defaults to bash. If you want to run a different command, specify it here.',
      ),

    args: z
      .string()
      .array()
      .optional()
      .default([])
      .describe('The arguments to pass to the bash command'),

    workingDirectory: z
      .string()
      .optional()
      .default('.')
      .describe('The directory to run the command in'),
  });

  return createTemplateAction<{
    command?: string[];
    args?: string[];
    workingDirectory?: string;
  }>({
    id: 'bash:command',
    description: 'Run a bash command',
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

      const localPath = resolveSafeChildPath(ctx.workspacePath, input.data.workingDirectory)

      var runCmd = 'bash';
      if (input.data.command) {
        runCmd = input.data.command;
      }

      ctx.logger.info(`Running command: ${runCmd} ${input.data.args.join(' ')}in ${localPath}`);

      await new Promise<void>((resolve, reject) => {
        const cmd = spawn(runCmd, input.data.args, {
          cwd: localPath,
          shell: true,
        });

        cmd.stdout.on('data', (data: any) => {
          ctx.logger.info(`stdout: ${data}`);
        });

        cmd.stderr.on('data', (data: any) => {
          ctx.logger.error(`stderr: ${data}`);
        });

        cmd.on('close', (code: number) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Command failed with exit code ${code}`));
          }
        });
      });
    },
  });
}
