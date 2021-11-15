import { BigNumber } from "@payvo/helpers";
import { translations } from "domains/transaction/i18n";
import React from "react";
import { render } from "utils/testing-library";

import { TransactionStatus } from "./TransactionStatus";

describe("TransactionStatus", () => {
	it("should render when confirmed", () => {
		const { container } = render(
			<TransactionStatus
				// @ts-ignore
				transaction={{
					confirmations: () => BigNumber.ONE,
					isConfirmed: () => true,
				}}
			/>,
		);

		expect(container).toHaveTextContent(translations.CONFIRMED);
		expect(container).not.toHaveTextContent(translations.NOT_YET_CONFIRMED);
		expect(container).toHaveTextContent("circle-check-mark.svg");

		expect(container).toMatchSnapshot();
	});

	it("should render when not confirmed", () => {
		const { container } = render(
			<TransactionStatus
				// @ts-ignore
				transaction={{
					confirmations: () => BigNumber.ONE,
					isConfirmed: () => false,
				}}
			/>,
		);

		expect(container).not.toHaveTextContent(translations.CONFIRMED);
		expect(container).toHaveTextContent(translations.NOT_YET_CONFIRMED);
		expect(container).toHaveTextContent("clock.svg");

		expect(container).toMatchSnapshot();
	});
});
