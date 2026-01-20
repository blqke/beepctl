# Contributing to beepcli

Thanks for your interest in contributing!

## Prerequisites

- Node.js 20+
- pnpm 10+
- Beeper Desktop running locally

## Setup

```bash
git clone https://github.com/blqke/beepctl.git
cd beepcli
pnpm install
pnpm run build
```

## Development

```bash
# Run in dev mode
pnpm run dev

# Run tests
pnpm test

# Lint code
pnpm run lint

# Type check
pnpm run typecheck
```

## Code Style

This project uses [Biome](https://biomejs.dev/) for formatting and linting, plus [oxlint](https://oxc.rs/docs/guide/usage/linter.html) for additional checks.

Run `pnpm run lint:fix` to auto-fix issues.

## Pull Request Process

1. Fork the repo and create a feature branch
2. Make your changes
3. Ensure tests pass: `pnpm test`
4. Ensure linting passes: `pnpm run lint`
5. Ensure types check: `pnpm run typecheck`
6. Submit PR with clear description

## Commit Conventions

Use conventional commits:

- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation
- `refactor:` code refactoring
- `test:` tests
- `chore:` maintenance

## Reporting Issues

Use GitHub Issues with the provided templates for:
- Bug reports
- Feature requests

## Questions?

Open a discussion or issue on GitHub.
