import path from "path";

import { PluginConfigurationData } from "./plugin-configuration";

describe("Plugin Configuration", () => {
	it("should validate successful", () => {
		const subject = PluginConfigurationData.make({
			keywords: ["@payvo", "wallet-plugin"],
			name: "plugin-test",
		});

		expect(subject.validate()).toBeTruthy();
	});

	it("should fail to validate", () => {
		const subject = PluginConfigurationData.make({ version: 1 });

		expect(() => subject.validate()).toThrow("name is a required field");
	});

	it("should format title with scope", () => {
		const subject = PluginConfigurationData.make({ name: "@payvo/plugin-test" });

		expect(subject.title()).toBe("Plugin Test");
	});

	it("should format title", () => {
		const subject = PluginConfigurationData.make({ name: "plugin-test" });

		expect(subject.title()).toBe("Plugin Test");
	});

	it("should format a custom title", () => {
		const subject = PluginConfigurationData.make({ "desktop-wallet": { title: "My Plugin" }, name: "plugin-test" });

		expect(subject.title()).toBe("My Plugin");
	});

	it("should format id", () => {
		const subject1 = PluginConfigurationData.make({ name: "@payvo/plugin-test" });

		expect(subject1.id()).toBe("@payvo/plugin-test");

		const subject2 = PluginConfigurationData.make({ name: "@payvo/plugin-explorer" });

		expect(subject2.id()).toBe("@payvo/plugin-explorer");
	});

	it("should return author if official scope", () => {
		const subject = PluginConfigurationData.make({ name: "@payvo/plugin-test" });

		expect(subject.author()).toBe("Payvo");
	});

	it("should return unknown author if not defined", () => {
		const subject = PluginConfigurationData.make({ name: "plugin-test" });

		expect(subject.author()).toBe("Unknown");
	});

	it("should return author", () => {
		const subject = PluginConfigurationData.make({ author: "Jhon", name: "plugin-test" });

		expect(subject.author()).toBe("Jhon");
	});

	it("should return author with object", () => {
		const subject = PluginConfigurationData.make({ author: { name: "Jhon" }, name: "plugin-test" });

		expect(subject.author()).toBe("Jhon");
	});

	it("should return author from contributors", () => {
		const subject = PluginConfigurationData.make({ contributors: [{ name: "Jhon" }], name: "plugin-test" });

		expect(subject.author()).toBe("Jhon");
	});

	it("should return author from contributors with array of strings", () => {
		const subject = PluginConfigurationData.make({ contributors: ["Jhon"], name: "plugin-test" });

		expect(subject.author()).toBe("Jhon");
	});

	it("should return default version", () => {
		const subject = PluginConfigurationData.make({ name: "plugin-test" });

		expect(subject.version()).toBe("0.0.0");
	});

	it("should return custom version", () => {
		const subject = PluginConfigurationData.make({ name: "plugin-test", version: "1.2.3" });

		expect(subject.version()).toBe("1.2.3");
	});

	it("should return keywords", () => {
		const subject = PluginConfigurationData.make({
			keywords: ["desktop", "plugin", "desktop-wallet"],
			name: "plugin-test",
		});

		expect(subject.keywords()).toStrictEqual(["Desktop", "Plugin", "Desktop Wallet"]);
	});

	it("should return permissions", () => {
		const subject = PluginConfigurationData.make({
			"desktop-wallet": { permissions: ["LAUNCH", "HTTP"] },
			name: "plugin-test",
		});

		expect(subject.permissions()).toStrictEqual(["LAUNCH", "HTTP"]);
	});

	it("should return only valid permissions", () => {
		const subject = PluginConfigurationData.make({
			"desktop-wallet": { permissions: ["launch", "HTTP", "MY_CUSTOM_PERMISSION"] },
			name: "plugin-test",
		});

		expect(subject.permissions()).toStrictEqual(["LAUNCH", "HTTP"]);
	});

	it("should return urls", () => {
		const subject = PluginConfigurationData.make({
			"desktop-wallet": { urls: ["http://github.com"] },
			name: "plugin-test",
		});

		expect(subject.urls()).toStrictEqual(["http://github.com"]);
	});

	it("should return default category array if not defined", () => {
		const subject = PluginConfigurationData.make({ name: "plugin-test" });

		expect(subject.categories()).toStrictEqual(["other"]);
	});

	it("should return valid categories", () => {
		const subject = PluginConfigurationData.make({
			"desktop-wallet": { categories: ["other", "finance"] },
			name: "plugin-test",
		});

		expect(subject.categories()).toStrictEqual(["other"]);
	});

	it("should return default category array if empty", () => {
		const subject = PluginConfigurationData.make({
			"desktop-wallet": { categories: [] },
			name: "plugin-test",
		});

		expect(subject.categories()).toStrictEqual(["other"]);
	});

	it("should return the first categoriy", () => {
		const categories = ["other", "utility"];

		const subject = PluginConfigurationData.make({
			"desktop-wallet": { categories },
			name: "plugin-test",
		});

		expect(subject.category()).toStrictEqual(categories[0]);
	});

	it("should return plugin size from fs", async () => {
		const subject = PluginConfigurationData.make(
			{ name: "plugin-test" },
			path.resolve("src/tests/fixtures/plugins/packages/plugin-test-custom-buttom"),
		);
		await new Promise((r) => setTimeout(r, 100));

		expect(subject.size()).toBe("0 B");
	});

	it("should return plugin size from package", async () => {
		const subject1 = PluginConfigurationData.make({ name: "plugin-test" });
		const subject2 = PluginConfigurationData.make({ dist: { unpackedSize: 15_000 }, name: "plugin-test" });

		await subject1.syncSize();
		await subject2.syncSize();

		expect(subject1.size()).toBe("0 B");
		expect(subject2.size()).toBe("15 kB");
	});

	it("should return logo", () => {
		const subject = PluginConfigurationData.make({
			logo: "https://raw.githubusercontent.com/ark-ecosystem-desktop-plugins/sound-notifications/master/logo.png",
			name: "plugin-test",
		});

		expect(subject.logo()).toBe(
			"https://raw.githubusercontent.com/ark-ecosystem-desktop-plugins/sound-notifications/master/logo.png",
		);
	});

	it("should return logo from manifest", () => {
		const subject = PluginConfigurationData.make({
			"desktop-wallet": {
				logo:
					"https://raw.githubusercontent.com/ark-ecosystem-desktop-plugins/sound-notifications/master/logo.png",
			},
			name: "plugin-test",
		});

		expect(subject.logo()).toBe(
			"https://raw.githubusercontent.com/ark-ecosystem-desktop-plugins/sound-notifications/master/logo.png",
		);
	});

	it("should not return invalid logo", () => {
		const subject = PluginConfigurationData.make({
			"desktop-wallet": { logo: "https://google.com" },
			name: "plugin-test",
		});

		expect(subject.logo()).toBeUndefined();
	});

	it("should return is not official", () => {
		const subject = PluginConfigurationData.make({});

		expect(subject.isOfficial()).toBe(false);
	});

	it("should return true for existing category", () => {
		const subject = PluginConfigurationData.make({ "desktop-wallet": { categories: ["other"] } });

		expect(subject.hasCategory("other")).toBe(true);
	});

	it("should return to object", () => {
		const subject = PluginConfigurationData.make({
			description: "The Plugin",
			name: "plugin-test",
			version: "0.0.1",
		});

		expect(subject.toObject()).toMatchObject({
			description: "The Plugin",
			name: "plugin-test",
			version: "0.0.1",
		});
	});

	it("should return url from source provider", () => {
		const url = "https://github.com/arkecosystem/my-plugin";
		const subject = PluginConfigurationData.make({ sourceProvider: { url } });

		expect(subject.url()).toBe(url);
	});

	it("should return url from repository field", () => {
		const url = "git+https://github.com/arkecosystem/my-plugin.git";
		const subject = PluginConfigurationData.make({ repository: { type: "git", url } });

		expect(subject.url()).toBe("https://github.com/arkecosystem/my-plugin");
	});

	it("should return url from homepage", () => {
		const url = "https://github.com/arkecosystem/my-plugin#readme";
		const subject = PluginConfigurationData.make({ homepage: url });

		expect(subject.url()).toBe(url);
	});
});
