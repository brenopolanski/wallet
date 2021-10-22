import resolve from "enhanced-resolve";
import fs from "fs";
import { glob, IOptions } from "glob";
import path from "path";

import { validatePath } from "../../../utils/validate-path";
import { PluginRawInstance } from "../../types";
import * as loaderIpc from "./loader-fs-ipc";

export class PluginLoaderFileSystem {
	readonly #root: string;

	constructor(root: string) {
		this.#root = root;
	}

	static ipc() {
		return loaderIpc;
	}

	remove(dir: string) {
		const fsExtra = require("fs-extra");
		const isValid = validatePath(this.#root, dir);

		if (!isValid) {
			return Promise.reject(`The dir ${dir} cannot be removed.`);
		}

		return fsExtra.remove(dir);
	}

	search(profileId: string): PluginRawInstance[] {
		const paths = this.findPaths(profileId);
		const entries: PluginRawInstance[] = [];

		for (const dir of paths) {
			try {
				const result = this.find(dir);
				entries.push(result!);
			} catch {
				continue;
			}
		}

		return entries;
	}

	find(dir: string) {
		const configPath = path.join(dir, "package.json");
		const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

		let sourcePath: string | false = false;

		try {
			sourcePath = resolve.sync(dir, ".");
		} catch {
			//
		}

		/* istanbul ignore next */
		if (!sourcePath) {
			try {
				sourcePath = resolve.sync(dir, "./src");
			} catch {
				//
			}
		}

		/* istanbul ignore next */
		if (sourcePath) {
			const source = fs.readFileSync(sourcePath, "utf-8");

			return {
				config,
				dir,
				source,
				sourcePath,
			};
		}
	}

	private findPaths(profileId: string) {
		const isDev = require("electron-is-dev");
		const isE2E = process.env.ELECTRON_IS_E2E;

		let manifestGlob = `**/${profileId}/**/package.json`;

		/* istanbul ignore next */
		if (process.env.PLUGINS_DIR) {
			manifestGlob = "**/package.json";
		}

		const files: string[] = [];

		const options: IOptions = {
			absolute: true,
			ignore: "**/node_modules/**/*",
			matchBase: true,
			nodir: true,
		};

		const match = glob.sync(manifestGlob, { ...options, cwd: this.#root });

		files.push(...match);

		/* istanbul ignore next */
		if (isDev || isE2E) {
			const cwd = path.resolve("src/tests/fixtures/plugins/packages");

			const match = glob.sync("**/package.json", { ...options, cwd });

			files.push(...match);
		}

		return files.map((file) => path.dirname(file));
	}
}
