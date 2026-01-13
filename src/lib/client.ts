import { getConfig } from "./config.js";
import type { Account, Chat, Message, SearchResult } from "./types.js";

const DEFAULT_BASE_URL = "http://localhost:23373";

export class BeeperClient {
	private baseUrl: string;
	private token?: string;

	constructor(baseUrl?: string, token?: string) {
		const config = getConfig();
		this.baseUrl = baseUrl ?? config.baseUrl ?? DEFAULT_BASE_URL;
		this.token = token ?? config.token;
	}

	private async fetch<T>(path: string, options?: RequestInit): Promise<T> {
		const url = `${this.baseUrl}${path}`;

		const headers: Record<string, string> = {
			"Content-Type": "application/json",
			...(options?.headers as Record<string, string>),
		};

		if (this.token) {
			headers.Authorization = `Bearer ${this.token}`;
		}

		const response = await fetch(url, {
			...options,
			headers,
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`Beeper API error (${response.status}): ${error}`);
		}

		return response.json() as Promise<T>;
	}

	// Accounts - returns array directly
	async listAccounts(): Promise<Account[]> {
		return this.fetch<Account[]>("/v1/accounts");
	}

	// Chats - returns { items: [...] }
	async listChats(limit = 20): Promise<Chat[]> {
		const result = await this.fetch<{ items: Chat[] }>(`/v1/chats?limit=${limit}`);
		return result.items;
	}

	async getChat(chatId: string): Promise<Chat> {
		return this.fetch<Chat>(`/v1/chats/${encodeURIComponent(chatId)}`);
	}

	async searchChats(query: string): Promise<Chat[]> {
		const result = await this.fetch<{ items: Chat[] }>(
			`/v1/chats/search?q=${encodeURIComponent(query)}`,
		);
		return result.items;
	}

	// Messages - returns { items: [...] }
	async listMessages(chatId: string, limit = 50): Promise<Message[]> {
		const result = await this.fetch<{ items: Message[] }>(
			`/v1/chats/${encodeURIComponent(chatId)}/messages?limit=${limit}`,
		);
		return result.items;
	}

	async sendMessage(chatId: string, text: string): Promise<Message> {
		return this.fetch<Message>(`/v1/chats/${encodeURIComponent(chatId)}/messages`, {
			method: "POST",
			body: JSON.stringify({ text }),
		});
	}

	async searchMessages(query: string): Promise<Message[]> {
		const result = await this.fetch<{ items: Message[] }>(
			`/v1/messages/search?q=${encodeURIComponent(query)}`,
		);
		return result.items;
	}

	// Global search
	async search(query: string): Promise<SearchResult> {
		const [messages, chats] = await Promise.all([
			this.searchMessages(query),
			this.searchChats(query),
		]);
		return { messages, chats };
	}
}

// Singleton for CLI commands
let _client: BeeperClient | null = null;

export function getClient(): BeeperClient {
	if (!_client) {
		_client = new BeeperClient();
	}
	return _client;
}
