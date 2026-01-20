import { Command } from "commander";
import kleur from "kleur";
import { isValidChatId, resolveAlias } from "../lib/aliases.js";
import { getClient } from "../lib/client.js";
import { getConfig } from "../lib/config.js";
import { handleError } from "../lib/errors.js";

export const archiveCommand = new Command("archive")
	.description("Archive or unarchive a chat")
	.argument("<chat-id>", "Chat ID or alias to archive")
	.option("-u, --unarchive", "Unarchive the chat instead of archiving")
	.option("-q, --quiet", "Don't show confirmation message")
	.action(async (chatIdOrAlias: string, options) => {
		try {
			const client = getClient();
			const targetChatId = resolveAlias(chatIdOrAlias, getConfig());

			if (!targetChatId && !isValidChatId(chatIdOrAlias)) {
				console.error(kleur.red(`Invalid chat ID or alias: ${chatIdOrAlias}`));
				console.error(kleur.dim("  Chat IDs should start with '!' (e.g., !abc123:beeper.local)"));
				console.error(kleur.dim(`  Or add an alias: beep alias add ${chatIdOrAlias} <chatId>`));
				process.exit(1);
			}

			const chatId = targetChatId || chatIdOrAlias;
			const archived = !options.unarchive;
			await client.chats.archive(chatId, { archived });

			if (!options.quiet) {
				const action = archived ? "archived" : "unarchived";
				console.log(kleur.green(`Chat ${action} successfully!`));
				console.log(kleur.dim(`  Chat: ${chatId}`));
			}
		} catch (error) {
			handleError(error);
		}
	});
