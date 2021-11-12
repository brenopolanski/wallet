import { Contracts } from "@payvo/profiles";
import path from "path";
import { env, getDefaultProfileId } from "utils/testing-library";

import { PluginLoaderFileSystem } from "./loader-fs";

jest.mock("electron-is-dev", () => true);

describe("PluginLoaderFileSystem", () => {
	let subject: PluginLoaderFileSystem;
	let root: string;
	let profile: Contracts.IProfile;

	beforeEach(() => {
		profile = env.profiles().findById(getDefaultProfileId());
		root = path.resolve("src/tests/fixtures/plugins/packages");
		subject = new PluginLoaderFileSystem(root);
	});

	afterAll(() => {
		jest.clearAllMocks();
	});

	it("should find manifests file in the folder", () => {
		expect(subject.search(profile.id())).toHaveLength(2);
	});

	it("should not fail on search", () => {
		const pathSpy = jest.spyOn(subject, "find").mockImplementationOnce(() => {
			throw new Error();
		});

		expect(subject.search(profile.id())).toHaveLength(1);

		pathSpy.mockRestore();
	});

	it("should find source directory", () => {
		expect(subject.find("src/tests/fixtures/plugins/packages/plugin-test-custom-button")).toBeDefined();
	});

	it("should remove a valid folder", () => {
		const fsExtra = require("fs-extra");
		const pathValue = "src/tests/fixtures/plugins/packages/plugin-test-custom-button";
		const removeMock = jest.spyOn(fsExtra, "remove").mockImplementation();
		subject.remove(path.resolve(pathValue));

		expect(removeMock).toHaveBeenCalledWith(expect.stringContaining(pathValue));
	});

	it("should not remove an invalid folder", async () => {
		const fsExtra = require("fs-extra");
		jest.spyOn(fsExtra, "remove").mockImplementation();

		const directory = path.resolve("/etc/plugins/plugin-test-custom-button");

		await expect(subject.remove(directory)).rejects.toBe(`The dir ${directory} cannot be removed.`);
	});
});
