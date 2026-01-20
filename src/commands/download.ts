import { copyFileSync } from "node:fs";
import { basename } from "node:path";
import { Command } from "commander";
import kleur from "kleur";
import { getClient } from "../lib/client.js";
import { handleError } from "../lib/errors.js";

export const downloadCommand = new Command("download")
	.description("Download a message attachment")
	.argument("<url>", "Matrix content URL (mxc:// or localmxc://)")
	.option("-o, --output <path>", "Save to specific file path")
	.action(async (url: string, options) => {
		try {
			const client = getClient();
			const result = await client.assets.download({ url });

			if (result.error) {
				console.error(kleur.red(`Download failed: ${result.error}`));
				process.exit(1);
			}

			if (!result.srcURL) {
				console.error(kleur.red("No source URL returned"));
				process.exit(1);
			}

			const localPath = result.srcURL.replace(/^file:\/\//, "");

			if (options.output) {
				copyFileSync(localPath, options.output);
				console.log(kleur.green("Downloaded successfully"));
				console.log(kleur.dim(`   Saved to: ${options.output}`));
			} else {
				console.log(kleur.green("Asset available locally"));
				console.log(kleur.dim(`   Path: ${localPath}`));
				console.log(kleur.dim(`   Filename: ${basename(localPath)}`));
			}
		} catch (error) {
			handleError(error);
		}
	});
