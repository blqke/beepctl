import kleur from "kleur";
import { isValidChatId, resolveAlias } from "./aliases.js";
import type { BeeperConfig } from "./config.js";
import { parseRelativeDate } from "./dates.js";

/**
 * Resolve a chat ID from alias or direct ID. Exits process if invalid.
 */
export function resolveChatIdOrExit(chatIdArg: string, config: BeeperConfig): string {
	const resolved = resolveAlias(chatIdArg, config);
	if (resolved) return resolved;
	if (isValidChatId(chatIdArg)) return chatIdArg;

	console.error(kleur.red(`Invalid chat ID or alias: ${chatIdArg}`));
	process.exit(1);
}

/**
 * Parse a relative date string. Exits process with helpful message if invalid.
 */
export function parseDateOrExit(dateStr: string, optionName: string): string {
	try {
		return parseRelativeDate(dateStr);
	} catch (error) {
		const msg = error instanceof Error ? error.message : "Unknown error";
		console.error(kleur.red(`Invalid ${optionName} date: ${msg}`));
		console.error(kleur.dim("   Examples: '1d ago', '2h ago', 'yesterday', 'today'"));
		process.exit(1);
	}
}

/**
 * Validate that after date is before the before date. Exits if invalid.
 */
export function validateDateRangeOrExit(dateAfter: string, dateBefore: string): void {
	if (new Date(dateAfter) >= new Date(dateBefore)) {
		console.error(kleur.red("--after date must be before --before date"));
		process.exit(1);
	}
}

/**
 * Standard error handler for command actions.
 */
export function handleCommandError(error: unknown, extraHandlers?: ErrorHandler[]): never {
	if (error instanceof Error) {
		// Connection error
		if (error.message.includes("ECONNREFUSED")) {
			console.error(kleur.red("Cannot connect to Beeper Desktop API"));
			console.error(kleur.dim("   Make sure Beeper Desktop is running with API enabled."));
			process.exit(1);
		}

		// Check custom handlers
		if (extraHandlers) {
			for (const handler of extraHandlers) {
				if (error.message.includes(handler.match)) {
					console.error(kleur.red(handler.message));
					if (handler.hint) console.error(kleur.dim(`   ${handler.hint}`));
					process.exit(1);
				}
			}
		}

		console.error(kleur.red(`Error: ${error.message}`));
	} else {
		console.error(kleur.red("Unknown error occurred"));
	}
	process.exit(1);
}

interface ErrorHandler {
	match: string;
	message: string;
	hint?: string;
}

/**
 * Format file size in human readable form.
 */
export function formatSize(bytes: number): string {
	if (bytes < 1024) return `${bytes}B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

/**
 * Parse comma-separated or array values into a flat array.
 */
export function parseArrayOption(value: string | string[]): string[] {
	if (Array.isArray(value)) {
		return value.flatMap((v) => v.split(",").map((s) => s.trim()));
	}
	return value.split(",").map((s) => s.trim());
}

/**
 * Highlight query matches in text.
 */
export function highlightQuery(text: string, query: string): string {
	const escaped = query.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const regex = new RegExp(`(${escaped})`, "gi");
	return text.replaceAll(regex, kleur.yellow("$1"));
}

// Visual separator constants
export const SEPARATOR = kleur.dim("─".repeat(50));
export const THIN_SEP = kleur.dim("┄".repeat(40));
