import { translations } from "domains/plugin/i18n";
import React from "react";
import { render, screen } from "utils/testing-library";

import { ManualInstallationDisclaimer } from "./ManualInstallationDisclaimer";

describe("ManualInstallationDisclaimer", () => {
	it("should not render if not open", () => {
		const { asFragment } = render(<ManualInstallationDisclaimer isOpen={false} />);

		expect(() => screen.getByTestId("modal__inner")).toThrow(/Unable to find an element by/);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render a modal", () => {
		const { asFragment } = render(<ManualInstallationDisclaimer isOpen={true} />);

		expect(screen.getByTestId("modal__inner")).toHaveTextContent(translations.MANUAL_INSTALLATION_DISCLAIMER.TITLE);
		expect(screen.getByTestId("modal__inner")).toHaveTextContent(
			translations.MANUAL_INSTALLATION_DISCLAIMER.DISCLAIMER.replace(/\n\n/g, " "),
		);
		expect(asFragment()).toMatchSnapshot();
	});
});
