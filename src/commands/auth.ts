import { Command } from "commander";
import kleur from "kleur";
import { getConfig, getConfigPath, saveConfig } from "../lib/config.js";

export const authCommand = new Command("auth").description("Configure authentication");

authCommand
	.command("set")
	.description("Set your Beeper API token")
	.argument("<token>", "Your Beeper API token")
	.action((token: string) => {
		const config = getConfig();
		config.token = token;
		saveConfig(config);
		console.log(kleur.green("✅ Token saved!"));
		console.log(kleur.dim(`   Config: ${getConfigPath()}`));
	});

authCommand
	.command("show")
	.description("Show current configuration")
	.action(() => {
		const config = getConfig();

		console.log(kleur.bold("\n Beeper CLI Configuration\n"));

		// Display token status
		if (process.env.BEEPER_TOKEN) {
			console.log(`  Token: ${kleur.green("set")} ${kleur.dim("(from BEEPER_TOKEN env)")}`);
		} else if (config.token) {
			const masked = `${config.token.slice(0, 8)}...${config.token.slice(-4)}`;
			console.log(`  Token: ${kleur.green(masked)}`);
		} else {
			console.log(`  Token: ${kleur.red("not set")}`);
		}

		// Display URL with source indication
		let url: string;
		let urlSource: string;
		if (process.env.BEEPER_URL) {
			url = process.env.BEEPER_URL;
			urlSource = "(from BEEPER_URL env)";
		} else if (config.baseUrl) {
			url = config.baseUrl;
			urlSource = "";
		} else {
			url = "http://localhost:23373";
			urlSource = "(default)";
		}
		console.log(`  URL:   ${kleur.cyan(url)} ${kleur.dim(urlSource)}`);

		console.log(kleur.dim(`\n  Config file: ${getConfigPath()}`));
	});

authCommand
	.command("clear")
	.description("Clear saved token")
	.action(() => {
		saveConfig({});
		console.log(kleur.yellow("🗑️  Token cleared"));
	});
