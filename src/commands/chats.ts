import { Command } from "commander";
import kleur from "kleur";
import { isValidChatId, resolveAlias } from "../lib/aliases.js";
import type { ChatListResponse } from "../lib/client.js";
import { getClient } from "../lib/client.js";
import { getConfig } from "../lib/config.js";
import { parseRelativeDate } from "../lib/dates.js";
import { handleError } from "../lib/errors.js";

const SEPARATOR = kleur.dim("─".repeat(50));

export const chatsCommand = new Command("chats").description("Manage chats");

chatsCommand
	.command("list", { isDefault: true })
	.description("List recent chats")
	.option("-l, --limit <number>", "Number of chats to show", "20")
	.option("-s, --search <query>", "Search chats by name")
	.option(
		"-i, --inbox <type>",
		"Filter by inbox: primary (default, non-archived), archive, low-priority, all",
		"primary",
	)
	.option("-t, --type <type>", "Filter by chat type: single, group, any", "any")
	.option("-u, --unread-only", "Show only unread chats")
	.option("--scope <scope>", "Search scope: titles or participants", "titles")
	.option("--activity-after <date>", "Chats with activity after date (e.g., '1d ago')")
	.option("--activity-before <date>", "Chats with activity before date")
	.action(async (options) => {
		try {
			const client = getClient();
			const limit = Number.parseInt(options.limit, 10);

			const activityAfter = parseDateOption(options.activityAfter, "--activity-after");
			const activityBefore = parseDateOption(options.activityBefore, "--activity-before");

			const chats = await fetchChats(client, options, limit, activityAfter, activityBefore);

			if (chats.length === 0) {
				console.log(kleur.yellow("No chats found."));
				return;
			}

			printChatList(chats, options, activityAfter, activityBefore);
		} catch (error) {
			handleError(error);
		}
	});

chatsCommand
	.command("show")
	.description("Show detailed info about a chat")
	.argument("<chat-id>", "Chat ID or alias")
	.option("-p, --participants <count>", "Max participants to show (-1 for all)", "-1")
	.action(async (chatId: string, options) => {
		try {
			const client = getClient();
			const targetChatId = resolveChatId(chatId);

			const maxParticipantCount = Number.parseInt(options.participants, 10);
			const chat = await client.chats.retrieve(targetChatId, { maxParticipantCount });

			console.log(kleur.bold("\nChat Details"));
			console.log(SEPARATOR);
			console.log(`${kleur.dim("ID:")}          ${chat.id}`);
			console.log(`${kleur.dim("Title:")}       ${chat.title || "(none)"}`);
			console.log(`${kleur.dim("Type:")}        ${chat.type}`);
			console.log(`${kleur.dim("Network:")}     ${chat.network}`);
			console.log(`${kleur.dim("Account:")}     ${chat.accountID}`);
			if (chat.description) {
				console.log(`${kleur.dim("Description:")} ${chat.description}`);
			}
			console.log(SEPARATOR);
			console.log(`${kleur.dim("Unread:")}      ${chat.unreadCount}`);
			console.log(`${kleur.dim("Archived:")}    ${chat.isArchived ? "Yes" : "No"}`);
			console.log(`${kleur.dim("Muted:")}       ${chat.isMuted ? "Yes" : "No"}`);
			console.log(`${kleur.dim("Pinned:")}      ${chat.isPinned ? "Yes" : "No"}`);
			if (chat.lastActivity) {
				console.log(`${kleur.dim("Last active:")} ${chat.lastActivity}`);
			}

			console.log(SEPARATOR);
			console.log(kleur.bold(`Participants (${chat.participants.total})`));
			for (const p of chat.participants.items) {
				const name = p.fullName || p.username || p.id;
				const self = p.isSelf ? kleur.cyan(" (you)") : "";
				console.log(`   - ${name}${self}`);
				if (p.phoneNumber) console.log(kleur.dim(`     ${p.phoneNumber}`));
				if (p.email) console.log(kleur.dim(`     ${p.email}`));
			}
			if (chat.participants.hasMore) {
				const remaining = chat.participants.total - chat.participants.items.length;
				console.log(kleur.dim(`   ... and ${remaining} more`));
			}
			console.log();
		} catch (error) {
			handleError(error);
		}
	});

chatsCommand
	.command("create")
	.description("Create a new chat")
	.argument("<account-id>", "Account ID to create chat on")
	.argument("<participant-ids...>", "User IDs to include")
	.option("-t, --type <type>", "Chat type: single or group (auto-detected if omitted)")
	.option("-n, --name <title>", "Group chat title")
	.option("-m, --message <text>", "Initial message")
	.action(async (accountId: string, participantIds: string[], options) => {
		try {
			const client = getClient();

			const chatType: "single" | "group" =
				options.type || (participantIds.length === 1 ? "single" : "group");

			if (chatType === "single" && participantIds.length !== 1) {
				console.error(kleur.red("Single chats require exactly 1 participant"));
				process.exit(1);
			}

			const result = await client.chats.create({
				accountID: accountId,
				participantIDs: participantIds,
				type: chatType,
				title: options.name,
				messageText: options.message,
			});

			console.log(kleur.green("Chat created successfully!"));
			console.log(kleur.dim(`   Chat ID: ${result.chatID}`));
		} catch (error) {
			handleError(error);
		}
	});

function parseDateOption(value: string | undefined, optionName: string): string | undefined {
	if (!value) return undefined;
	try {
		return parseRelativeDate(value);
	} catch (error) {
		const msg = error instanceof Error ? error.message : "Unknown";
		console.error(kleur.red(`Invalid ${optionName} date: ${msg}`));
		process.exit(1);
	}
}

function resolveChatId(chatId: string): string {
	const config = getConfig();
	const resolved = resolveAlias(chatId, config);

	if (resolved) return resolved;

	if (isValidChatId(chatId)) return chatId;

	console.error(kleur.red(`Invalid chat ID or alias: ${chatId}`));
	process.exit(1);
}

interface SearchParams {
	query?: string;
	inbox?: "primary" | "low-priority" | "archive";
	type?: "single" | "group";
	scope?: "titles" | "participants";
	unreadOnly?: boolean;
	lastActivityAfter?: string;
	lastActivityBefore?: string;
}

async function fetchChats(
	client: ReturnType<typeof getClient>,
	options: {
		search?: string;
		inbox: string;
		type: string;
		scope?: string;
		unreadOnly?: boolean;
	},
	limit: number,
	activityAfter?: string,
	activityBefore?: string,
): Promise<ChatListResponse[]> {
	const needsSearch =
		options.search ||
		options.inbox !== "all" ||
		options.type !== "any" ||
		options.unreadOnly ||
		activityAfter ||
		activityBefore;

	const chats: ChatListResponse[] = [];

	if (!needsSearch) {
		for await (const chat of client.chats.list()) {
			chats.push(chat);
			if (chats.length >= limit) break;
		}
		return chats;
	}

	const params: SearchParams = {};
	if (options.search) params.query = options.search;
	if (options.inbox !== "all") params.inbox = options.inbox as SearchParams["inbox"];
	if (options.type !== "any") params.type = options.type as SearchParams["type"];
	if (options.scope) params.scope = options.scope as SearchParams["scope"];
	if (options.unreadOnly) params.unreadOnly = true;
	if (activityAfter) params.lastActivityAfter = activityAfter;
	if (activityBefore) params.lastActivityBefore = activityBefore;

	for await (const chat of client.chats.search(params)) {
		chats.push(chat as ChatListResponse);
		if (chats.length >= limit) break;
	}

	return chats;
}

interface ListOptions {
	search?: string;
	inbox: string;
	type: string;
	unreadOnly?: boolean;
	activityAfter?: string;
	activityBefore?: string;
}

function printChatList(
	chats: ChatListResponse[],
	options: ListOptions,
	activityAfter?: string,
	activityBefore?: string,
): void {
	let title = "Inbox";
	if (options.search) {
		title = `Chats matching "${options.search}"`;
	} else if (options.inbox === "all") {
		title = "All Chats";
	} else if (options.inbox === "archive") {
		title = "Archived Chats";
	} else if (options.inbox === "low-priority") {
		title = "Low Priority Chats";
	}

	const filters: string[] = [];
	if (options.type !== "any") filters.push(options.type);
	if (options.unreadOnly) filters.push("unread");
	if (activityAfter) filters.push(`after ${options.activityAfter}`);
	if (activityBefore) filters.push(`before ${options.activityBefore}`);

	const filterSuffix = filters.length > 0 ? kleur.dim(` [${filters.join(", ")}]`) : "";

	console.log(kleur.bold(`\n${title} (${chats.length})`) + filterSuffix);
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
			console.log(kleur.dim(`   ${preview}`));
		}

		if (i < chats.length - 1) {
			console.log(SEPARATOR);
		}
	}
	console.log();
}

function truncate(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text;
	return `${text.slice(0, maxLength - 3)}...`;
}
