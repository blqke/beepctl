#!/usr/bin/env node
import { program } from "commander";
import kleur from "kleur";

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
	.name("beepctl")
	.description(kleur.cyan("CLI for Beeper Desktop API - unified messaging from terminal"))
	.version(version)
	.addCommand(authCommand)
	.addCommand(aliasCommand)
	.addCommand(accountsCommand)
	.addCommand(archiveCommand)
	.addCommand(chatsCommand)
	.addCommand(contactsCommand)
	.addCommand(downloadCommand)
	.addCommand(focusCommand)
	.addCommand(messagesCommand)
	.addCommand(remindersCommand)
	.addCommand(sendCommand)
	.addCommand(searchCommand)
	.parse();
