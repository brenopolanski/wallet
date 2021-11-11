import React from "react";
import { fireEvent, render } from "utils/testing-library";

import { LedgerWaitingApp } from "./LedgerWaitingApp";

describe("LedgerWaitingApp", () => {
	it("should call the onClose callback if given", () => {
		const onClose = jest.fn();

		const { getByTestId } = render(<LedgerWaitingApp isOpen={true} coinName="ARK" onClose={onClose} />);

		fireEvent.click(getByTestId("modal__close-btn"));

		expect(onClose).toHaveBeenCalledWith();
	});

	it("should render with custom subtitle", () => {
		const subtitle = "Connect your Ledger Nano S and confirm input";
		const { getByText } = render(<LedgerWaitingApp isOpen={true} coinName="ARK" subtitle={subtitle} />);

		expect(getByText(subtitle)).toBeInTheDocument();
	});
});
