/* eslint-disable @typescript-eslint/no-var-requires */
const { Menu, shell } = require("electron");
const aboutWindow = require("about-window").default;
const path = require("path");
const packageJson = require("../../package.json");

const isProduction = process.env.NODE_ENV === "production";

const githubRepositoryUrl = () => {
	const [, project] = packageJson.repository.url.match(/github.com\/(.*)\.git$/);
	return `https://github.com/${project}`;
};

const latestReleaseUrl = `${githubRepositoryUrl()}/releases/latest`;
const homepageUrl = `${githubRepositoryUrl()}#readme`;

module.exports = function () {
	const about = {
		click: () =>
			aboutWindow({
				adjust_window_size: true,
				copyright: [`<p style="text-align: center">Distributed under ${packageJson.license} license</p>`],
				css_path: isProduction ? path.resolve(__dirname, "styles.css") : null,
				homepage: homepageUrl,
				icon_path: isProduction
					? path.resolve(__dirname, "../static/512x512.png")
					: path.resolve(__dirname, "../app/assets/icons/512x512.png"),
				package_json_dir: path.resolve(__dirname, "../../"),
				use_inner_html: true,
			}),
		label: "About",
	};

	const template = [
		{
			label: "File",
			submenu: [{ role: "quit" }],
		},
		{
			label: "Edit",
			submenu: [
				{ role: "undo" },
				{ role: "redo" },
				{ type: "separator" },
				{ role: "cut" },
				{ role: "copy" },
				{ role: "paste" },
				{ role: "pasteandmatchstyle" },
				{ role: "delete" },
				{ role: "selectall" },
			],
		},
		{
			label: "View",
			submenu: [
				{ role: "reload" },
				{ role: "forceReload" },
				{ role: "toggledevtools" },
				{ type: "separator" },
				{ role: "resetzoom" },
				{ role: "zoomin" },
				{ role: "zoomout" },
				{ type: "separator" },
				{ role: "togglefullscreen" },
			],
		},
		{
			role: "window",
			submenu: [{ role: "minimize" }, { role: "close" }],
		},
		{
			role: "help",
			submenu: [
				{
					click() {
						shell.openExternal("https://payvo.com");
					},
					label: "Learn More",
				},
				{
					click() {
						shell.openExternal(latestReleaseUrl);
					},
					label: `Version ${packageJson.version}`,
				},
			],
		},
	];

	if (process.platform === "darwin") {
		// File menu
		template[0] = {
			role: "appMenu",
			submenu: [
				about,
				{ type: "separator" },
				{ type: "separator" },
				{ role: "services", submenu: [] },
				{ type: "separator" },
				{
					label: "Hide",
					role: "hide",
				},
				{ role: "hideothers" },
				{ role: "unhide" },
				{ type: "separator" },
				{
					label: "Quit",
					role: "quit",
				},
			],
		};

		// Edit menu
		template[1].submenu.push(
			{ type: "separator" },
			{
				label: "Speech",
				submenu: [{ role: "startspeaking" }, { role: "stopspeaking" }],
			},
		);

		// Window menu
		template[3].submenu = [
			{ role: "close" },
			{ role: "minimize" },
			{ role: "zoom" },
			{ type: "separator" },
			{ role: "front" },
		];
	} else {
		template[4].submenu.unshift(about, { type: "separator" });
	}

	Menu.setApplicationMenu(Menu.buildFromTemplate(template));
};
