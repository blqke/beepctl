import { describe, expect, it, vi } from "vitest";
import { BeeperDesktop } from "../src/index.js";

vi.mock("../src/lib/config.js", () => ({
	getConfig: () => ({ token: "test-token", baseUrl: "http://localhost:8787" }),
}));

describe("BeeperClient", () => {
	it("should create client with getClient()", async () => {
		const { getClient } = await import("../src/index.js");
		const client = getClient();
		expect(client).toBeDefined();
		expect(client).toBeInstanceOf(BeeperDesktop);
	});

	it("should export BeeperDesktop class", () => {
		expect(BeeperDesktop).toBeDefined();
	});
});
