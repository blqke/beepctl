const MS_PER_MINUTE = 60 * 1000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;
const MS_PER_WEEK = 7 * MS_PER_DAY;

function startOfDay(date: Date): Date {
	const result = new Date(date);
	result.setHours(0, 0, 0, 0);
	return result;
}

/**
 * Parse relative date strings into ISO 8601 format.
 * Supports: "1h ago", "2d ago", "3w ago", "1mo ago", "yesterday", "today"
 */
export function parseRelativeDate(input: string): string {
	const now = new Date();
	const normalized = input.toLowerCase();

	if (normalized === "yesterday") {
		const yesterday = startOfDay(now);
		yesterday.setDate(yesterday.getDate() - 1);
		return yesterday.toISOString();
	}

	if (normalized === "today") {
		return startOfDay(now).toISOString();
	}

	const match = input.match(/^(\d+)(h|d|w|mo)\s*ago$/i);
	if (!match) {
		throw new Error(
			`Invalid date format: "${input}". Use: "1h ago", "2d ago", "3w ago", "1mo ago", "yesterday", or "today"`,
		);
	}

	const amount = Number.parseInt(match[1], 10);
	const unit = match[2].toLowerCase();

	if (unit === "mo") {
		const date = new Date(now);
		date.setMonth(date.getMonth() - amount);
		return date.toISOString();
	}

	const msOffsets: Record<string, number> = {
		h: MS_PER_HOUR,
		d: MS_PER_DAY,
		w: MS_PER_WEEK,
	};

	return new Date(now.getTime() - amount * msOffsets[unit]).toISOString();
}

/**
 * Parse future time strings into Unix timestamp in milliseconds.
 * Supports: "30m", "1h", "2d", "1w", "tomorrow", or ISO date
 */
export function parseFutureTime(input: string): number {
	const now = Date.now();
	const normalized = input.toLowerCase();

	if (normalized === "tomorrow") {
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		tomorrow.setHours(9, 0, 0, 0);
		return tomorrow.getTime();
	}

	const match = input.match(/^(\d+)(m|h|d|w)$/i);
	if (match) {
		const amount = Number.parseInt(match[1], 10);
		const unit = match[2].toLowerCase();

		const msOffsets: Record<string, number> = {
			m: MS_PER_MINUTE,
			h: MS_PER_HOUR,
			d: MS_PER_DAY,
			w: MS_PER_WEEK,
		};

		return now + amount * msOffsets[unit];
	}

	const parsed = Date.parse(input);
	if (!Number.isNaN(parsed)) {
		return parsed;
	}

	throw new Error(
		`Invalid time format: "${input}". Use: "30m", "1h", "2d", "1w", "tomorrow", or ISO date`,
	);
}
