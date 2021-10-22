import { Contracts } from "@payvo/profiles";
import { ConfigurationProvider } from "app/contexts";
import { translations as commonTranslations } from "app/i18n/common/i18n";
import { translations } from "domains/profile/i18n";
import React from "react";
import { fireEvent, render } from "testing-library";
import { env, getDefaultProfileId } from "utils/testing-library";

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
		const { asFragment, getByTestId } = render(<Wrapper />);

		expect(() => getByTestId("modal__inner")).toThrow(/Unable to find an element by/);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render a modal if user hasnt completed the tutorial", () => {
		mockHasCompletedTutorial.mockReturnValue(false);

		const { asFragment, getByTestId } = render(<Wrapper />);

		expect(getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_WELCOME.STEP_1_TITLE);
		expect(getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_WELCOME.DONT_SHOW_CHECKBOX_LABEL);
		expect(getByTestId("modal__inner")).toHaveTextContent(commonTranslations.START);
		expect(getByTestId("modal__inner")).toHaveTextContent(commonTranslations.SKIP);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should show navigation buttons according to the step", () => {
		mockHasCompletedTutorial.mockReturnValue(false);

		const { getByTestId } = render(<Wrapper />);

		expect(getByTestId("WelcomeModal-skip")).toBeDefined();
		expect(getByTestId("WelcomeModal-next")).toBeDefined();
		expect(() => getByTestId("DotNavigation")).toThrow(/Unable to find an element by/);
		expect(() => getByTestId("WelcomeModal-finish")).toThrow(/Unable to find an element by/);
		expect(() => getByTestId("WelcomeModal-prev")).toThrow(/Unable to find an element by/);

		// Intermediate steps
		[1, 2, 3].forEach(() => {
			fireEvent.click(getByTestId("WelcomeModal-next"));

			expect(getByTestId("WelcomeModal-next")).toBeDefined();
			expect(getByTestId("WelcomeModal-prev")).toBeDefined();
			expect(getByTestId("DotNavigation")).toBeDefined();
			expect(() => getByTestId("WelcomeModal-finish")).toThrow(/Unable to find an element by/);
			expect(() => getByTestId("WelcomeModal-skip")).toThrow(/Unable to find an element by/);
		});

		// Final step
		fireEvent.click(getByTestId("WelcomeModal-next"));

		expect(getByTestId("WelcomeModal-finish")).toBeDefined();
		expect(getByTestId("WelcomeModal-prev")).toBeDefined();
		expect(getByTestId("DotNavigation")).toBeDefined();
		expect(() => getByTestId("WelcomeModal-next")).toThrow(/Unable to find an element by/);
		expect(() => getByTestId("WelcomeModal-skip")).toThrow(/Unable to find an element by/);
	});

	it("can change the current step with the navigation dots", () => {
		mockHasCompletedTutorial.mockReturnValue(false);

		const { getByTestId } = render(<Wrapper />);

		// Got to first step (to show the navigation dots)
		fireEvent.click(getByTestId("WelcomeModal-next"));

		// Go to final step
		fireEvent.click(getByTestId("DotNavigation-Step-3"));

		expect(getByTestId("WelcomeModal-finish")).toBeDefined();
		expect(getByTestId("WelcomeModal-prev")).toBeDefined();
		expect(getByTestId("DotNavigation")).toBeDefined();
		expect(() => getByTestId("WelcomeModal-next")).toThrow(/Unable to find an element by/);
		expect(() => getByTestId("WelcomeModal-skip")).toThrow(/Unable to find an element by/);
	});
});
