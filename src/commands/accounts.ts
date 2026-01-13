import { Command } from "commander";
import kleur from "kleur";
import { getClient } from "../lib/client.js";

export const accountsCommand = new Command("accounts")
	.description("List connected accounts")
	.action(async () => {
		try {
			const client = getClient();
			const accounts = await client.listAccounts();

			if (accounts.length === 0) {
				console.log(kleur.yellow("No accounts connected."));
				console.log(kleur.dim("Make sure Beeper Desktop is running with API enabled."));
				return;
			}

			console.log(kleur.bold(`\n📱 Connected Accounts (${accounts.length})\n`));

			for (const account of accounts) {
				const name = account.user?.fullName || account.user?.displayText || account.accountID;
				const network = kleur.cyan(account.network);
				console.log(`  ${network} ${kleur.bold(name)}`);
				console.log(kleur.dim(`    ID: ${account.accountID}\n`));
			}
		} catch (error) {
			handleError(error);
		}
	});

function handleError(error: unknown): void {
	if (error instanceof Error) {
		if (error.message.includes("ECONNREFUSED")) {
			console.error(kleur.red("❌ Cannot connect to Beeper Desktop API"));
			console.error(kleur.dim("   Make sure Beeper Desktop is running with API enabled."));
			console.error(kleur.dim("   Settings → Developers → Enable Beeper Desktop API"));
		} else {
			console.error(kleur.red(`❌ Error: ${error.message}`));
		}
	} else {
		console.error(kleur.red("❌ Unknown error occurred"));
	}
	process.exit(1);
}
