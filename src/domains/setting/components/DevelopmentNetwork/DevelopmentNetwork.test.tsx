import { translations } from "domains/setting/i18n";
import React from "react";
import { render, screen } from "utils/testing-library";

import { DevelopmentNetwork } from "./DevelopmentNetwork";

describe("DevelopmentNetwork", () => {
	it("should not render if not open", () => {
		const { asFragment } = render(<DevelopmentNetwork isOpen={false} />);

		expect(() => screen.getByTestId("modal__inner")).toThrow(/Unable to find an element by/);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render a modal", () => {
		const { asFragment } = render(<DevelopmentNetwork isOpen={true} />);

		expect(screen.getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_DEVELOPMENT_NETWORK.TITLE);
		expect(screen.getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_DEVELOPMENT_NETWORK.DESCRIPTION);
		expect(asFragment()).toMatchSnapshot();
	});
});
