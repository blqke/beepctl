# beepcli 🐝

CLI for [Beeper Desktop API](https://developers.beeper.com/desktop-api) - unified messaging from your terminal. Give your AI agents the power to chat across all your messaging platforms.

## Requirements

- [Beeper Desktop](https://www.beeper.com/download) v4.1.169+
- Beeper Desktop API enabled (Settings → Developers → Enable)
- Node.js 20+ or Bun

## Installation

```bash
# From source
pnpm install
pnpm build
pnpm link --global

# Or run directly
pnpm dev -- <command>
```

## Setup

1. Open Beeper Desktop
2. Go to **Settings → Developers**
3. Enable **Beeper Desktop API**
4. Click **"+"** next to "Approved connections" to create a token
5. Configure the CLI:

```bash
beep auth set <your-token>
# Or use environment variable
export BEEPER_TOKEN=<your-token>
```

## Configuration

Config stored at `~/.config/beepcli/config.json` with token, base URL, and aliases.

**Precedence:** Environment variables (`BEEPER_TOKEN`, `BEEPER_URL`) override config file.

## Usage

```bash
# Auth management
beep auth show           # Check auth status
beep auth set <token>    # Set API token
beep auth clear          # Clear stored token

# List connected accounts
beep accounts

# List recent chats
beep chats
beep chats --limit 50
beep chats --search "John"

# Search messages and chats
beep search "meeting tomorrow"
beep search "deadline" --limit 10
beep search "deadline" --chat work --sender me --after "1d ago"
beep search "photo" --media image video
beep search "discussion" --chat-type group --before "yesterday"

# Send messages
beep send <chat-id> "Hello!"
beep send myself "Quick note"  # Send to yourself
beep send <chat-id> "Thanks!" --reply-to <message-id>  # Reply to message

# Alias management (shortcuts for chat IDs)
beep alias list                    # List all aliases
beep alias add work <chat-id>      # Create alias
beep alias show work               # Show alias value
beep alias remove work             # Remove alias
beep send work "Using alias!"      # Use alias in commands
```

### Search Filters

Filter search results with multiple options:

```bash
# Filter by chat (supports aliases, space or comma-separated)
beep search "hello" --chat work family
beep search "test" --chat id1,id2,id3

# Filter by time range (relative dates)
beep search "meeting" --after "1d ago" --before "1h ago"
beep search "report" --after "yesterday"

# Filter by sender
beep search "question" --sender me        # Only my messages
beep search "update" --sender others      # Messages from others

# Filter by media type
beep search "screenshot" --media image
beep search "files" --media file link

# Filter by chat type
beep search "announcement" --chat-type group
beep search "dm" --chat-type single

# Filter by account
beep search "slack message" --account <account-id>

# Combine filters
beep search "deploy" --chat work --sender others --after "1d ago" --media link

# Include/exclude options
beep search "todo" --include-low-priority
beep search "important" --exclude-muted
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
│   ├── chats.ts     # Browse chats
│   ├── search.ts    # Search messages/chats
│   ├── send.ts      # Send messages
│   └── alias.ts     # Alias management
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

## License

MIT
