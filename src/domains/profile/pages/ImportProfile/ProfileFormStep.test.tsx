/* eslint-disable @typescript-eslint/require-await */
import { Contracts } from "@payvo/sdk-profiles";
import userEvent from "@testing-library/user-event";
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

		const { container, getByTestId } = render(
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

		await waitFor(() => expect(getByTestId("CreateProfile__submit-button")).toHaveAttribute("disabled"));

		expect(container).toMatchSnapshot();
	});

	it("should render profile form with hidden fields", async () => {
		const history = createMemoryHistory();
		history.push(`/profiles/import`);

		const { container, getByTestId } = render(
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

		await waitFor(() => expect(getByTestId("CreateProfile__submit-button")).toHaveAttribute("disabled"));

		expect(container).toMatchSnapshot();
	});

	it("should render profile form with empty profile", async () => {
		const history = createMemoryHistory();
		const emptyProfile = env.profiles().create("test2");
		history.push(`/profiles/import`);

		const { container, getByTestId } = render(
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

		await waitFor(() => expect(getByTestId("CreateProfile__submit-button")).toHaveAttribute("disabled"));

		expect(container).toMatchSnapshot();
	});

	it("should store profile", async () => {
		const emptyProfile = env.profiles().create("test3");
		const { asFragment, getAllByTestId, getByTestId } = render(
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

		await waitFor(() => expect(getByTestId("CreateProfile__submit-button")).toHaveAttribute("disabled"));

		// Upload avatar image
		userEvent.click(getByTestId("SelectProfileImage__upload-button"));

		expect(showOpenDialogMock).toHaveBeenCalledWith(showOpenDialogParameters);

		fireEvent.input(getAllByTestId("Input")[0], { target: { value: "test profile 1" } });

		fireEvent.focus(getByTestId("SelectDropdown__input"));

		userEvent.click(getByTestId("SelectDropdown__option--0"));

		await waitFor(() => {
			expect(getByTestId("CreateProfile__submit-button")).toBeEnabled();
		});

		userEvent.click(getByTestId("CreateProfile__submit-button"));

		expect(emptyProfile.usesPassword()).toBe(false);

		fireEvent.input(getAllByTestId("Input")[0], { target: { value: "test profile 2" } });

		userEvent.click(screen.getByRole("checkbox"));

		userEvent.click(getByTestId("CreateProfile__submit-button"));

		const newProfile = env.profiles().findById(emptyProfile.id());

		await waitFor(() => expect(newProfile.name()).toBe("test profile 2"));

		expect(newProfile.usesPassword()).toBe(false);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should fail password confirmation", async () => {
		const emptyProfile = env.profiles().create("test4");
		const { asFragment, getAllByTestId, getByTestId } = render(
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

		fireEvent.input(getAllByTestId("Input")[0], { target: { value: "asdasdas" } });

		const selectDropdown = getByTestId("SelectDropdown__input");
		fireEvent.focus(selectDropdown);
		userEvent.click(getByTestId("SelectDropdown__option--0"));

		fireEvent.change(getAllByTestId("InputPassword")[0], { target: { value: "753lk6JD!&" } });
		fireEvent.change(getAllByTestId("InputPassword")[1], { target: { value: "753lk6JD!" } });

		await waitFor(() => expect(getByTestId("CreateProfile__submit-button")).toHaveAttribute("disabled"));

		fireEvent.input(getAllByTestId("InputPassword")[1], { target: { value: "753lk6JD!&" } });

		await waitFor(() => expect(getByTestId("CreateProfile__submit-button")).not.toHaveAttribute("disabled"));

		fireEvent.input(getAllByTestId("InputPassword")[0], { target: { value: "753lk6JD!" } });

		await waitFor(() => expect(getByTestId("CreateProfile__submit-button")).toHaveAttribute("disabled"));

		fireEvent.input(getAllByTestId("InputPassword")[1], { target: { value: "753lk6JD!" } });

		await waitFor(() => expect(getByTestId("CreateProfile__submit-button")).not.toHaveAttribute("disabled"));

		expect(asFragment()).toMatchSnapshot();
	});

	it("should update the avatar when removing focus from name input", async () => {
		const emptyProfile = env.profiles().create("test6");
		const shouldUseDarkColorsSpy = jest.spyOn(utils, "shouldUseDarkColors").mockReturnValue(false);

		const { asFragment, getAllByTestId, getByTestId } = render(
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

		await waitFor(() => expect(getByTestId("CreateProfile__submit-button")).toHaveAttribute("disabled"));

		act(() => getAllByTestId("Input")[0].focus());
		fireEvent.blur(getAllByTestId("Input")[0]);

		fireEvent.input(getAllByTestId("Input")[0], { target: { value: "t" } });

		act(() => getAllByTestId("InputPassword")[1].focus());

		expect(getByTestId("SelectProfileImage__avatar-identicon")).toBeInTheDocument();

		fireEvent.input(getAllByTestId("Input")[0], { target: { value: "te" } });

		act(() => getAllByTestId("InputPassword")[0].focus());

		expect(getByTestId("SelectProfileImage__avatar-identicon")).toBeInTheDocument();

		act(() => getAllByTestId("Input")[0].focus());

		fireEvent.input(getAllByTestId("Input")[0], { target: { value: "test profile" } });

		await waitFor(() => {
			expect(getAllByTestId("Input")[0]).toHaveValue("test profile");
		});

		act(() => getAllByTestId("InputPassword")[0].focus());

		expect(getByTestId("SelectProfileImage__avatar-identicon")).toBeInTheDocument();

		expect(asFragment()).toMatchSnapshot();

		act(() => getAllByTestId("Input")[0].focus());

		fireEvent.input(getAllByTestId("Input")[0], { target: { value: "" } });

		await waitFor(() => {
			expect(getAllByTestId("Input")[0]).not.toHaveValue();
		});

		act(() => getAllByTestId("InputPassword")[0].focus());

		expect(() => getByTestId("SelectProfileImage__avatar")).toThrow(/^Unable to find an element by/);

		// Upload avatar image
		userEvent.click(getByTestId("SelectProfileImage__upload-button"));

		expect(() => getByTestId("SelectProfileImage__avatar")).toBeTruthy();

		act(() => getAllByTestId("Input")[0].focus());

		fireEvent.input(getAllByTestId("Input")[0], { target: { value: "t" } });

		await waitFor(() => {
			expect(getAllByTestId("Input")[0]).toHaveValue("t");
		});

		fireEvent.blur(getAllByTestId("Input")[0]);

		expect(asFragment()).toMatchSnapshot();

		shouldUseDarkColorsSpy.mockRestore();
	});
});
