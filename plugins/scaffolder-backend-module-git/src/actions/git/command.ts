import { z } from "zod";
import { resolveSafeChildPath } from "@backstage/backend-plugin-api";
import { createTemplateAction } from "@backstage/plugin-scaffolder-node";
import { spawn } from "child_process";
import { ScmIntegrationRegistry } from "@backstage/integration";
import nodegit from "nodegit";
import { getIntegration } from "./utils";

export function createGitCommandAction(options: {
	integrations: ScmIntegrationRegistry;
}) {
	const inputSchema = z.object({
		command: z
			.string()
			.optional()
			.default("bash")
			.describe(
				"The command to run. Defaults to bash. If you want to run a different command, specify it here.",
			),

		args: z
			.string()
			.array()
			.optional()
			.default([])
			.describe("The arguments to pass to the bash command"),

		remoteName: z
			.string()
			.optional()
			.default("origin")
			.describe("The remote to push to"),

		workingDirectory: z
			.string()
			.optional()
			.default(".")
			.describe("The directory to run the command in"),
	});

	return createTemplateAction<{
		command?: string;
		args?: string[];
		workingDirectory?: string;
		remoteName?: string;
	}>({
		id: "git:command",
		description: "Run a bash command",
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
				ctx.workspacePath,
				input.data.workingDirectory,
			);
			let runCmd = "git";
			if (input.data.command) {
				runCmd = input.data.command;
			}

			try {
				const localGitPath = resolveSafeChildPath(
					resolveSafeChildPath(ctx.workspacePath, input.data.workingDirectory),
					".git",
				);
				const repository = await nodegit.Repository.open(localGitPath);
				const remote = await repository.getRemote(input.data.remoteName);
				const remoteUrl = remote.url();
				const currentBranch = await repository.getCurrentBranch();
				ctx.logger.info(`Pushing branch ${currentBranch.shorthand()}`);

				const integration = getIntegration(remoteUrl, options.integrations);
				runCmd = runCmd.replace(/token/g, integration?.config.token || "");
			} catch (error: any) {
				ctx.logger.error(`Failed to resolve .git path: ${error}`);
			}

			await new Promise<void>((resolve, reject) => {
				const cmd = spawn(runCmd, input.data.args, {
					cwd: localPath,
					shell: "/bin/bash",
				});

				cmd.stdout.on("data", (data: any) => {
					ctx.logger.info(`stdout: ${data}`);
				});

				cmd.stderr.on("data", (data: any) => {
					ctx.logger.info(`stderr: ${data}`);
				});

				cmd.on("close", (code: number) => {
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
