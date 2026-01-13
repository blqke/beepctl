import { Command } from "commander";
import kleur from "kleur";
import { getClient } from "../lib/client.js";

export const chatsCommand = new Command("chats")
	.description("List recent chats")
	.option("-l, --limit <number>", "Number of chats to show", "20")
	.option("-s, --search <query>", "Search chats by name")
	.action(async (options) => {
		try {
			const client = getClient();
			const limit = parseInt(options.limit, 10);

			const chats = options.search
				? await client.searchChats(options.search)
				: await client.listChats(limit);

			if (chats.length === 0) {
				console.log(kleur.yellow("No chats found."));
				return;
			}

			const title = options.search ? `🔍 Chats matching "${options.search}"` : `💬 Recent Chats`;

			console.log(kleur.bold(`\n${title} (${chats.length})\n`));

			for (const chat of chats) {
				const name = kleur.bold(chat.name || "Unknown");
				const unread = chat.unreadCount ? kleur.red(` (${chat.unreadCount} unread)`) : "";

				console.log(`  ${name}${unread}`);
				console.log(kleur.dim(`    ID: ${chat.id}`));

				if (chat.lastMessage) {
					const preview = truncate(chat.lastMessage.text, 50);
					console.log(kleur.dim(`    Last: ${preview}`));
				}
				console.log();
			}
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
