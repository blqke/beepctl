import { Command } from "commander";
import kleur from "kleur";
import { isValidChatId, resolveAlias } from "../lib/aliases.js";
import type { ChatListResponse } from "../lib/client.js";
import { getClient } from "../lib/client.js";
import { getConfig } from "../lib/config.js";
import { parseRelativeDate } from "../lib/dates.js";

// Visual separators
const SEPARATOR = kleur.dim("─".repeat(50));

export const chatsCommand = new Command("chats").description("Manage chats");

// List subcommand (default behavior)
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

			const chats: ChatListResponse[] = [];

			// Parse activity dates if provided
			let activityAfter: string | undefined;
			let activityBefore: string | undefined;
			if (options.activityAfter) {
				try {
					activityAfter = parseRelativeDate(options.activityAfter);
				} catch (error) {
					console.error(
						kleur.red(
							`Invalid --activity-after date: ${error instanceof Error ? error.message : "Unknown"}`,
						),
					);
					process.exit(1);
				}
			}
			if (options.activityBefore) {
				try {
					activityBefore = parseRelativeDate(options.activityBefore);
				} catch (error) {
					console.error(
						kleur.red(
							`Invalid --activity-before date: ${error instanceof Error ? error.message : "Unknown"}`,
						),
					);
					process.exit(1);
				}
			}

			// Check if we need search (any filter beyond basic list)
			const needsSearch =
				options.search ||
				options.inbox !== "all" ||
				options.type !== "any" ||
				options.unreadOnly ||
				activityAfter ||
				activityBefore;

			if (!needsSearch) {
				for await (const chat of client.chats.list()) {
					chats.push(chat);
					if (chats.length >= limit) break;
				}
			} else {
				const searchParams: {
					query?: string;
					inbox?: "primary" | "low-priority" | "archive";
					type?: "single" | "group";
					scope?: "titles" | "participants";
					unreadOnly?: boolean;
					lastActivityAfter?: string;
					lastActivityBefore?: string;
				} = {};

				if (options.search) searchParams.query = options.search;
				if (options.inbox && options.inbox !== "all") {
					searchParams.inbox = options.inbox as "primary" | "low-priority" | "archive";
				}
				if (options.type && options.type !== "any") {
					searchParams.type = options.type as "single" | "group";
				}
				if (options.scope) {
					searchParams.scope = options.scope as "titles" | "participants";
				}
				if (options.unreadOnly) {
					searchParams.unreadOnly = true;
				}
				if (activityAfter) {
					searchParams.lastActivityAfter = activityAfter;
				}
				if (activityBefore) {
					searchParams.lastActivityBefore = activityBefore;
				}

				for await (const chat of client.chats.search(searchParams)) {
					chats.push(chat as ChatListResponse);
					if (chats.length >= limit) break;
				}
			}

			if (chats.length === 0) {
				console.log(kleur.yellow("No chats found."));
				return;
			}

			let title = "📥 Inbox";
			if (options.search) title = `🔍 Chats matching "${options.search}"`;
			else if (options.inbox === "all") title = "💬 All Chats";
			else if (options.inbox === "archive") title = "📦 Archived Chats";
			else if (options.inbox === "low-priority") title = "📭 Low Priority Chats";

			// Add filter indicators
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

// Show subcommand
chatsCommand
	.command("show")
	.description("Show detailed info about a chat")
	.argument("<chat-id>", "Chat ID or alias")
	.option("-p, --participants <count>", "Max participants to show (-1 for all)", "-1")
	.action(async (chatId: string, options) => {
		try {
			const client = getClient();
			const config = getConfig();

			const resolved = resolveAlias(chatId, config);
			let targetChatId: string;
			if (resolved) {
				targetChatId = resolved;
			} else if (isValidChatId(chatId)) {
				targetChatId = chatId;
			} else {
				console.error(kleur.red(`❌ Invalid chat ID or alias: ${chatId}`));
				process.exit(1);
			}

			const maxParticipantCount = Number.parseInt(options.participants, 10);
			const chat = await client.chats.retrieve(targetChatId, { maxParticipantCount });

			console.log(kleur.bold("\n📋 Chat Details"));
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

			// Participants
			console.log(SEPARATOR);
			console.log(kleur.bold(`👥 Participants (${chat.participants.total})`));
			for (const p of chat.participants.items) {
				const name = p.fullName || p.username || p.id;
				const self = p.isSelf ? kleur.cyan(" (you)") : "";
				console.log(`   • ${name}${self}`);
				if (p.phoneNumber) console.log(kleur.dim(`     📱 ${p.phoneNumber}`));
				if (p.email) console.log(kleur.dim(`     📧 ${p.email}`));
			}
			if (chat.participants.hasMore) {
				console.log(
					kleur.dim(`   ... and ${chat.participants.total - chat.participants.items.length} more`),
				);
			}
			console.log();
		} catch (error) {
			handleError(error);
		}
	});

// Create subcommand
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

			// Auto-detect type if not specified
			let chatType: "single" | "group" = options.type;
			if (!chatType) {
				chatType = participantIds.length === 1 ? "single" : "group";
			}

			// Validate
			if (chatType === "single" && participantIds.length !== 1) {
				console.error(kleur.red("❌ Single chats require exactly 1 participant"));
				process.exit(1);
			}

			const result = await client.chats.create({
				accountID: accountId,
				participantIDs: participantIds,
				type: chatType,
				title: options.name,
				messageText: options.message,
			});

			console.log(kleur.green("✓ Chat created successfully!"));
			console.log(kleur.dim(`   Chat ID: ${result.chatID}`));
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
