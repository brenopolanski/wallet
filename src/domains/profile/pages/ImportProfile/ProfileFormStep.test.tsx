/* eslint-disable @typescript-eslint/require-await */
import { Contracts } from "@payvo/sdk-profiles";
import { EnvironmentProvider } from "app/contexts";
import { ImportProfileForm } from "domains/profile/pages/ImportProfile/ProfileFormStep";
import electron from "electron";
import { createMemoryHistory } from "history";
import os from "os";
import React from "react";
import * as utils from "utils/electron-utils";
import { act, env, fireEvent, render, screen, waitFor } from "utils/testing-library";
let profile: Contracts.IProfile;

let showOpenDialogMock: jest.SpyInstance;
const showOpenDialogParameters = {
	defaultPath: os.homedir(),
	filters: [{ extensions: ["png", "jpg", "jpeg", "bmp"], name: "" }],
	properties: ["openFile"],
};

jest.mock("fs", () => ({
	readFileSync: jest.fn(() => "avatarImage"),
}));

describe("Import Profile - Profile Form Step", () => {
	beforeAll(() => {
		profile = env.profiles().first();
	});

	beforeEach(() => {
		//@ts-ignore
		showOpenDialogMock = jest.spyOn(electron.remote.dialog, "showOpenDialog").mockImplementation(() => ({
			filePaths: ["filePath"],
		}));
	});

	it("should render profile form", async () => {
		const history = createMemoryHistory();
		history.push(`/profiles/import`);

		const { container } = render(
			<EnvironmentProvider env={env}>
				<ImportProfileForm
					env={env}
					profile={profile}
					onSubmit={jest.fn()}
					shouldValidate={false}
					onBack={jest.fn()}
				/>
			</EnvironmentProvider>,
		);

		await waitFor(() => expect(screen.getByTestId("CreateProfile__submit-button")).toHaveAttribute("disabled"));

		expect(container).toMatchSnapshot();
	});

	it("should render profile form with hidden fields", async () => {
		const history = createMemoryHistory();
		history.push(`/profiles/import`);

		const { container } = render(
			<EnvironmentProvider env={env}>
				<ImportProfileForm
					env={env}
					profile={profile}
					onSubmit={jest.fn()}
					shouldValidate={false}
					onBack={jest.fn()}
				/>
			</EnvironmentProvider>,
		);

		await waitFor(() => expect(screen.getByTestId("CreateProfile__submit-button")).toHaveAttribute("disabled"));

		expect(container).toMatchSnapshot();
	});

	it("should render profile form with empty profile", async () => {
		const history = createMemoryHistory();
		const emptyProfile = env.profiles().create("test2");
		history.push(`/profiles/import`);

		const { container } = render(
			<EnvironmentProvider env={env}>
				<ImportProfileForm
					env={env}
					profile={emptyProfile}
					onSubmit={jest.fn()}
					shouldValidate={false}
					onBack={jest.fn()}
				/>
			</EnvironmentProvider>,
		);

		await waitFor(() => expect(screen.getByTestId("CreateProfile__submit-button")).toHaveAttribute("disabled"));

		expect(container).toMatchSnapshot();
	});

	it("should store profile", async () => {
		const emptyProfile = env.profiles().create("test3");
		const { asFragment } = render(
			<EnvironmentProvider env={env}>
				<ImportProfileForm
					env={env}
					profile={emptyProfile}
					onSubmit={jest.fn()}
					shouldValidate={false}
					onBack={jest.fn()}
				/>
			</EnvironmentProvider>,
		);

		await waitFor(() => expect(screen.getByTestId("CreateProfile__submit-button")).toHaveAttribute("disabled"));

		// Upload avatar image
		fireEvent.click(screen.getByTestId("SelectProfileImage__upload-button"));

		expect(showOpenDialogMock).toHaveBeenCalledWith(showOpenDialogParameters);

		fireEvent.input(screen.getAllByTestId("Input")[0], { target: { value: "test profile 1" } });

		fireEvent.focus(screen.getByTestId("SelectDropdown__input"));

		fireEvent.click(screen.getByTestId("SelectDropdown__option--0"));

		await waitFor(() => {
			expect(screen.getByTestId("CreateProfile__submit-button")).toBeEnabled();
		});

		fireEvent.click(screen.getByTestId("CreateProfile__submit-button"));

		expect(emptyProfile.usesPassword()).toBe(false);

		fireEvent.input(screen.getAllByTestId("Input")[0], { target: { value: "test profile 2" } });

		fireEvent.click(screen.getByRole("checkbox"));

		fireEvent.click(screen.getByTestId("CreateProfile__submit-button"));

		const newProfile = env.profiles().findById(emptyProfile.id());

		await waitFor(() => expect(newProfile.name()).toBe("test profile 2"));

		expect(newProfile.usesPassword()).toBe(false);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should fail password confirmation", async () => {
		const emptyProfile = env.profiles().create("test4");
		const { asFragment } = render(
			<EnvironmentProvider env={env}>
				<ImportProfileForm
					env={env}
					profile={emptyProfile}
					onSubmit={jest.fn()}
					shouldValidate={false}
					onBack={jest.fn()}
				/>
			</EnvironmentProvider>,
		);

		fireEvent.input(screen.getAllByTestId("Input")[0], { target: { value: "asdasdas" } });

		const selectDropdown = screen.getByTestId("SelectDropdown__input");
		fireEvent.focus(selectDropdown);
		fireEvent.click(screen.getByTestId("SelectDropdown__option--0"));

		fireEvent.change(screen.getAllByTestId("InputPassword")[0], { target: { value: "753lk6JD!&" } });
		fireEvent.change(screen.getAllByTestId("InputPassword")[1], { target: { value: "753lk6JD!" } });

		await waitFor(() => expect(screen.getByTestId("CreateProfile__submit-button")).toHaveAttribute("disabled"));

		fireEvent.input(screen.getAllByTestId("InputPassword")[1], { target: { value: "753lk6JD!&" } });

		await waitFor(() => expect(screen.getByTestId("CreateProfile__submit-button")).not.toHaveAttribute("disabled"));

		fireEvent.input(screen.getAllByTestId("InputPassword")[0], { target: { value: "753lk6JD!" } });

		await waitFor(() => expect(screen.getByTestId("CreateProfile__submit-button")).toHaveAttribute("disabled"));

		fireEvent.input(screen.getAllByTestId("InputPassword")[1], { target: { value: "753lk6JD!" } });

		await waitFor(() => expect(screen.getByTestId("CreateProfile__submit-button")).not.toHaveAttribute("disabled"));

		expect(asFragment()).toMatchSnapshot();
	});

	it("should update the avatar when removing focus from name input", async () => {
		const emptyProfile = env.profiles().create("test6");
		const shouldUseDarkColorsSpy = jest.spyOn(utils, "shouldUseDarkColors").mockReturnValue(false);

		const { asFragment } = render(
			<EnvironmentProvider env={env}>
				<ImportProfileForm
					env={env}
					profile={emptyProfile}
					onSubmit={jest.fn()}
					shouldValidate={true}
					onBack={jest.fn()}
				/>
			</EnvironmentProvider>,
		);

		await waitFor(() => expect(screen.getByTestId("CreateProfile__submit-button")).toHaveAttribute("disabled"));

		act(() => screen.getAllByTestId("Input")[0].focus());
		fireEvent.blur(screen.getAllByTestId("Input")[0]);

		fireEvent.input(screen.getAllByTestId("Input")[0], { target: { value: "t" } });

		act(() => screen.getAllByTestId("InputPassword")[1].focus());

		expect(screen.getByTestId("SelectProfileImage__avatar-identicon")).toBeInTheDocument();

		fireEvent.input(screen.getAllByTestId("Input")[0], { target: { value: "te" } });

		act(() => screen.getAllByTestId("InputPassword")[0].focus());

		expect(screen.getByTestId("SelectProfileImage__avatar-identicon")).toBeInTheDocument();

		act(() => screen.getAllByTestId("Input")[0].focus());

		fireEvent.input(screen.getAllByTestId("Input")[0], { target: { value: "test profile" } });

		await waitFor(() => {
			expect(screen.getAllByTestId("Input")[0]).toHaveValue("test profile");
		});

		act(() => screen.getAllByTestId("InputPassword")[0].focus());

		expect(screen.getByTestId("SelectProfileImage__avatar-identicon")).toBeInTheDocument();

		expect(asFragment()).toMatchSnapshot();

		act(() => screen.getAllByTestId("Input")[0].focus());

		fireEvent.input(screen.getAllByTestId("Input")[0], { target: { value: "" } });

		await waitFor(() => {
			expect(screen.getAllByTestId("Input")[0]).not.toHaveValue();
		});

		act(() => screen.getAllByTestId("InputPassword")[0].focus());

		expect(() => screen.getByTestId("SelectProfileImage__avatar")).toThrow(/^Unable to find an element by/);

		// Upload avatar image
		fireEvent.click(screen.getByTestId("SelectProfileImage__upload-button"));

		expect(() => screen.getByTestId("SelectProfileImage__avatar")).toBeTruthy();

		act(() => screen.getAllByTestId("Input")[0].focus());

		fireEvent.input(screen.getAllByTestId("Input")[0], { target: { value: "t" } });

		await waitFor(() => {
			expect(screen.getAllByTestId("Input")[0]).toHaveValue("t");
		});

		fireEvent.blur(screen.getAllByTestId("Input")[0]);

		expect(asFragment()).toMatchSnapshot();

		shouldUseDarkColorsSpy.mockRestore();
	});
});
