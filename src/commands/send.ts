import { Command } from "commander";
import kleur from "kleur";
import { resolveAlias } from "../lib/aliases.js";
import { getClient } from "../lib/client.js";
import { handleCommandError } from "../lib/command-utils.js";
import { getConfig } from "../lib/config.js";

export const sendCommand = new Command("send")
	.description("Send a message to a chat")
	.argument("<chat-id>", "Chat ID, alias, or 'myself' for Note to self")
	.argument("<message>", "Message text to send")
	.option("-q, --quiet", "Don't show confirmation")
	.option("-r, --reply-to <message-id>", "Reply to a specific message")
	.action(async (chatId: string, message: string, options) => {
		try {
			const client = getClient();
			const config = getConfig();

			const resolvedChatId = await resolveChatIdWithMyselfFallback(chatId, config, client);

			const sent = await client.messages.send(resolvedChatId, {
				text: message,
				replyToMessageID: options.replyTo,
			});

			if (!options.quiet) {
				console.log(kleur.green("Message sent!"));
				console.log(kleur.dim(`   ID: ${sent.pendingMessageID}`));
				console.log(kleur.dim(`   Chat: ${sent.chatID}`));
				if (options.replyTo) {
					console.log(kleur.dim(`   Reply to: ${options.replyTo}`));
				}
			}
		} catch (error) {
			handleCommandError(error, [
				{
					match: "403",
					message: "Permission denied",
					hint: "Enable write permissions: Settings -> Developers -> Edit token -> Enable 'write' scope",
				},
			]);
		}
	});

async function resolveChatIdWithMyselfFallback(
	chatId: string,
	config: ReturnType<typeof getConfig>,
	client: ReturnType<typeof getClient>,
): Promise<string> {
	const resolved = resolveAlias(chatId, config);
	if (resolved) return resolved;

	// Handle 'myself' keyword
	if (chatId.toLowerCase() === "myself") {
		for await (const chat of client.chats.search({ query: "note to self" })) {
			return chat.id;
		}
		console.error(kleur.red("'Note to self' chat not found"));
		console.error(kleur.dim("   Create a 'Note to self' chat in Beeper Desktop first."));
		process.exit(1);
	}

	console.error(kleur.red(`Chat '${chatId}' not found`));
	console.error(
		kleur.dim(`   Use chat ID directly or add alias: beep alias add ${chatId} <chatId>`),
	);
	process.exit(1);
}
