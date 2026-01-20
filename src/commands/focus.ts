import { Command } from "commander";
import kleur from "kleur";
import { isValidChatId, resolveAlias } from "../lib/aliases.js";
import { getClient } from "../lib/client.js";
import { getConfig } from "../lib/config.js";
import { handleError } from "../lib/errors.js";

export const focusCommand = new Command("focus")
	.description("Bring Beeper Desktop to foreground")
	.argument("[chat-id]", "Optional chat ID or alias to open")
	.option("-m, --message <id>", "Jump to specific message")
	.option("-d, --draft <text>", "Pre-fill draft text")
	.option("-a, --attachment <path>", "Pre-fill draft attachment")
	.action(async (chatId: string | undefined, options) => {
		try {
			const client = getClient();
			const targetChatId = chatId ? resolveChatId(chatId) : undefined;

			const result = await client.focus({
				chatID: targetChatId,
				messageID: options.message,
				draftText: options.draft,
				draftAttachmentPath: options.attachment,
			});

			if (result.success) {
				console.log(kleur.green("Beeper Desktop focused"));
				if (targetChatId) {
					console.log(kleur.dim(`   Chat: ${targetChatId}`));
				}
			} else {
				console.error(kleur.red("Failed to focus Beeper Desktop"));
				process.exit(1);
			}
		} catch (error) {
			handleError(error);
		}
	});

function resolveChatId(chatId: string): string {
	const config = getConfig();
	const resolved = resolveAlias(chatId, config);

	if (resolved) return resolved;

	if (isValidChatId(chatId)) return chatId;

	console.error(kleur.red(`Invalid chat ID or alias: ${chatId}`));
	console.error(kleur.dim("   Chat IDs should start with '!'"));
	process.exit(1);
}
