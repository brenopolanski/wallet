import { DateTime } from "@payvo/sdk-intl";
import { translations } from "domains/splash/i18n";
import React from "react";
import * as utils from "utils/electron-utils";
import { render, screen } from "utils/testing-library";

import { Splash } from "./Splash";

describe("Splash", () => {
	it.each(["light", "dark"])("should  render  %s theme", (theme) => {
		jest.spyOn(utils, "shouldUseDarkColors").mockImplementation(() => theme === "dark");
		const { container, asFragment } = render(<Splash year="2020" />);

		expect(container).toBeInTheDocument();
		expect(screen.getByTestId("Splash__text")).toHaveTextContent(translations.BRAND);
		expect(screen.getByTestId("Splash__text")).toHaveTextContent(translations.LOADING);

		expect(screen.getByTestId("Splash__footer")).toHaveTextContent(translations.COPYRIGHT);
		expect(screen.getByTestId("Splash__footer")).toHaveTextContent(translations.RIGHTS);
		expect(screen.getByTestId("Splash__footer")).toHaveTextContent(translations.PRODUCT);
		expect(screen.getByTestId("Splash__footer")).toHaveTextContent("2020");
		expect(screen.getByTestId("Splash__footer")).toHaveTextContent(translations.VERSION);

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render without year", () => {
		const { container, asFragment } = render(<Splash />);

		expect(container).toBeInTheDocument();
		expect(screen.getByTestId("Splash__text")).toHaveTextContent(translations.BRAND);
		expect(screen.getByTestId("Splash__text")).toHaveTextContent(translations.LOADING);

		expect(screen.getByTestId("Splash__footer")).toHaveTextContent(translations.COPYRIGHT);
		expect(screen.getByTestId("Splash__footer")).toHaveTextContent(translations.RIGHTS);
		expect(screen.getByTestId("Splash__footer")).toHaveTextContent(translations.PRODUCT);
		expect(screen.getByTestId("Splash__footer")).toHaveTextContent(DateTime.make().format("YYYY"));
		expect(screen.getByTestId("Splash__footer")).toHaveTextContent(translations.VERSION);

		expect(asFragment()).toMatchSnapshot();
	});
});
