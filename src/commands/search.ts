import { Command } from "commander";
import kleur from "kleur";
import { isValidChatId, resolveAlias } from "../lib/aliases.js";
import type { Chat, Message } from "../lib/client.js";
import { getClient } from "../lib/client.js";
import {
	handleCommandError,
	highlightQuery,
	parseArrayOption,
	parseDateOrExit,
	SEPARATOR,
	THIN_SEP,
	validateDateRangeOrExit,
} from "../lib/command-utils.js";
import { getConfig } from "../lib/config.js";

type MediaType = "any" | "video" | "image" | "link" | "file";
const VALID_MEDIA_TYPES: MediaType[] = ["any", "video", "image", "link", "file"];

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

			// Parse chat IDs
			const chatIDs = parseChatIds(options.chat, config);

			// Parse account IDs
			const accountIDs = options.account ? parseArrayOption(options.account) : undefined;

			// Validate chat type
			if (options.chatType && !["group", "single"].includes(options.chatType)) {
				console.error(kleur.red("Chat type must be 'group' or 'single'"));
				process.exit(1);
			}

			// Parse media types
			const mediaTypes = parseMediaTypes(options.media);

			// Parse dates
			const dateAfter = options.after ? parseDateOrExit(options.after, "--after") : undefined;
			const dateBefore = options.before ? parseDateOrExit(options.before, "--before") : undefined;

			if (dateAfter && dateBefore) {
				validateDateRangeOrExit(dateAfter, dateBefore);
			}

			// Build filter description
			const filterParts = buildFilterDescription(options, chatIDs, accountIDs, mediaTypes);
			const filters = filterParts.length > 0 ? kleur.dim(` [${filterParts.join(", ")}]`) : "";
			console.log(kleur.dim(`Searching for "${query}"${filters}...`));

			// Build accountID -> network map
			const accounts = await client.accounts.list();
			const networkMap = new Map<string, string>();
			for (const account of accounts) {
				networkMap.set(account.accountID, account.network || account.accountID);
			}

			// Build search params
			const searchParams = buildSearchParams(query, {
				chatIDs,
				accountIDs,
				chatType: options.chatType,
				dateAfter,
				dateBefore,
				sender: options.sender,
				mediaTypes,
				includeLowPriority: options.includeLowPriority,
				excludeMuted: options.excludeMuted,
			});

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
					dateAfter ||
					dateBefore ||
					options.sender ||
					mediaTypes;
				if (hasFilters) {
					console.log(kleur.dim("   Try removing some filters to broaden your search"));
				}
				return;
			}

			// Display results
			if (chats.length > 0) {
				printChats(chats);
			}
			if (messages.length > 0) {
				printMessages(messages, query, networkMap);
			}
		} catch (error) {
			handleCommandError(error);
		}
	});

function parseChatIds(
	chatOption: string[] | undefined,
	config: ReturnType<typeof getConfig>,
): string[] | undefined {
	if (!chatOption) return undefined;

	const rawChats = parseArrayOption(chatOption);
	const chatIDs: string[] = [];

	for (const chat of rawChats) {
		const resolved = resolveAlias(chat, config);
		if (resolved) {
			chatIDs.push(resolved);
		} else if (isValidChatId(chat)) {
			chatIDs.push(chat);
		} else {
			console.error(kleur.red(`Invalid chat ID or alias: ${chat}`));
			process.exit(1);
		}
	}

	if (chatIDs.length === 0) {
		console.error(kleur.yellow("No valid chat IDs found, ignoring --chat filter"));
		return undefined;
	}

	return chatIDs;
}

function parseMediaTypes(mediaOption: string[] | undefined): MediaType[] | undefined {
	if (!mediaOption) return undefined;

	const rawTypes = parseArrayOption(mediaOption);
	for (const type of rawTypes) {
		if (!VALID_MEDIA_TYPES.includes(type as MediaType)) {
			console.error(
				kleur.red(`Invalid media type: ${type}. Must be: ${VALID_MEDIA_TYPES.join(", ")}`),
			);
			process.exit(1);
		}
	}

	return rawTypes.length > 0 ? (rawTypes as MediaType[]) : undefined;
}

function buildFilterDescription(
	options: Record<string, unknown>,
	chatIDs: string[] | undefined,
	accountIDs: string[] | undefined,
	mediaTypes: MediaType[] | undefined,
): string[] {
	const parts: string[] = [];
	if (chatIDs) parts.push(`chats: ${chatIDs.length}`);
	if (accountIDs) parts.push(`accounts: ${accountIDs.length}`);
	if (options.chatType) parts.push(`type: ${options.chatType}`);
	if (options.after) parts.push(`after: ${options.after}`);
	if (options.before) parts.push(`before: ${options.before}`);
	if (options.sender) parts.push(`sender: ${options.sender}`);
	if (mediaTypes) parts.push(`media: ${mediaTypes.join(",")}`);
	return parts;
}

interface SearchOptions {
	chatIDs?: string[];
	accountIDs?: string[];
	chatType?: "group" | "single";
	dateAfter?: string;
	dateBefore?: string;
	sender?: string;
	mediaTypes?: MediaType[];
	includeLowPriority?: boolean;
	excludeMuted?: boolean;
}

function buildSearchParams(
	query: string,
	opts: SearchOptions,
): {
	query: string;
	chatIDs?: string[];
	accountIDs?: string[];
	chatType?: "group" | "single";
	dateAfter?: string;
	dateBefore?: string;
	sender?: string;
	mediaTypes?: MediaType[];
	excludeLowPriority?: boolean;
	includeMuted?: boolean;
} {
	const params: ReturnType<typeof buildSearchParams> = { query };

	if (opts.chatIDs?.length) params.chatIDs = opts.chatIDs;
	if (opts.accountIDs?.length) params.accountIDs = opts.accountIDs;
	if (opts.chatType) params.chatType = opts.chatType;
	if (opts.dateAfter) params.dateAfter = opts.dateAfter;
	if (opts.dateBefore) params.dateBefore = opts.dateBefore;
	if (opts.sender) params.sender = opts.sender;
	if (opts.mediaTypes?.length) params.mediaTypes = opts.mediaTypes;
	if (opts.includeLowPriority) params.excludeLowPriority = false;
	if (opts.excludeMuted) params.includeMuted = false;

	return params;
}

function printChats(chats: Chat[]): void {
	console.log(kleur.bold(`\nMatching Chats (${chats.length})`));
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

function printMessages(messages: Message[], query: string, networkMap: Map<string, string>): void {
	console.log(kleur.bold(`\nMatching Messages (${messages.length})`));
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
		console.log(kleur.dim(`   ${msg.chatID}`));

		if (i < messages.length - 1) console.log(SEPARATOR);
	}
	console.log();
}
