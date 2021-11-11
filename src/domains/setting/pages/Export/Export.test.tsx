/* eslint-disable @typescript-eslint/require-await */
import { Contracts } from "@payvo/profiles";
import { ExportSettings } from "domains/setting/pages";
import electron from "electron";
import { createMemoryHistory } from "history";
import React from "react";
import { Route } from "react-router-dom";
import { env, fireEvent, getDefaultProfileId, render, waitFor } from "utils/testing-library";

const history = createMemoryHistory();
let profile: Contracts.IProfile;

jest.mock("fs", () => ({
	readFileSync: jest.fn(() => "avatarImage"),
	writeFileSync: jest.fn(),
}));

describe("Export Settings", () => {
	beforeAll(async () => {
		profile = env.profiles().findById(getDefaultProfileId());
		await env.profiles().restore(profile);
		await profile.sync();
	});

	beforeEach(() => {
		history.push(`/profiles/${profile.id()}/settings/export`);
	});

	it("should render export settings", async () => {
		const { container, asFragment } = render(
			<Route path="/profiles/:profileId/settings/export">
				<ExportSettings />
			</Route>,
			{
				routes: [`/profiles/${profile.id()}/settings/export`],
			},
		);

		expect(container).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should export data", async () => {
		const exportingProfile = env.profiles().create("Exporting Profile");

		const dialogMock = jest
			.spyOn(electron.remote.dialog, "showSaveDialog")
			//@ts-ignore
			.mockResolvedValue({ filePath: ["/test.dwe"] });

		const { container, findByTestId } = render(
			<Route path="/profiles/:profileId/settings/export">
				<ExportSettings />
			</Route>,
			{
				routes: [`/profiles/${exportingProfile.id()}/settings/export`],
				withProfileSynchronizer: true,
			},
		);

		expect(container).toBeInTheDocument();

		fireEvent.click(await findByTestId("Export-settings__submit-button"));

		await waitFor(() =>
			expect(dialogMock).toHaveBeenCalledWith({
				defaultPath: `profile-${exportingProfile.id()}.dwe`,
				filters: [{ extensions: ["dwe"], name: "Desktop Wallet Export" }],
			}),
		);

		dialogMock.mockRestore();
	});
});
