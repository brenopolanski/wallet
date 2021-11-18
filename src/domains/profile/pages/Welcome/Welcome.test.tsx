/* eslint-disable @typescript-eslint/require-await */
import { Contracts } from "@payvo/sdk-profiles";
import { EnvironmentProvider } from "app/contexts";
import { translations as commonTranslations } from "app/i18n/common/i18n";
import { httpClient } from "app/services";
import { translations as profileTranslations } from "domains/profile/i18n";
import React from "react";
import { StubStorage } from "tests/mocks";
import {
	act,
	env,
	fireEvent,
	getDefaultPassword,
	getDefaultProfileId,
	getPasswordProtectedProfileId,
	render,
	screen,
	waitFor,
} from "utils/testing-library";

import { Welcome } from "./Welcome";

const fixtureProfileId = getDefaultProfileId();
const profileDashboardUrl = `/profiles/${fixtureProfileId}/dashboard`;

describe("Welcome", () => {
	it("should render with profiles", () => {
		const { container, asFragment, history } = render(<Welcome />);
		const profile = env.profiles().findById(fixtureProfileId);

		expect(screen.getByText(profileTranslations.PAGE_WELCOME.WITH_PROFILES.TITLE)).toBeInTheDocument();

		expect(container).toBeInTheDocument();

		fireEvent.click(screen.getByText(profile.name()));

		expect(history.location.pathname).toBe(profileDashboardUrl);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should navigate to profile dashboard", () => {
		const { container, asFragment, history } = render(<Welcome />);

		const profile = env.profiles().findById(fixtureProfileId);

		expect(screen.getByText(profileTranslations.PAGE_WELCOME.WITH_PROFILES.TITLE)).toBeInTheDocument();

		expect(container).toBeInTheDocument();

		fireEvent.click(screen.getByText(profile.settings().get(Contracts.ProfileSetting.Name)!));

		expect(history.location.pathname).toBe(`/profiles/${profile.id()}/dashboard`);
		expect(asFragment()).toMatchSnapshot();
	});

	it.each([
		["close", "modal__close-btn"],
		["cancel", "SignIn__cancel-button"],
	])("should open & close sign in modal (%s)", (_, buttonId) => {
		const { container } = render(<Welcome />);

		expect(container).toBeInTheDocument();

		const profile = env.profiles().findById("cba050f1-880f-45f0-9af9-cfe48f406052");

		expect(screen.getByText(profileTranslations.PAGE_WELCOME.WITH_PROFILES.TITLE)).toBeInTheDocument();

		expect(() => screen.getByTestId("modal__inner")).toThrow(/Unable to find an element by/);

		fireEvent.click(screen.getByText(profile.settings().get(Contracts.ProfileSetting.Name)!));

		expect(screen.getByTestId("modal__inner")).toBeInTheDocument();
		expect(screen.getByTestId("modal__inner")).toHaveTextContent(profileTranslations.MODAL_SIGN_IN.TITLE);
		expect(screen.getByTestId("modal__inner")).toHaveTextContent(profileTranslations.MODAL_SIGN_IN.DESCRIPTION);

		fireEvent.click(screen.getByTestId(buttonId));

		expect(() => screen.getByTestId("modal__inner")).toThrow(/Unable to find an element by/);
	});

	it("should navigate to profile dashboard with correct password", async () => {
		const { asFragment, container, history } = render(<Welcome />);

		expect(container).toBeInTheDocument();

		const profile = env.profiles().findById(getPasswordProtectedProfileId());
		await env.profiles().restore(profile, getDefaultPassword());

		expect(screen.getByText(profileTranslations.PAGE_WELCOME.WITH_PROFILES.TITLE)).toBeInTheDocument();

		expect(() => screen.getByTestId("modal__inner")).toThrow(/Unable to find an element by/);

		fireEvent.click(screen.getByText(profile.settings().get(Contracts.ProfileSetting.Name)!));

		expect(screen.getByTestId("modal__inner")).toBeInTheDocument();

		fireEvent.input(screen.getByTestId("SignIn__input--password"), { target: { value: "password" } });

		await waitFor(() => {
			expect(screen.getByTestId("SignIn__submit-button")).toBeEnabled();
		});

		fireEvent.click(screen.getByTestId("SignIn__submit-button"));

		await waitFor(() => {
			expect(history.location.pathname).toBe(`/profiles/${profile.id()}/dashboard`);
		});

		expect(asFragment()).toMatchSnapshot();
	});

	it("should navigate to profile settings with correct password", async () => {
		const { asFragment, container, history } = render(
			<Welcome />,
		);

		expect(container).toBeInTheDocument();

		const profile = env.profiles().findById("cba050f1-880f-45f0-9af9-cfe48f406052");

		expect(screen.getByText(profileTranslations.PAGE_WELCOME.WITH_PROFILES.TITLE)).toBeInTheDocument();

		expect(() => screen.getByTestId("modal__inner")).toThrow(/Unable to find an element by/);

		const profileCardMenu = screen.getAllByTestId("dropdown__toggle")[1];

		fireEvent.click(profileCardMenu);

		const settingsOption = screen.getByTestId("dropdown__option--0");

		expect(settingsOption).toBeInTheDocument();
		expect(settingsOption).toHaveTextContent(commonTranslations.SETTINGS);

		fireEvent.click(settingsOption);

		await screen.findByTestId("modal__inner");

		fireEvent.input(screen.getByTestId("SignIn__input--password"), { target: { value: "password" } });

		// wait for formState.isValid to be updated
		await screen.findByTestId("SignIn__submit-button");

		fireEvent.click(screen.getByTestId("SignIn__submit-button"));

		await waitFor(() => {
			expect(history.location.pathname).toBe(`/profiles/${profile.id()}/settings`);
		});

		expect(asFragment()).toMatchSnapshot();
	});

	it("should navigate to profile settings from profile card menu", async () => {
		const { container, asFragment, history } = render(<Welcome />);

		expect(container).toBeInTheDocument();

		const profile = env.profiles().findById(fixtureProfileId);

		expect(screen.getByText(profileTranslations.PAGE_WELCOME.WITH_PROFILES.TITLE)).toBeInTheDocument();

		const profileCardMenu = screen.getAllByTestId("dropdown__toggle")[0];

		fireEvent.click(profileCardMenu);

		const settingsOption = screen.getByTestId("dropdown__option--0");

		expect(settingsOption).toBeInTheDocument();
		expect(settingsOption).toHaveTextContent(commonTranslations.SETTINGS);

		fireEvent.click(settingsOption);

		await waitFor(() => {
			expect(history.location.pathname).toBe(`/profiles/${profile.id()}/settings`);
		});

		expect(asFragment()).toMatchSnapshot();
	});

	it("should delete profile from profile card menu", async () => {
		render(<Welcome />);

		expect(screen.getByText(profileTranslations.PAGE_WELCOME.WITH_PROFILES.TITLE)).toBeInTheDocument();

		await waitFor(() => expect(screen.getAllByTestId("Card")).toHaveLength(3));

		fireEvent.click(screen.getAllByTestId("dropdown__toggle")[0]);

		const deleteOption = screen.getByTestId("dropdown__option--1");

		expect(deleteOption).toHaveTextContent(commonTranslations.DELETE);

		fireEvent.click(deleteOption);

		await screen.findByTestId("modal__inner");

		fireEvent.click(screen.getByTestId("DeleteResource__submit-button"));

		await waitFor(() => expect(screen.getAllByTestId("Card")).toHaveLength(2));
	});

	it("should not restart the timeout when closing the modal to retry the profile password", async () => {
		jest.useFakeTimers();

		const { container } = render(<Welcome />);

		expect(container).toBeInTheDocument();

		const profile = env.profiles().findById("cba050f1-880f-45f0-9af9-cfe48f406052");

		expect(screen.getByText(profileTranslations.PAGE_WELCOME.WITH_PROFILES.TITLE)).toBeInTheDocument();

		expect(() => screen.getByTestId("modal__inner")).toThrow(/Unable to find an element by/);

		fireEvent.click(screen.getByText(profile.settings().get(Contracts.ProfileSetting.Name)!));

		for (const index of [1, 2, 3]) {
			fireEvent.input(screen.getByTestId("SignIn__input--password"), {
				target: { value: `wrong password ${index}` },
			});

			// wait for form to be updated
			await screen.findByTestId("SignIn__submit-button");

			fireEvent.click(screen.getByTestId("SignIn__submit-button"));

			// wait for form to be updated
			await screen.findByTestId("SignIn__submit-button");
		}

		expect(screen.getByTestId("SignIn__submit-button")).toBeDisabled();
		expect(screen.getByTestId("SignIn__input--password")).toBeDisabled();

		act(() => {
			jest.advanceTimersByTime(15_000);
		});

		// Close
		fireEvent.click(screen.getByTestId("SignIn__cancel-button"));

		// Reopen
		fireEvent.click(screen.getByText(profile.settings().get(Contracts.ProfileSetting.Name)!));

		// Still disabled
		expect(screen.getByTestId("SignIn__submit-button")).toBeDisabled();

		act(() => {
			jest.advanceTimersByTime(50_000);
			jest.clearAllTimers();
		});

		// wait for form to be updated
		await screen.findByTestId("SignIn__submit-button");

		await waitFor(() => expect(screen.getByTestId("Input__error")).toHaveAttribute("data-errortext", "Password invalid"), {
			timeout: 10_000,
		});

		jest.useRealTimers();
	});

	it("should change route to create profile", () => {
		const { container, asFragment, history } = render(<Welcome />);

		expect(container).toBeInTheDocument();

		expect(screen.getByText(profileTranslations.PAGE_WELCOME.WITH_PROFILES.TITLE)).toBeInTheDocument();

		fireEvent.click(screen.getByText(profileTranslations.CREATE_PROFILE));

		expect(history.location.pathname).toBe("/profiles/create");
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render without profiles", () => {
		env.reset({ coins: {}, httpClient, storage: new StubStorage() });

		const { container, asFragment } = render(
			<EnvironmentProvider env={env}>
				<Welcome />
			</EnvironmentProvider>,
		);

		expect(container).toBeInTheDocument();

		expect(screen.getByText(profileTranslations.PAGE_WELCOME.WITHOUT_PROFILES.TITLE)).toBeInTheDocument();

		expect(asFragment()).toMatchSnapshot();
	});
});
