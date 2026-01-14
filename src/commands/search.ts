import { Command } from "commander";
import kleur from "kleur";
import { isValidChatId, resolveAlias } from "../lib/aliases.js";
import type { Chat, Message } from "../lib/client.js";
import { getClient } from "../lib/client.js";
import { getConfig } from "../lib/config.js";
import { parseRelativeDate } from "../lib/dates.js";

// Visual separators
const SEPARATOR = kleur.dim("─".repeat(50));
const THIN_SEP = kleur.dim("┄".repeat(40));

// Helper functions
function parseArrayOption(value: string | string[]): string[] {
	if (Array.isArray(value)) {
		// Flatten and split on commas
		return value.flatMap((v) => v.split(",").map((s) => s.trim()));
	}
	return value.split(",").map((s) => s.trim());
}

function validateMediaTypes(types: string[]): Array<"any" | "video" | "image" | "link" | "file"> {
	const valid = ["any", "video", "image", "link", "file"];
	for (const type of types) {
		if (!valid.includes(type)) {
			throw new Error(`Invalid media type: ${type}. Must be: ${valid.join(", ")}`);
		}
	}
	return types as Array<"any" | "video" | "image" | "link" | "file">;
}

export const searchCommand = new Command("search")
	.description("Search messages across all chats")
	.argument("<query>", "Search query")
	.option("-l, --limit <number>", "Maximum results to show", "20")
	.option("-c, --chat <id...>", "Filter by chat ID(s) or alias(es)")
	.option("-a, --account <id...>", "Filter by account ID(s)")
	.option("-t, --chat-type <type>", "Filter by chat type: 'group' or 'single'")
	.option("--after <date>", "Messages after date (e.g., '1d ago', 'yesterday')")
	.option("--before <date>", "Messages before date (e.g., '1h ago', 'today')")
	.option("-s, --sender <sender>", "Filter by sender: 'me', 'others', or user ID")
	.option("-m, --media <types...>", "Media types: any, video, image, link, file")
	.option("--include-low-priority", "Include low priority messages")
	.option("--exclude-muted", "Exclude muted chats")
	.action(async (query: string, options) => {
		try {
			const client = getClient();
			const config = getConfig();
			const limit = Number.parseInt(options.limit, 10);

			// Parse and validate chat IDs
			let chatIDs: string[] | undefined;
			if (options.chat) {
				const rawChats = parseArrayOption(options.chat);
				chatIDs = [];

				for (const chat of rawChats) {
					const resolved = resolveAlias(chat, config);
					if (resolved) {
						chatIDs.push(resolved);
					} else if (isValidChatId(chat)) {
						chatIDs.push(chat);
					} else {
						console.error(kleur.red(`❌ Invalid chat ID or alias: ${chat}`));
						process.exit(1);
					}
				}

				if (chatIDs.length === 0) {
					console.error(kleur.yellow("⚠️  No valid chat IDs found, ignoring --chat filter"));
					chatIDs = undefined;
				}
			}

			// Parse account IDs
			let accountIDs: string[] | undefined;
			if (options.account) {
				accountIDs = parseArrayOption(options.account);
				if (accountIDs.length === 0) {
					accountIDs = undefined;
				}
			}

			// Validate chat type
			if (options.chatType && !["group", "single"].includes(options.chatType)) {
				console.error(kleur.red("❌ Chat type must be 'group' or 'single'"));
				process.exit(1);
			}

			// Parse and validate media types
			let mediaTypes: Array<"any" | "video" | "image" | "link" | "file"> | undefined;
			if (options.media) {
				try {
					const rawTypes = parseArrayOption(options.media);
					mediaTypes = validateMediaTypes(rawTypes);
					if (mediaTypes.length === 0) {
						mediaTypes = undefined;
					}
				} catch (error) {
					console.error(
						kleur.red(`❌ ${error instanceof Error ? error.message : "Invalid media type"}`),
					);
					process.exit(1);
				}
			}

			// Parse dates
			let dateAfter: string | undefined;
			let dateBefore: string | undefined;

			if (options.after) {
				try {
					dateAfter = parseRelativeDate(options.after);
				} catch (error) {
					console.error(
						kleur.red(
							`❌ Invalid --after date: ${error instanceof Error ? error.message : "Unknown error"}`,
						),
					);
					console.error(kleur.dim("   Examples: '1d ago', '2h ago', 'yesterday', 'today'"));
					process.exit(1);
				}
			}

			if (options.before) {
				try {
					dateBefore = parseRelativeDate(options.before);
				} catch (error) {
					console.error(
						kleur.red(
							`❌ Invalid --before date: ${error instanceof Error ? error.message : "Unknown error"}`,
						),
					);
					console.error(kleur.dim("   Examples: '1d ago', '2h ago', 'yesterday', 'today'"));
					process.exit(1);
				}
			}

			// Validate date range
			if (dateAfter && dateBefore) {
				if (new Date(dateAfter) >= new Date(dateBefore)) {
					console.error(kleur.red("❌ --after date must be before --before date"));
					process.exit(1);
				}
			}

			// Build filter description
			const filterDesc: string[] = [];
			if (chatIDs) filterDesc.push(`chats: ${chatIDs.length}`);
			if (accountIDs) filterDesc.push(`accounts: ${accountIDs.length}`);
			if (options.chatType) filterDesc.push(`type: ${options.chatType}`);
			if (options.after) filterDesc.push(`after: ${options.after}`);
			if (options.before) filterDesc.push(`before: ${options.before}`);
			if (options.sender) filterDesc.push(`sender: ${options.sender}`);
			if (mediaTypes) filterDesc.push(`media: ${mediaTypes.join(",")}`);

			const filters = filterDesc.length > 0 ? kleur.dim(` [${filterDesc.join(", ")}]`) : "";
			console.log(kleur.dim(`Searching for "${query}"${filters}...`));

			// Fetch accounts to build accountID -> network map
			const accounts = await client.accounts.list();
			const networkMap = new Map<string, string>();
			for (const account of accounts) {
				networkMap.set(account.accountID, account.network || account.accountID);
			}

			// Build search params
			const searchParams: {
				query: string;
				chatIDs?: string[];
				accountIDs?: string[];
				chatType?: "group" | "single";
				dateAfter?: string;
				dateBefore?: string;
				sender?: string;
				mediaTypes?: Array<"any" | "video" | "image" | "link" | "file">;
				excludeLowPriority?: boolean;
				includeMuted?: boolean;
			} = { query };

			if (chatIDs && chatIDs.length > 0) searchParams.chatIDs = chatIDs;
			if (accountIDs && accountIDs.length > 0) searchParams.accountIDs = accountIDs;
			if (options.chatType) searchParams.chatType = options.chatType;
			if (dateAfter) searchParams.dateAfter = dateAfter;
			if (dateBefore) searchParams.dateBefore = dateBefore;
			if (options.sender) searchParams.sender = options.sender;
			if (mediaTypes && mediaTypes.length > 0) searchParams.mediaTypes = mediaTypes;

			// Boolean flags (inverse of defaults)
			if (options.includeLowPriority) searchParams.excludeLowPriority = false;
			if (options.excludeMuted) searchParams.includeMuted = false;

			// Search messages
			const messages: Message[] = [];
			for await (const msg of client.messages.search(searchParams)) {
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

				const hasFilters =
					chatIDs ||
					accountIDs ||
					options.chatType ||
					options.after ||
					options.before ||
					options.sender ||
					mediaTypes;

				if (hasFilters) {
					console.log(kleur.dim("   Try removing some filters to broaden your search"));
				}
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
