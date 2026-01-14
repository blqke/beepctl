/**
 * Parse relative date strings into ISO 8601 format
 * Supports formats like "1h ago", "2d ago", "yesterday", "today"
 */
export function parseRelativeDate(input: string): string {
	const now = new Date();

	// Handle "yesterday"
	if (input.toLowerCase() === "yesterday") {
		const yesterday = new Date(now);
		yesterday.setDate(yesterday.getDate() - 1);
		yesterday.setHours(0, 0, 0, 0);
		return yesterday.toISOString();
	}

	// Handle "today"
	if (input.toLowerCase() === "today") {
		const today = new Date(now);
		today.setHours(0, 0, 0, 0);
		return today.toISOString();
	}

	// Handle relative time patterns: "1h ago", "2d ago", "3w ago", "1mo ago"
	const match = input.match(/^(\d+)(h|d|w|mo)\s*ago$/i);

	if (match) {
		const amount = Number.parseInt(match[1], 10);
		const unit = match[2].toLowerCase();

		switch (unit) {
			case "h": {
				const date = new Date(now.getTime() - amount * 60 * 60 * 1000);
				return date.toISOString();
			}
			case "d": {
				const date = new Date(now.getTime() - amount * 24 * 60 * 60 * 1000);
				return date.toISOString();
			}
			case "w": {
				const date = new Date(now.getTime() - amount * 7 * 24 * 60 * 60 * 1000);
				return date.toISOString();
			}
			case "mo": {
				const date = new Date(now);
				date.setMonth(date.getMonth() - amount);
				return date.toISOString();
			}
		}
	}

	throw new Error(
		`Invalid date format: "${input}". Use: "1h ago", "2d ago", "3w ago", "1mo ago", "yesterday", or "today"`,
	);
}

/**
 * Parse future time strings into Unix timestamp in milliseconds
 * Supports formats like "30m", "1h", "2d", "1w", "tomorrow"
 */
export function parseFutureTime(input: string): number {
	const now = Date.now();

	// Handle "tomorrow"
	if (input.toLowerCase() === "tomorrow") {
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		tomorrow.setHours(9, 0, 0, 0); // Default to 9am
		return tomorrow.getTime();
	}

	// Handle relative time patterns: "30m", "1h", "2d", "1w"
	const match = input.match(/^(\d+)(m|h|d|w)$/i);

	if (match) {
		const amount = Number.parseInt(match[1], 10);
		const unit = match[2].toLowerCase();

		switch (unit) {
			case "m":
				return now + amount * 60 * 1000;
			case "h":
				return now + amount * 60 * 60 * 1000;
			case "d":
				return now + amount * 24 * 60 * 60 * 1000;
			case "w":
				return now + amount * 7 * 24 * 60 * 60 * 1000;
		}
	}

	// Try parsing as ISO date
	const parsed = Date.parse(input);
	if (!Number.isNaN(parsed)) {
		return parsed;
	}

	throw new Error(
		`Invalid time format: "${input}". Use: "30m", "1h", "2d", "1w", "tomorrow", or ISO date`,
	);
}
