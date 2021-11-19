import { Contracts } from "@payvo/sdk-profiles";
import { ConfigurationProvider } from "app/contexts";
import { translations as commonTranslations } from "app/i18n/common/i18n";
import { translations } from "domains/profile/i18n";
import React from "react";
import { env, fireEvent, getDefaultProfileId, render, screen } from "utils/testing-library";

import { WelcomeModal } from "./WelcomeModal";

let profile: Contracts.IProfile;
let mockHasCompletedTutorial: jest.SpyInstance<boolean, []>;

const Wrapper = () => (
	<ConfigurationProvider defaultConfiguration={{ profileIsSyncing: false }}>
		<WelcomeModal profile={profile} environment={env} />
	</ConfigurationProvider>
);

describe("WelcomeModal", () => {
	beforeAll(() => {
		profile = env.profiles().findById(getDefaultProfileId());
	});

	beforeEach(() => {
		mockHasCompletedTutorial = jest.spyOn(profile, "hasCompletedIntroductoryTutorial");
	});

	afterEach(() => {
		mockHasCompletedTutorial.mockRestore();
	});

	it("should not render if user completed the tutorial", () => {
		mockHasCompletedTutorial.mockReturnValue(true);
		const { asFragment } = render(<Wrapper />);

		expect(() => screen.getByTestId("modal__inner")).toThrow(/Unable to find an element by/);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render a modal if user hasnt completed the tutorial", () => {
		mockHasCompletedTutorial.mockReturnValue(false);

		const { asFragment } = render(<Wrapper />);

		expect(screen.getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_WELCOME.STEP_1_TITLE);
		expect(screen.getByTestId("modal__inner")).toHaveTextContent(
			translations.MODAL_WELCOME.DONT_SHOW_CHECKBOX_LABEL,
		);
		expect(screen.getByTestId("modal__inner")).toHaveTextContent(commonTranslations.START);
		expect(screen.getByTestId("modal__inner")).toHaveTextContent(commonTranslations.SKIP);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should show navigation buttons according to the step", () => {
		mockHasCompletedTutorial.mockReturnValue(false);

		render(<Wrapper />);

		expect(screen.getByTestId("WelcomeModal-skip")).toBeDefined();
		expect(screen.getByTestId("WelcomeModal-next")).toBeDefined();
		expect(() => screen.getByTestId("DotNavigation")).toThrow(/Unable to find an element by/);
		expect(() => screen.getByTestId("WelcomeModal-finish")).toThrow(/Unable to find an element by/);
		expect(() => screen.getByTestId("WelcomeModal-prev")).toThrow(/Unable to find an element by/);

		// Intermediate steps
		[1, 2, 3].forEach(() => {
			fireEvent.click(screen.getByTestId("WelcomeModal-next"));

			expect(screen.getByTestId("WelcomeModal-next")).toBeDefined();
			expect(screen.getByTestId("WelcomeModal-prev")).toBeDefined();
			expect(screen.getByTestId("DotNavigation")).toBeDefined();
			expect(() => screen.getByTestId("WelcomeModal-finish")).toThrow(/Unable to find an element by/);
			expect(() => screen.getByTestId("WelcomeModal-skip")).toThrow(/Unable to find an element by/);
		});

		// Final step
		fireEvent.click(screen.getByTestId("WelcomeModal-next"));

		expect(screen.getByTestId("WelcomeModal-finish")).toBeDefined();
		expect(screen.getByTestId("WelcomeModal-prev")).toBeDefined();
		expect(screen.getByTestId("DotNavigation")).toBeDefined();
		expect(() => screen.getByTestId("WelcomeModal-next")).toThrow(/Unable to find an element by/);
		expect(() => screen.getByTestId("WelcomeModal-skip")).toThrow(/Unable to find an element by/);
	});

	it("can change the current step with the navigation dots", () => {
		mockHasCompletedTutorial.mockReturnValue(false);

		render(<Wrapper />);

		// Got to first step (to show the navigation dots)
		fireEvent.click(screen.getByTestId("WelcomeModal-next"));

		// Go to final step
		fireEvent.click(screen.getByTestId("DotNavigation-Step-3"));

		expect(screen.getByTestId("WelcomeModal-finish")).toBeDefined();
		expect(screen.getByTestId("WelcomeModal-prev")).toBeDefined();
		expect(screen.getByTestId("DotNavigation")).toBeDefined();
		expect(() => screen.getByTestId("WelcomeModal-next")).toThrow(/Unable to find an element by/);
		expect(() => screen.getByTestId("WelcomeModal-skip")).toThrow(/Unable to find an element by/);
	});
});
