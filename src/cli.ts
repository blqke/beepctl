#!/usr/bin/env node
import { program } from "commander";
import kleur from "kleur";
// Commands
import { accountsCommand } from "./commands/accounts.js";
import { aliasCommand } from "./commands/alias.js";
import { archiveCommand } from "./commands/archive.js";
import { authCommand } from "./commands/auth.js";
import { chatsCommand } from "./commands/chats.js";
import { contactsCommand } from "./commands/contacts.js";
import { downloadCommand } from "./commands/download.js";
import { focusCommand } from "./commands/focus.js";
import { messagesCommand } from "./commands/messages.js";
import { remindersCommand } from "./commands/reminders.js";
import { searchCommand } from "./commands/search.js";
import { sendCommand } from "./commands/send.js";
import { version } from "./version.js";

program
	.name("beep")
	.description(kleur.cyan("CLI for Beeper Desktop API - unified messaging from terminal"))
	.version(version);

// Register commands
program.addCommand(authCommand);
program.addCommand(aliasCommand);
program.addCommand(accountsCommand);
program.addCommand(archiveCommand);
program.addCommand(chatsCommand);
program.addCommand(contactsCommand);
program.addCommand(downloadCommand);
program.addCommand(focusCommand);
program.addCommand(messagesCommand);
program.addCommand(remindersCommand);
program.addCommand(sendCommand);
program.addCommand(searchCommand);

program.parse();
