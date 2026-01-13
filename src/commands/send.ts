import { Command } from "commander";
import kleur from "kleur";
import { getClient } from "../lib/client.js";

export const sendCommand = new Command("send")
	.description("Send a message to a chat")
	.argument("<chat-id>", "Chat ID to send message to")
	.argument("<message>", "Message text to send")
	.option("-d, --dry-run", "Show what would be sent without actually sending")
	.action(async (chatId: string, message: string, options) => {
		try {
			const client = getClient();

			if (options.dryRun) {
				console.log(kleur.yellow("\n🔍 Dry run mode - message NOT sent\n"));
				console.log(`  Chat ID: ${kleur.cyan(chatId)}`);
				console.log(`  Message: ${kleur.green(message)}`);
				return;
			}

			console.log(kleur.dim("Sending message..."));

			const sent = await client.sendMessage(chatId, message);

			console.log(kleur.green("\n✅ Message sent!\n"));
			console.log(`  ID: ${kleur.dim(sent.id)}`);
			console.log(`  To: ${kleur.cyan(chatId)}`);
			console.log(`  Text: ${message}`);
		} catch (error) {
			handleError(error);
		}
	});

function handleError(error: unknown): void {
	if (error instanceof Error) {
		if (error.message.includes("ECONNREFUSED")) {
			console.error(kleur.red("❌ Cannot connect to Beeper Desktop API"));
			console.error(kleur.dim("   Make sure Beeper Desktop is running with API enabled."));
		} else {
			console.error(kleur.red(`❌ Error: ${error.message}`));
		}
	} else {
		console.error(kleur.red("❌ Unknown error occurred"));
	}
	process.exit(1);
}
