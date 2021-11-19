/* eslint-disable @typescript-eslint/require-await */
import { Contracts } from "@payvo/sdk-profiles";
import userEvent from "@testing-library/user-event";
import { buildTranslations } from "app/i18n/helpers";
import { toasts } from "app/services";
import { PasswordSettings } from "domains/setting/pages";
import { createMemoryHistory } from "history";
import React from "react";
import { Route } from "react-router-dom";
import { env, fireEvent, getDefaultProfileId, render, screen, waitFor } from "utils/testing-library";
const translations = buildTranslations();
const history = createMemoryHistory();

let profile: Contracts.IProfile;

const password = "S3cUrePa$sword";

describe("Password Settings", () => {
	beforeEach(async () => {
		profile = env.profiles().findById(getDefaultProfileId());

		if (profile.usesPassword()) {
			await env.profiles().restore(profile, password);
		} else {
			await env.profiles().restore(profile);
		}

		await profile.sync();

		history.push(`/profiles/${profile.id()}/settings/password`);
	});

	it("should render password settings", async () => {
		const { container, asFragment } = render(
			<Route exact={false} path="/profiles/:profileId/settings/:activeSetting">
				<PasswordSettings />
			</Route>,
			{
				history,
				routes: [`/profiles/${profile.id()}/settings/password`],
			},
		);

		await screen.findByTestId("Password-settings__input--password_1");

		expect(container).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should set a password", async () => {
		const { container, asFragment } = render(
			<Route path="/profiles/:profileId/settings/:activeSetting">
				<PasswordSettings />
			</Route>,
			{
				history,
				routes: [`/profiles/${profile.id()}/settings/password`],
			},
		);

		expect(container).toBeInTheDocument();

		const currentPasswordInput = "Password-settings__input--currentPassword";

		expect(() => screen.getByTestId(currentPasswordInput)).toThrow(/Unable to find an element by/);

		fireEvent.input(screen.getByTestId("Password-settings__input--password_1"), {
			target: { value: password },
		});

		fireEvent.input(screen.getByTestId("Password-settings__input--password_2"), {
			target: { value: password },
		});

		// wait for formState.isValid to be updated
		await screen.findByTestId("Password-settings__submit-button");

		fireEvent.click(screen.getByTestId("Password-settings__submit-button"));

		await screen.findByTestId(currentPasswordInput);

		expect(asFragment()).toMatchSnapshot();
	});

	it("should change a password", async () => {
		profile.auth().setPassword(password);

		render(
			<Route path="/profiles/:profileId/settings/:activeSetting">
				<PasswordSettings />
			</Route>,
			{
				history,
				routes: [`/profiles/${profile.id()}/settings`],
			},
		);

		await waitFor(() => {
			expect(screen.getByTestId("side-menu__item--password")).toBeInTheDocument();
		});

		fireEvent.input(screen.getByTestId("Password-settings__input--currentPassword"), {
			target: { value: password },
		});

		fireEvent.input(screen.getByTestId("Password-settings__input--password_1"), {
			target: { value: "S3cUrePa$sword2different" },
		});

		fireEvent.input(screen.getByTestId("Password-settings__input--password_2"), {
			target: { value: "S3cUrePa$sword2different" },
		});

		await waitFor(() => {
			expect(screen.getByTestId("Password-settings__submit-button")).toBeEnabled();
		});

		fireEvent.click(screen.getByTestId("Password-settings__submit-button"));

		await screen.findByTestId("Password-settings__input--currentPassword");
	});

	it("should show an error toast if the current password does not match", async () => {
		profile.auth().setPassword(password);

		const toastSpy = jest.spyOn(toasts, "error");
		const authMock = jest.spyOn(profile, "auth").mockImplementation(() => {
			throw new Error("mismatch");
		});

		const { asFragment } = render(
			<Route path="/profiles/:profileId/settings/:activeSetting">
				<PasswordSettings />
			</Route>,
			{
				history,
				routes: [`/profiles/${profile.id()}/settings/password`],
			},
		);

		await waitFor(() => {
			expect(screen.getByTestId("side-menu__item--password")).toBeInTheDocument();
		});

		fireEvent.click(await screen.findByTestId("side-menu__item--password"));

		const currentPasswordInput = "Password-settings__input--currentPassword";

		await screen.findByTestId(currentPasswordInput);

		fireEvent.input(screen.getByTestId(currentPasswordInput), { target: { value: "wrong!" } });

		await waitFor(() => {
			expect(screen.getByTestId(currentPasswordInput)).toHaveValue("wrong!");
		});

		fireEvent.input(screen.getByTestId("Password-settings__input--password_1"), {
			target: { value: "AnotherS3cUrePa$swordNew" },
		});

		fireEvent.input(screen.getByTestId("Password-settings__input--password_2"), {
			target: { value: "AnotherS3cUrePa$swordNew" },
		});

		await waitFor(() => {
			expect(screen.getByTestId("Password-settings__submit-button")).toBeEnabled();
		});

		fireEvent.click(screen.getByTestId("Password-settings__submit-button"));

		await waitFor(() => {
			expect(screen.getByTestId("Password-settings__submit-button")).toBeEnabled();
		});

		expect(toastSpy).toHaveBeenCalledWith(`${translations.SETTINGS.PASSWORD.ERROR.MISMATCH}`);

		expect(asFragment()).toMatchSnapshot();

		authMock.mockRestore();
	});

	it("should trigger password confirmation mismatch error", async () => {
		profile.auth().setPassword(password);

		const { asFragment } = render(
			<Route path="/profiles/:profileId/settings/:activeSetting">
				<PasswordSettings />
			</Route>,
			{
				history,
				routes: [`/profiles/${profile.id()}/settings/password`],
			},
		);

		await waitFor(() => {
			expect(screen.getByTestId("side-menu__item--password")).toBeInTheDocument();
		});

		fireEvent.click(screen.getByTestId("side-menu__item--password"));

		const currentPasswordInput = "Password-settings__input--currentPassword";

		await screen.findByTestId(currentPasswordInput);

		fireEvent.input(screen.getByTestId(currentPasswordInput), { target: { value: password } });

		await waitFor(() => {
			expect(screen.getByTestId(currentPasswordInput)).toHaveValue(password);
		});

		fireEvent.input(screen.getByTestId("Password-settings__input--password_1"), {
			target: { value: "S3cUrePa$sword2different" },
		});

		await waitFor(() =>
			expect(screen.getByTestId("Password-settings__input--password_1")).toHaveValue("S3cUrePa$sword2different"),
		);

		fireEvent.input(screen.getByTestId("Password-settings__input--password_2"), {
			target: { value: "S3cUrePa$sword2different1" },
		});

		await waitFor(() =>
			expect(screen.getByTestId("Password-settings__input--password_2")).toHaveValue("S3cUrePa$sword2different1"),
		);

		fireEvent.input(screen.getByTestId("Password-settings__input--password_1"), {
			target: { value: "new password 2" },
		});

		await waitFor(() =>
			expect(screen.getByTestId("Password-settings__input--password_2")).toHaveAttribute("aria-invalid"),
		);
		// wait for formState.isValid to be updated
		await waitFor(() => expect(screen.getByTestId("Password-settings__submit-button")).toBeDisabled());

		expect(asFragment()).toMatchSnapshot();
	});

	it("should not allow setting the current password as the new password", async () => {
		profile.auth().setPassword(password);

		const { asFragment } = render(
			<Route path="/profiles/:profileId/settings/:activeSetting">
				<PasswordSettings />
			</Route>,
			{
				routes: [`/profiles/${profile.id()}/settings/password`],
			},
		);

		await waitFor(() => {
			expect(screen.getByTestId("side-menu__item--password")).toBeInTheDocument();
		});

		fireEvent.click(screen.getByTestId("side-menu__item--password"));

		await screen.findByTestId("Password-settings__input--currentPassword");

		fireEvent.input(screen.getByTestId("Password-settings__input--currentPassword"), {
			target: { value: password },
		});

		await waitFor(() =>
			expect(screen.getByTestId("Password-settings__input--currentPassword")).toHaveValue(password),
		);

		fireEvent.input(screen.getByTestId("Password-settings__input--password_1"), {
			target: { value: password },
		});

		await waitFor(() => expect(screen.getByTestId("Password-settings__input--password_1")).toHaveValue(password));

		await waitFor(() =>
			expect(screen.getByTestId("Password-settings__input--password_1")).toHaveAttribute("aria-invalid"),
		);

		await waitFor(() => expect(screen.getByTestId("Password-settings__submit-button")).toBeDisabled());

		expect(asFragment()).toMatchSnapshot();
	});

	it("should allow to remove the password", async () => {
		profile.auth().setPassword(password);

		const toastSpy = jest.spyOn(toasts, "success");
		const forgetPasswordSpy = jest.spyOn(profile.auth(), "forgetPassword").mockImplementation();

		render(
			<Route path="/profiles/:profileId/settings/:activeSetting">
				<PasswordSettings />
			</Route>,
			{
				routes: [`/profiles/${profile.id()}/settings/password`],
			},
		);

		userEvent.click(screen.getByTestId("side-menu__item--password"));

		expect(screen.getByTestId("Password-settings__remove-button")).toBeInTheDocument();

		userEvent.click(screen.getByTestId("Password-settings__remove-button"));

		expect(screen.getByTestId("PasswordRemovalConfirmModal__input-password")).toBeInTheDocument();

		// Close modal and re-open it.

		userEvent.click(screen.getByTestId("PasswordRemovalConfirmModal__cancel"));

		expect(() => screen.getByTestId("PasswordRemovalConfirmModal__input-password")).toThrow(
			/Unable to find an element by/,
		);

		userEvent.click(screen.getByTestId("Password-settings__remove-button"));

		await screen.findByTestId("PasswordRemovalConfirmModal__input-password");

		// Fill in current password and confirm.

		fireEvent.input(screen.getByTestId("PasswordRemovalConfirmModal__input-password"), {
			target: { value: password },
		});

		await waitFor(() => expect(screen.getByTestId("PasswordRemovalConfirmModal__confirm")).toBeEnabled());

		userEvent.click(screen.getByTestId("PasswordRemovalConfirmModal__confirm"));

		await waitFor(() =>
			expect(() => screen.getByTestId("PasswordRemovalConfirmModal__input-password")).toThrow(
				/Unable to find an element by/,
			),
		);

		expect(forgetPasswordSpy).toHaveBeenCalledWith(password);
		expect(toastSpy).toHaveBeenCalledWith(translations.SETTINGS.PASSWORD.REMOVAL.SUCCESS);

		forgetPasswordSpy.mockRestore();
		toastSpy.mockRestore();
	});

	it("should not allow password removal if current password does not match", async () => {
		profile.auth().setPassword(password);

		const toastSpy = jest.spyOn(toasts, "error");

		jest.spyOn(profile.auth(), "forgetPassword").mockImplementationOnce(() => {
			throw new Error("password mismatch");
		});

		render(
			<Route path="/profiles/:profileId/settings/:activeSetting">
				<PasswordSettings />
			</Route>,
			{
				routes: [`/profiles/${profile.id()}/settings/password`],
			},
		);

		userEvent.click(screen.getByTestId("side-menu__item--password"));

		expect(screen.getByTestId("Password-settings__remove-button")).toBeInTheDocument();

		userEvent.click(screen.getByTestId("Password-settings__remove-button"));

		expect(screen.getByTestId("PasswordRemovalConfirmModal__input-password")).toBeInTheDocument();

		// Fill in wrong current password and confirm.

		fireEvent.input(screen.getByTestId("PasswordRemovalConfirmModal__input-password"), {
			target: { value: "S3cUrePa$swordWrong" },
		});

		await waitFor(() => expect(screen.getByTestId("PasswordRemovalConfirmModal__confirm")).toBeEnabled());

		userEvent.click(screen.getByTestId("PasswordRemovalConfirmModal__confirm"));

		await waitFor(() => expect(toastSpy).toHaveBeenCalledWith(`${translations.SETTINGS.PASSWORD.ERROR.MISMATCH}`));

		toastSpy.mockRestore();
	});
});
