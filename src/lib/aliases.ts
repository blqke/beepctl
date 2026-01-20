import type { BeeperConfig } from "./config.js";

/** Resolve alias to chat ID, pass through direct chat IDs, or return null */
export function resolveAlias(input: string, config: BeeperConfig): string | null {
	if (config.aliases?.[input]) {
		return config.aliases[input];
	}
	if (input.startsWith("!")) {
		return input;
	}
	return null;
}

/** Validate alias name (alphanumeric + underscore only) */
export function isValidAliasName(name: string): boolean {
	return /^[a-zA-Z0-9_]+$/.test(name);
}

/** Validate chat ID format (must start with !) */
export function isValidChatId(chatId: string): boolean {
	return chatId.startsWith("!");
}
