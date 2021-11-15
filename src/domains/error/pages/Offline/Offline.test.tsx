import { translations } from "domains/error/i18n";
import React from "react";
import { render } from "utils/testing-library";

import { Offline } from "./Offline";

describe("Offline", () => {
	it("should render", () => {
		const { container, asFragment, getByTestId } = render(<Offline />);

		expect(container).toBeInTheDocument();
		expect(getByTestId("Offline__text")).toHaveTextContent(translations.OFFLINE.TITLE);
		expect(getByTestId("Offline__text")).toHaveTextContent(translations.OFFLINE.DESCRIPTION);
		expect(asFragment()).toMatchSnapshot();
	});
});
