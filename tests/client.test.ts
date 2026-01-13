import { describe, expect, it } from "vitest";
import { BeeperClient } from "../src/lib/client.js";

describe("BeeperClient", () => {
	it("should create client with default URL", () => {
		const client = new BeeperClient();
		expect(client).toBeDefined();
	});

	it("should create client with custom URL", () => {
		const client = new BeeperClient("http://localhost:9999");
		expect(client).toBeDefined();
	});
});
