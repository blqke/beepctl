import { Command } from "commander";
import kleur from "kleur";
import type { Chat, Message } from "../lib/client.js";
import { getClient } from "../lib/client.js";

// Visual separators
const SEPARATOR = kleur.dim("─".repeat(50));
const THIN_SEP = kleur.dim("┄".repeat(40));

export const searchCommand = new Command("search")
	.description("Search messages across all chats")
	.argument("<query>", "Search query")
	.option("-l, --limit <number>", "Maximum results to show", "20")
	.action(async (query: string, options) => {
		try {
			const client = getClient();
			const limit = Number.parseInt(options.limit, 10);

			console.log(kleur.dim(`Searching for "${query}"...`));

			// Fetch accounts to build accountID -> network map
			const accounts = await client.accounts.list();
			const networkMap = new Map<string, string>();
			for (const account of accounts) {
				networkMap.set(account.accountID, account.network || account.accountID);
			}

			// Search messages
			const messages: Message[] = [];
			for await (const msg of client.messages.search({ query })) {
				messages.push(msg);
				if (messages.length >= limit) break;
			}

			// Search chats
			const chats: Chat[] = [];
			for await (const chat of client.chats.search({ query })) {
				chats.push(chat);
				if (chats.length >= 5) break;
			}

			if (messages.length === 0 && chats.length === 0) {
				console.log(kleur.yellow(`\nNo results found for "${query}"`));
				return;
			}

			// Show matching chats
			if (chats.length > 0) {
				console.log(kleur.bold(`\n💬 Matching Chats (${chats.length})`));
				console.log(SEPARATOR);

				for (let i = 0; i < chats.length; i++) {
					const chat = chats[i];
					const num = kleur.dim(`${i + 1}.`);
					console.log(`${num} ${kleur.bold(chat.title || chat.description || "Unknown")}`);
					console.log(kleur.dim(`   ID: ${chat.id}`));
					if (i < chats.length - 1) console.log(THIN_SEP);
				}
				console.log();
			}

			// Show matching messages
			if (messages.length > 0) {
				console.log(kleur.bold(`\n📨 Matching Messages (${messages.length})`));
				console.log(SEPARATOR);

				for (let i = 0; i < messages.length; i++) {
					const msg = messages[i];
					const num = kleur.dim(`${i + 1}.`);
					const sender = msg.senderName || msg.senderID;
					const network = networkMap.get(msg.accountID) || msg.accountID;
					const time = new Date(msg.timestamp).toLocaleString();

					console.log(
						`${num} ${kleur.cyan(sender)} ${kleur.dim(`[${network}]`)} ${kleur.dim(`• ${time}`)}`,
					);
					console.log(`   ${highlightQuery(msg.text || "", query)}`);
					console.log(kleur.dim(`   📁 ${msg.chatID}`));

					if (i < messages.length - 1) {
						console.log(SEPARATOR);
					}
				}
				console.log();
			}
		} catch (error) {
			handleError(error);
		}
	});

function highlightQuery(text: string, query: string): string {
	const regex = new RegExp(`(${escapeRegex(query)})`, "gi");
	return text.replaceAll(regex, kleur.yellow("$1"));
}

function escapeRegex(str: string): string {
	return str.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
