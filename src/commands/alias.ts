import { Command } from "commander";
import kleur from "kleur";
import { isValidAliasName, isValidChatId } from "../lib/aliases.js";
import { getConfig, saveConfig } from "../lib/config.js";

export const aliasCommand = new Command("alias").description("Manage chat aliases");

// Default action: list aliases
aliasCommand.action(() => {
	listAliases();
});

aliasCommand
	.command("list")
	.description("List all aliases")
	.action(() => {
		listAliases();
	});

aliasCommand
	.command("add")
	.description("Add or update an alias")
	.argument("<name>", "Alias name")
	.argument("<chat-id>", "Chat ID")
	.action((name: string, chatId: string) => {
		// Validate alias name
		if (!isValidAliasName(name)) {
			console.error(
				kleur.red("❌ Alias name must be alphanumeric (underscores allowed, no spaces)"),
			);
			process.exit(1);
		}

		// Validate chat ID
		if (!isValidChatId(chatId)) {
			console.error(kleur.red("❌ Chat ID must start with '!' (e.g., !abc123:beeper.local)"));
			process.exit(1);
		}

		const config = getConfig();
		const aliases = config.aliases || {};

		// Warn if overwriting
		if (aliases[name]) {
			console.log(
				kleur.yellow(`⚠️  Alias '${name}' already exists (${aliases[name]}). Overwriting...`),
			);
		}

		aliases[name] = chatId;
		config.aliases = aliases;
		saveConfig(config);

		console.log(kleur.green(`✅ Alias '${name}' → '${chatId}' saved`));
	});

aliasCommand
	.command("remove")
	.description("Remove an alias")
	.argument("<name>", "Alias name to remove")
	.action((name: string) => {
		const config = getConfig();
		const aliases = config.aliases || {};

		if (!aliases[name]) {
			console.error(kleur.red(`❌ Alias '${name}' not found`));
			process.exit(1);
		}

		delete aliases[name];
		config.aliases = aliases;
		saveConfig(config);

		console.log(kleur.yellow(`🗑️  Alias '${name}' removed`));
	});

aliasCommand
	.command("show")
	.description("Show a specific alias")
	.argument("<name>", "Alias name")
	.action((name: string) => {
		const config = getConfig();
		const aliases = config.aliases || {};

		if (!aliases[name]) {
			console.error(kleur.red(`❌ Alias '${name}' not found`));
			process.exit(1);
		}

		console.log(kleur.bold(`\n📛 Alias: ${name}\n`));
		console.log(`  Chat ID: ${kleur.cyan(aliases[name])}`);
	});

function listAliases(): void {
	const config = getConfig();
	const aliases = config.aliases || {};
	const aliasEntries = Object.entries(aliases);

	if (aliasEntries.length === 0) {
		console.log(kleur.dim("No aliases configured."));
		console.log(kleur.dim("Add one with: beep alias add <name> <chatId>"));
		return;
	}

	console.log(kleur.bold("\n📛 Configured Aliases\n"));

	for (const [name, chatId] of aliasEntries) {
		console.log(`  ${kleur.green(name.padEnd(15))} → ${kleur.cyan(chatId)}`);
	}

	console.log();
}
