// Beeper API Types

export interface AccountUser {
	id: string;
	email?: string;
	fullName?: string;
	displayText?: string;
	username?: string;
	isSelf?: boolean;
}

export interface Account {
	accountID: string;
	network: string;
	user?: AccountUser;
}

export interface ChatPreview {
	id: string;
	chatID: string;
	accountID: string;
	senderID: string;
	senderName?: string;
	timestamp: string;
	text: string;
	isSender?: boolean;
}

export interface Chat {
	id: string;
	localChatID?: string;
	accountID: string;
	network?: string;
	title?: string;
	type?: string;
	lastActivity?: string;
	unreadCount?: number;
	isArchived?: boolean;
	isMuted?: boolean;
	isPinned?: boolean;
	preview?: ChatPreview;
}

export interface Message {
	id: string;
	chatID: string;
	accountID: string;
	senderID: string;
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
