// Beeper API Types

export interface Account {
	id: string;
	service: string;
	name?: string;
	avatarUrl?: string;
}

export interface Chat {
	id: string;
	accountId: string;
	name: string;
	lastMessage?: Message;
	unreadCount?: number;
	avatarUrl?: string;
}

export interface Message {
	id: string;
	chatId: string;
	senderId: string;
	senderName?: string;
	text: string;
	timestamp: string;
	attachments?: Attachment[];
}

export interface Attachment {
	id: string;
	mimeType: string;
	filename?: string;
	url?: string;
}

export interface SearchResult {
	messages: Message[];
	chats: Chat[];
}
