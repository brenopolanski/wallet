import { DateTime } from "@payvo/sdk-intl";
import React from "react";
import { render } from "utils/testing-library";

import { TransactionTimestamp } from "./TransactionTimestamp";

const datetime = DateTime.fromUnix(1_596_213_281);

describe("TransactionTimestamp", () => {
	it("should render", () => {
		const { container } = render(<TransactionTimestamp timestamp={datetime} />);

		expect(container).toHaveTextContent("31.07.2020 4:34 PM");
		expect(container).toMatchSnapshot();
	});
});
