import { Command } from "commander";
import kleur from "kleur";
import { getClient } from "../lib/client.js";
import { handleError } from "../lib/errors.js";

const SEPARATOR = kleur.dim("─".repeat(50));

export const contactsCommand = new Command("contacts").description("Search contacts");

contactsCommand
	.command("search")
	.description("Search contacts on a specific account")
	.argument("<account-id>", "Account ID to search on")
	.argument("<query>", "Search query")
	.action(async (accountId: string, query: string) => {
		try {
			const client = getClient();
			const result = await client.accounts.contacts.search(accountId, { query });

			if (result.items.length === 0) {
				console.log(kleur.yellow(`No contacts found for "${query}"`));
				return;
			}

			console.log(kleur.bold(`\nContacts matching "${query}" (${result.items.length})`));
			console.log(SEPARATOR);

			for (let i = 0; i < result.items.length; i++) {
				const user = result.items[i];
				const num = kleur.dim(`${i + 1}.`);
				const name = kleur.bold(user.fullName || user.username || user.id);
				const self = user.isSelf ? kleur.cyan(" (you)") : "";
				const blocked = user.cannotMessage ? kleur.red(" [cannot message]") : "";

				console.log(`${num} ${name}${self}${blocked}`);
				console.log(kleur.dim(`   ID: ${user.id}`));

				if (user.username) console.log(kleur.dim(`   @${user.username}`));
				if (user.phoneNumber) console.log(kleur.dim(`   ${user.phoneNumber}`));
				if (user.email) console.log(kleur.dim(`   ${user.email}`));

				if (i < result.items.length - 1) {
					console.log(SEPARATOR);
				}
			}
			console.log();
		} catch (error) {
			handleError(error);
		}
	});
