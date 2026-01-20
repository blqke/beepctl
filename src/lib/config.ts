import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export interface BeeperConfig {
	token?: string;
	baseUrl?: string;
	aliases?: Record<string, string>;
}

const CONFIG_DIR = join(homedir(), ".config", "beepcli");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

export function getConfig(): BeeperConfig {
	const envToken = process.env.BEEPER_TOKEN;
	const envUrl = process.env.BEEPER_URL;

	if (envToken || envUrl) {
		return { token: envToken, baseUrl: envUrl };
	}

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
