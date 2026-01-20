import BeeperDesktop from "@beeper/desktop-api";
import { getConfig } from "./config.js";

const DEFAULT_BASE_URL = "http://localhost:23373";

export type {
	Account,
	AccountListResponse,
} from "@beeper/desktop-api/resources/accounts/accounts.js";
export type { Chat, ChatListResponse } from "@beeper/desktop-api/resources/chats/chats.js";
export type { Message } from "@beeper/desktop-api/resources/shared.js";

let _client: BeeperDesktop | null = null;

export function getClient(): BeeperDesktop {
	if (!_client) {
		const config = getConfig();
		_client = new BeeperDesktop({
			accessToken: config.token,
			baseURL: config.baseUrl ?? DEFAULT_BASE_URL,
		});
	}
	return _client;
}
