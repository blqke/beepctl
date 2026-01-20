import { Command } from "commander";
import kleur from "kleur";
import { getClient } from "../lib/client.js";
import { handleError } from "../lib/errors.js";

export const accountsCommand = new Command("accounts")
	.description("List connected accounts")
	.action(async () => {
		try {
			const client = getClient();
			const accounts = await client.accounts.list();

			if (accounts.length === 0) {
				console.log(kleur.yellow("No accounts connected."));
				console.log(kleur.dim("Make sure Beeper Desktop is running with API enabled."));
				return;
			}

			console.log(kleur.bold(`\nConnected Accounts (${accounts.length})\n`));

			for (const account of accounts) {
				const name = account.user?.fullName || account.user?.username || account.accountID;
				console.log(`  ${kleur.cyan(account.network)} ${kleur.bold(name)}`);
				console.log(kleur.dim(`    ID: ${account.accountID}\n`));
			}
		} catch (error) {
			handleError(error);
		}
	});
