import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export interface BeeperConfig {
	token?: string;
	baseUrl?: string;
	aliases?: Record<string, string>;
}

const CONFIG_DIR = join(homedir(), ".config", "beepctl");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

// Legacy config path (before rename to beepctl)
const LEGACY_CONFIG_DIR = join(homedir(), ".config", "beepcli");
const LEGACY_CONFIG_FILE = join(LEGACY_CONFIG_DIR, "config.json");

let migrationDone = false;

/**
 * Migrate config from legacy ~/.config/beepcli/ to ~/.config/beepctl/
 * Runs once per process, copies config and removes legacy directory.
 */
function migrateIfNeeded(): void {
	if (migrationDone) return;
	migrationDone = true;

	// Skip if new config already exists or legacy doesn't exist
	if (existsSync(CONFIG_FILE) || !existsSync(LEGACY_CONFIG_FILE)) return;

	try {
		const legacyContent = readFileSync(LEGACY_CONFIG_FILE, "utf-8");
		const config = JSON.parse(legacyContent) as BeeperConfig;

		// Create new config directory and save
		if (!existsSync(CONFIG_DIR)) {
			mkdirSync(CONFIG_DIR, { recursive: true });
		}
		writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));

		// Remove legacy directory
		rmSync(LEGACY_CONFIG_DIR, { recursive: true });

		console.error("Migrated config from ~/.config/beepcli/ to ~/.config/beepctl/");
	} catch {
		// Silent fail - user can manually migrate if needed
	}
}

export function getConfig(): BeeperConfig {
	const envToken = process.env.BEEPER_TOKEN;
	const envUrl = process.env.BEEPER_URL;

	if (envToken || envUrl) {
		return { token: envToken, baseUrl: envUrl };
	}

	// Migrate legacy config if needed
	migrateIfNeeded();

	if (existsSync(CONFIG_FILE)) {
		try {
			const content = readFileSync(CONFIG_FILE, "utf-8");
			return JSON.parse(content) as BeeperConfig;
		} catch {
			return {};
		}
	}

	return {};
}

export function saveConfig(config: BeeperConfig): void {
	if (!existsSync(CONFIG_DIR)) {
		mkdirSync(CONFIG_DIR, { recursive: true });
	}

	writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function getConfigPath(): string {
	return CONFIG_FILE;
}
