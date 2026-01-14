import { Command } from "commander";
import kleur from "kleur";
import { resolveAlias } from "../lib/aliases.js";
import { getClient } from "../lib/client.js";
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

			// Try to resolve alias
			const resolved = resolveAlias(chatId, config);

			if (resolved) {
				// Alias found or direct chat ID
				chatId = resolved;
			} else if (chatId.toLowerCase() === "myself") {
				// Fallback for 'myself' if not configured as alias
				const chats = [];
				for await (const chat of client.chats.search({ query: "note to self" })) {
					chats.push(chat);
					break; // Only need first match
				}

				if (chats.length === 0) {
					console.error(kleur.red("❌ 'Note to self' chat not found"));
					console.error(kleur.dim("   Create a 'Note to self' chat in Beeper Desktop first."));
					process.exit(1);
				}

				chatId = chats[0].id;
			} else {
				// Not an alias, not 'myself', not a direct chat ID
				console.error(kleur.red(`❌ Chat '${chatId}' not found`));
				console.error(
					kleur.dim(`   Use chat ID directly or add alias: beep alias add ${chatId} <chatId>`),
				);
				process.exit(1);
			}

			const sent = await client.messages.send(chatId, {
				text: message,
				replyToMessageID: options.replyTo,
			});

			if (!options.quiet) {
				console.log(kleur.green("✅ Message sent!"));
				console.log(kleur.dim(`   ID: ${sent.pendingMessageID}`));
				console.log(kleur.dim(`   Chat: ${sent.chatID}`));
				if (options.replyTo) {
					console.log(kleur.dim(`   Reply to: ${options.replyTo}`));
				}
			}
		} catch (error) {
			handleError(error);
		}
	});

function handleError(error: unknown): void {
	if (error instanceof Error) {
		if (error.message.includes("ECONNREFUSED")) {
			console.error(kleur.red("❌ Cannot connect to Beeper Desktop API"));
			console.error(kleur.dim("   Make sure Beeper Desktop is running with API enabled."));
		} else if (error.message.includes("403") && error.message.includes("write")) {
			console.error(kleur.red(`❌ Error: ${error.message}`));
			console.error(kleur.dim("   Enable write permissions in Beeper Desktop:"));
			console.error(kleur.dim("   Settings → Developers → Edit your token → Enable 'write' scope"));
		} else {
			console.error(kleur.red(`❌ Error: ${error.message}`));
		}
	} else {
		console.error(kleur.red("❌ Unknown error occurred"));
	}
	process.exit(1);
}
