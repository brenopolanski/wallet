import { Contracts } from "@payvo/sdk-profiles";
import { env, getDefaultProfileId } from "utils/testing-library";

import { container } from "./plugin-container";
import { PluginController } from "./plugin-controller";
import { PluginControllerRepository } from "./plugin-controller-repository";
import { PluginServiceRepository } from "./plugin-service-repository";

describe("Plugin Controller subject", () => {
	let profile: Contracts.IProfile;
	let subject: PluginControllerRepository;

	beforeEach(() => {
		container.set("services", new PluginServiceRepository());
		subject = new PluginControllerRepository();
		profile = env.profiles().findById(getDefaultProfileId());
	});

	afterAll(() => {
		jest.clearAllMocks();
	});

	it("should return all", () => {
		subject.push(new PluginController({ name: "plugin-test" }, () => void 0));

		expect(subject.all()).toHaveLength(1);
	});

	it("should remove by id", () => {
		const plugin = new PluginController({ name: "plugin-test" }, () => void 0);
		subject.push(plugin);

		expect(subject.all()).toHaveLength(1);

		subject.removeById(plugin.config().id(), profile);

		expect(subject.all()).toHaveLength(0);
	});

	it("should filter by category", () => {
		const plugin1 = new PluginController({ name: "plugin-test1" }, () => void 0);
		const plugin2 = new PluginController(
			{ "desktop-wallet": { categories: ["gaming"] }, name: "plugin-test2" },
			() => void 0,
		);
		subject.push(plugin1);
		/* eslint-disable unicorn/no-array-push-push */
		subject.push(plugin2);

		expect(subject.filterByCategory("gaming")).toHaveLength(1);
	});

	it("should check if plugin has filters", () => {
		const plugin = new PluginController({ name: "plugin-test" }, () => void 0);
		plugin.hooks().addFilter("test", "plus", () => 1);
		subject.push(plugin);

		expect(subject.hasFilters("test", "plus")).toBe(true);
	});

	it("should not run all enabled if it is already running", () => {
		const plugin = new PluginController({ name: "plugin-test" }, () => void 0);
		subject.push(plugin);
		subject.runAllEnabled(profile);

		expect(() => subject.runAllEnabled(profile)).toThrow(
			`Profile ${profile.id()} has the plugins running, call #dispose to close them first.`,
		);
	});

	it("should fail to dispose if not running", () => {
		expect(() => subject.dispose()).toThrow("No plugins running, call #boot to run them.");
	});

	it("should dispose", () => {
		const plugin = new PluginController({ name: "plugin-test" }, () => void 0);

		subject.push(plugin);

		plugin.enable(profile);

		subject.runAllEnabled(profile);
		subject.dispose();

		expect(subject.currentProfile()).toBeUndefined();
	});

	it("should fill multiple plugins", () => {
		const consoleMock = jest.spyOn(console, "error").mockImplementation();
		subject.fill([
			{
				config: { keywords: ["@payvo", "wallet-plugin"], name: "plugin1" },
				dir: "/plugin1",
				source: "module.exports = () => void 0",
				sourcePath: "/plugin1/index.js",
			},
			{
				config: {},
				dir: "/plugin2",
				source: "module.exports = () => void 0",
				sourcePath: "/plugin2/index.js",
			},
		]);

		expect(consoleMock).toHaveBeenCalledWith(
			`Failed to parse the plugin from "/plugin2".`,
			"name is a required field",
		);
		expect(subject.all()).toHaveLength(1);
	});
});
