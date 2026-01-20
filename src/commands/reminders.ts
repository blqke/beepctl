import { Command } from "commander";
import kleur from "kleur";
import { getClient } from "../lib/client.js";
import { handleCommandError, resolveChatIdOrExit } from "../lib/command-utils.js";
import { getConfig } from "../lib/config.js";
import { parseFutureTime } from "../lib/dates.js";

export const remindersCommand = new Command("reminders").description("Manage chat reminders");

remindersCommand
	.command("set")
	.description("Set a reminder for a chat")
	.argument("<chat-id>", "Chat ID or alias")
	.argument("<time>", "When to remind (30m, 1h, 2d, 1w, tomorrow, or ISO date)")
	.option("-d, --dismiss-on-message", "Cancel if someone messages in the chat")
	.action(async (chatId: string, time: string, options) => {
		try {
			const client = getClient();
			const config = getConfig();
			const targetChatId = resolveChatIdOrExit(chatId, config);

			const remindAtMs = parseFutureTime(time);
			const remindAt = new Date(remindAtMs);

			await client.chats.reminders.create(targetChatId, {
				reminder: {
					remindAtMs,
					dismissOnIncomingMessage: options.dismissOnMessage,
				},
			});

			console.log(kleur.green("Reminder set successfully"));
			console.log(kleur.dim(`   Chat: ${targetChatId}`));
			console.log(kleur.dim(`   Remind at: ${remindAt.toLocaleString()}`));
			if (options.dismissOnMessage) {
				console.log(kleur.dim("   Will dismiss if someone messages"));
			}
		} catch (error) {
			handleCommandError(error, [
				{ match: "Invalid time format", message: "Invalid time format" },
				{ match: "404", message: "Chat not found" },
			]);
		}
	});

remindersCommand
	.command("clear")
	.description("Clear a reminder from a chat")
	.argument("<chat-id>", "Chat ID or alias")
	.action(async (chatId: string) => {
		try {
			const client = getClient();
			const config = getConfig();
			const targetChatId = resolveChatIdOrExit(chatId, config);

			await client.chats.reminders.delete(targetChatId);

			console.log(kleur.green("Reminder cleared"));
			console.log(kleur.dim(`   Chat: ${targetChatId}`));
		} catch (error) {
			handleCommandError(error, [{ match: "404", message: "Chat not found" }]);
		}
	});
