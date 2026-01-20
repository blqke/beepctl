import kleur from "kleur";

interface ErrorHint {
	pattern: string;
	message: string;
	hint?: string;
}

const ERROR_HINTS: ErrorHint[] = [
	{
		pattern: "ECONNREFUSED",
		message: "Cannot connect to Beeper Desktop API",
		hint: "Make sure Beeper Desktop is running with API enabled.\n   Settings -> Developers -> Enable Beeper Desktop API",
	},
	{
		pattern: "404",
		message: "Resource not found",
		hint: "Make sure the ID is correct.",
	},
	{
		pattern: "403",
		message: "Permission denied",
		hint: "Check your token has the required permissions.",
	},
	{
		pattern: "invalid",
		message: "Invalid URL format",
		hint: "URL should be mxc:// or localmxc://",
	},
];

export function handleError(error: unknown): never {
	if (!(error instanceof Error)) {
		console.error(kleur.red("Unknown error occurred"));
		process.exit(1);
	}

	const hint = ERROR_HINTS.find((h) => error.message.includes(h.pattern));
	if (hint) {
		console.error(kleur.red(`Error: ${hint.message}`));
		if (hint.hint) console.error(kleur.dim(`   ${hint.hint}`));
	} else {
		console.error(kleur.red(`Error: ${error.message}`));
	}
	process.exit(1);
}
