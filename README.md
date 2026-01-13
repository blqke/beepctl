# beepcli 🐝

CLI for [Beeper Desktop API](https://developers.beeper.com/desktop-api) - unified messaging from your terminal.

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

## Usage

```bash
# Check auth status
beep auth show

# List connected accounts
beep accounts

# List recent chats
beep chats
beep chats --limit 50
beep chats --search "John"

# Search messages
beep search "meeting tomorrow"

# Send a message
beep send <chat-id> "Hello!"
beep send myself "Quick note"  # Send to yourself
beep send <chat-id> "Thanks!" --reply-to <message-id>  # Reply to message
```

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
├── cli.ts           # Entry point
├── index.ts         # Library exports
├── version.ts       # Version info
├── commands/        # CLI commands
│   ├── accounts.ts
│   ├── chats.ts
│   ├── search.ts
│   └── send.ts
└── lib/             # Core logic
    ├── client.ts    # Beeper API client
    └── types.ts     # TypeScript types
```

## Stack

- **TypeScript** with plain `tsc`
- **Commander** for CLI args
- **Kleur** for colors
- **Vitest** for testing
- **Biome** for linting/formatting
- **Bun** for standalone binary compilation

## License

MIT
