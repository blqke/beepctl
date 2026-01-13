import { Command } from "commander";
import kleur from "kleur";
import type { ChatListResponse } from "../lib/client.js";
import { getClient } from "../lib/client.js";

// Visual separators
const SEPARATOR = kleur.dim("─".repeat(50));

export const chatsCommand = new Command("chats")
	.description("List recent chats")
	.option("-l, --limit <number>", "Number of chats to show", "20")
	.option("-s, --search <query>", "Search chats by name")
	.action(async (options) => {
		try {
			const client = getClient();
			const limit = Number.parseInt(options.limit, 10);

			const chats: ChatListResponse[] = [];

			if (options.search) {
				// Search chats
				for await (const chat of client.chats.search({ query: options.search })) {
					chats.push(chat as ChatListResponse);
					if (chats.length >= limit) break;
				}
			} else {
				// List chats
				for await (const chat of client.chats.list()) {
					chats.push(chat);
					if (chats.length >= limit) break;
				}
			}

			if (chats.length === 0) {
				console.log(kleur.yellow("No chats found."));
				return;
			}

			const title = options.search ? `🔍 Chats matching "${options.search}"` : "💬 Recent Chats";

			console.log(kleur.bold(`\n${title} (${chats.length})`));
			console.log(SEPARATOR);

			for (let i = 0; i < chats.length; i++) {
				const chat = chats[i];
				const num = kleur.dim(`${i + 1}.`);
				const name = kleur.bold(chat.title || chat.description || "Unknown");
				const network = kleur.dim(`[${chat.network || chat.accountID}]`);
				const unread = chat.unreadCount ? kleur.red(` (${chat.unreadCount} unread)`) : "";

				console.log(`${num} ${name} ${network}${unread}`);
				console.log(kleur.dim(`   ID: ${chat.id}`));

				if (chat.preview?.text) {
					const preview = truncate(chat.preview.text, 50);
					console.log(kleur.dim(`   💬 ${preview}`));
				}

				if (i < chats.length - 1) {
					console.log(SEPARATOR);
				}
			}
			console.log();
		} catch (error) {
			handleError(error);
		}
	});

function truncate(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text;
	return `${text.slice(0, maxLength - 3)}...`;
}

function handleError(error: unknown): void {
	if (error instanceof Error) {
		if (error.message.includes("ECONNREFUSED")) {
			console.error(kleur.red("❌ Cannot connect to Beeper Desktop API"));
			console.error(kleur.dim("   Make sure Beeper Desktop is running with API enabled."));
		} else {
			console.error(kleur.red(`❌ Error: ${error.message}`));
		}
	} else {
		console.error(kleur.red("❌ Unknown error occurred"));
	}
	process.exit(1);
}
