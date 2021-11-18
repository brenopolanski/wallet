import userEvent from "@testing-library/user-event";
import { buildTranslations } from "app/i18n/helpers";
import React from "react";
import { render, screen } from "utils/testing-library";

import { PortfolioBreakdownDetails } from "./PortfolioBreakdownDetails";

const translations = buildTranslations();

describe("PortfolioBreakdownDetails", () => {
	it("should render", () => {
		const onClose = jest.fn();

		const { asFragment } = render(
			<PortfolioBreakdownDetails
				assets={[
					{ amount: 60, convertedAmount: 60, label: "ARK", percent: 60 },
					{ amount: 30, convertedAmount: 30, label: "LSK", percent: 30 },
					{ amount: 10, convertedAmount: 10, label: "SOL", percent: 10 },
				]}
				balance={100}
				onClose={onClose}
				exchangeCurrency="USD"
				isOpen={true}
			/>,
		);

		expect(screen.getByTestId("modal__inner")).toBeInTheDocument();
		expect(screen.getByText(translations.DASHBOARD.PORTFOLIO_BREAKDOWN_DETAILS.TITLE)).toBeInTheDocument();

		expect(asFragment()).toMatchSnapshot();

		userEvent.click(screen.getByTestId("modal__close-btn"));

		expect(onClose).toHaveBeenCalledWith(expect.objectContaining({ nativeEvent: expect.any(MouseEvent) }));
	});
});
