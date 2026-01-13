import { Command } from "commander";
import kleur from "kleur";
import { getClient } from "../lib/client.js";

export const searchCommand = new Command("search")
	.description("Search messages across all chats")
	.argument("<query>", "Search query")
	.option("-l, --limit <number>", "Maximum results to show", "20")
	.action(async (query: string, options) => {
		try {
			const client = getClient();
			const limit = parseInt(options.limit, 10);

			console.log(kleur.dim(`Searching for "${query}"...`));

			const results = await client.search(query);

			if (results.messages.length === 0 && results.chats.length === 0) {
				console.log(kleur.yellow(`\nNo results found for "${query}"`));
				return;
			}

			// Show matching chats
			if (results.chats.length > 0) {
				console.log(kleur.bold(`\n💬 Matching Chats (${results.chats.length})\n`));
				for (const chat of results.chats.slice(0, 5)) {
					console.log(`  ${kleur.bold(chat.name)}`);
					console.log(kleur.dim(`    ID: ${chat.id}\n`));
				}
			}

			// Show matching messages
			if (results.messages.length > 0) {
				console.log(kleur.bold(`\n📨 Matching Messages (${results.messages.length})\n`));
				for (const msg of results.messages.slice(0, limit)) {
					const sender = msg.senderName || msg.senderId;
					const time = new Date(msg.timestamp).toLocaleString();

					console.log(`  ${kleur.cyan(sender)} ${kleur.dim(`• ${time}`)}`);
					console.log(`  ${highlightQuery(msg.text, query)}`);
					console.log(kleur.dim(`    Chat: ${msg.chatId}\n`));
				}
			}
		} catch (error) {
			handleError(error);
		}
	});

function highlightQuery(text: string, query: string): string {
	const regex = new RegExp(`(${escapeRegex(query)})`, "gi");
	return text.replace(regex, kleur.yellow("$1"));
}

function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
