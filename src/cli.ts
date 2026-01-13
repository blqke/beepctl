#!/usr/bin/env node
import { program } from "commander";
import kleur from "kleur";
// Commands
import { accountsCommand } from "./commands/accounts.js";
import { authCommand } from "./commands/auth.js";
import { chatsCommand } from "./commands/chats.js";
import { searchCommand } from "./commands/search.js";
import { sendCommand } from "./commands/send.js";
import { version } from "./version.js";

program
	.name("beep")
	.description(kleur.cyan("CLI for Beeper Desktop API - unified messaging from terminal"))
	.version(version);

// Register commands
program.addCommand(authCommand);
program.addCommand(accountsCommand);
program.addCommand(chatsCommand);
program.addCommand(sendCommand);
program.addCommand(searchCommand);

program.parse();
