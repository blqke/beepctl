import { Command } from "commander";
import kleur from "kleur";
import { isValidChatId, resolveAlias } from "../lib/aliases.js";
import type { Message } from "../lib/client.js";
import { getClient } from "../lib/client.js";
import { getConfig } from "../lib/config.js";
import { parseRelativeDate } from "../lib/dates.js";

// Visual separators
const SEPARATOR = kleur.dim("─".repeat(50));

export const messagesCommand = new Command("messages")
	.description("List messages from a specific chat")
	.argument("<chat-id>", "Chat ID or alias")
	.option("-l, --limit <number>", "Maximum messages to show", "20")
	.option("--after <date>", "Messages after date (e.g., '1d ago', 'yesterday')")
	.option("--before <date>", "Messages before date (e.g., '1h ago', 'today')")
	.action(async (chatIdArg: string, options) => {
		try {
			const client = getClient();
			const config = getConfig();
			const limit = Number.parseInt(options.limit, 10);

			// Resolve chat ID (alias or direct ID)
			let chatID: string;
			const resolved = resolveAlias(chatIdArg, config);
			if (resolved) {
				chatID = resolved;
			} else if (isValidChatId(chatIdArg)) {
				chatID = chatIdArg;
			} else {
				console.error(kleur.red(`❌ Invalid chat ID or alias: ${chatIdArg}`));
				process.exit(1);
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
			if (options.after) filterDesc.push(`after: ${options.after}`);
			if (options.before) filterDesc.push(`before: ${options.before}`);

			const filters = filterDesc.length > 0 ? kleur.dim(` [${filterDesc.join(", ")}]`) : "";
			console.log(kleur.dim(`Listing messages from chat ${chatID}${filters}...`));

			// Fetch accounts to build accountID -> network map
			const accounts = await client.accounts.list();
			const networkMap = new Map<string, string>();
			for (const account of accounts) {
				networkMap.set(account.accountID, account.network || account.accountID);
			}

			// List messages
			// Note: messages.list() doesn't support date filtering (only search does)
			// We filter client-side if dates are provided
			const messages: Message[] = [];
			for await (const msg of client.messages.list(chatID)) {
				// Client-side date filtering
				const msgDate = new Date(msg.timestamp);
				if (dateAfter && msgDate <= new Date(dateAfter)) continue;
				if (dateBefore && msgDate >= new Date(dateBefore)) continue;
				messages.push(msg);
				if (messages.length >= limit) break;
			}

			if (messages.length === 0) {
				console.log(kleur.yellow(`\nNo messages found in chat ${chatID}`));

				if (options.after || options.before) {
					console.log(kleur.dim("   Try adjusting the date filters"));
				}
				return;
			}

			// Show messages
			console.log(kleur.bold(`\n📨 Messages (${messages.length})`));
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
				console.log(`   ${msg.text || kleur.dim("[no text]")}`);

				// Display attachments
				if (msg.attachments?.length) {
					for (const att of msg.attachments) {
						const icon =
							att.type === "img"
								? "🖼️"
								: att.type === "video"
									? "🎬"
									: att.type === "audio"
										? "🎵"
										: "📎";
						const size = att.fileSize ? ` (${formatSize(att.fileSize)})` : "";
						const name = att.fileName || att.type || "attachment";
						console.log(kleur.dim(`   ${icon} ${name}${size}`));
					}
				}

				// Display reactions
				if (msg.reactions?.length) {
					const reacts = msg.reactions.map((r) => r.reactionKey).join(" ");
					console.log(kleur.dim(`   ${reacts}`));
				}

				if (i < messages.length - 1) {
					console.log(SEPARATOR);
				}
			}
			console.log();
		} catch (error) {
			handleError(error);
		}
	});

function formatSize(bytes: number): string {
	if (bytes < 1024) return `${bytes}B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
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
