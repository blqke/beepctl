# beepctl 🐝

[![npm version](https://img.shields.io/npm/v/beepctl.svg)](https://www.npmjs.com/package/beepctl)
[![CI](https://github.com/blqke/beepctl/actions/workflows/ci.yml/badge.svg)](https://github.com/blqke/beepctl/actions/workflows/ci.yml)

CLI for [Beeper Desktop API](https://developers.beeper.com/desktop-api) - unified messaging from your terminal. Give your AI agents the power to chat across all your messaging platforms.

> **Disclaimer:** This is an unofficial project. Not affiliated with, endorsed by, or sponsored by Beeper. The Beeper Desktop API is still in beta — expect breaking changes.

## Requirements

- [Beeper Desktop](https://www.beeper.com/download) v4.1.169+
- Beeper Desktop API enabled (Settings → Developers → Enable)
- Node.js 20+ or Bun

## Installation

```bash
# From npm
npm install -g beepctl

# Or use directly with npx
npx beepctl <command>

# From source
pnpm install
pnpm build
pnpm link --global
```

## Setup

1. Open Beeper Desktop
2. Go to **Settings → Developers**
3. Enable **Beeper Desktop API**
4. Click **"+"** next to "Approved connections" to create a token
5. *(Optional)* Enable **"Allow sensitive actions"** on the token to send messages
6. Configure the CLI:

```bash
beepctl auth set <your-token>
# Or use environment variable
export BEEPER_TOKEN=<your-token>
```

## Configuration

Config stored at `~/.config/beepcli/config.json` with token, base URL, and aliases.

**Precedence:** Environment variables (`BEEPER_TOKEN`, `BEEPER_URL`) override config file.

## Usage

```bash
# Auth management
beepctl auth show           # Check auth status
beepctl auth set <token>    # Set API token
beepctl auth clear          # Clear stored token

# List connected accounts
beepctl accounts

# List recent chats
beepctl chats
beepctl chats --limit 50
beepctl chats --search "John"

# Search messages and chats
beepctl search "meeting tomorrow"
beepctl search "deadline" --limit 10
beepctl search "deadline" --chat work --sender me --after "1d ago"
beepctl search "photo" --media image video
beepctl search "discussion" --chat-type group --before "yesterday"

# Send messages
beepctl send <chat-id> "Hello!"
beepctl send myself "Quick note"  # Send to yourself
beepctl send <chat-id> "Thanks!" --reply-to <message-id>  # Reply to message

# Archive/unarchive chats
beepctl archive <chat-id>              # Archive a chat
beepctl archive <chat-id> --unarchive  # Unarchive a chat
beepctl archive work                   # Use alias to archive

# Alias management (shortcuts for chat IDs)
beepctl alias list                    # List all aliases
beepctl alias add work <chat-id>      # Create alias
beepctl alias show work               # Show alias value
beepctl alias remove work             # Remove alias
beepctl send work "Using alias!"      # Use alias in commands
```

### Search Filters

Filter search results with multiple options:

```bash
# Filter by chat (supports aliases, space or comma-separated)
beepctl search "hello" --chat work family
beepctl search "test" --chat id1,id2,id3

# Filter by time range (relative dates)
beepctl search "meeting" --after "1d ago" --before "1h ago"
beepctl search "report" --after "yesterday"

# Filter by sender
beepctl search "question" --sender me        # Only my messages
beepctl search "update" --sender others      # Messages from others

# Filter by media type
beepctl search "screenshot" --media image
beepctl search "files" --media file link

# Filter by chat type
beepctl search "announcement" --chat-type group
beepctl search "dm" --chat-type single

# Filter by account
beepctl search "slack message" --account <account-id>

# Combine filters
beepctl search "deploy" --chat work --sender others --after "1d ago" --media link

# Include/exclude options
beepctl search "todo" --include-low-priority
beepctl search "important" --exclude-muted
```

**Time formats:** `1h ago`, `2d ago`, `3w ago`, `1mo ago`, `yesterday`, `today`

**Media types:** `any`, `video`, `image`, `link`, `file`

## Development

```bash
# Run in dev mode
pnpm dev -- accounts

# Run tests
pnpm test

# Lint
pnpm lint
pnpm lint:fix

# Build
pnpm build

# Create standalone binary
pnpm binary
```

## Project Structure

```
src/
├── cli.ts           # Entry point - command registration
├── index.ts         # Library exports
├── version.ts       # Version info
├── commands/        # CLI commands
│   ├── auth.ts      # Token management
│   ├── accounts.ts  # List accounts
│   ├── alias.ts     # Alias management
│   ├── archive.ts   # Archive/unarchive chats
│   ├── chats.ts     # Browse chats
│   ├── search.ts    # Search messages/chats
│   └── send.ts      # Send messages
└── lib/             # Core logic
    ├── client.ts    # Beeper API client wrapper
    ├── config.ts    # Config file management (~/.config/beepcli/)
    ├── aliases.ts   # Alias resolution utilities
    └── dates.ts     # Relative date parsing
```

## Stack

- **TypeScript** with plain `tsc`
- **Commander** for CLI framework
- **Kleur** for colors/styling
- **Vitest** for testing
- **Biome** + **oxlint** for linting/formatting
- **Bun** for standalone binary compilation
- **@beeper/desktop-api** SDK

## Acknowledgments

Inspired by [beeper-cli](https://github.com/krausefx/beeper-cli) by [@krausefx](https://github.com/krausefx).

The author uses beepcli alongside [clawdbot](https://github.com/blqke/clawdbot).

## License

MIT
