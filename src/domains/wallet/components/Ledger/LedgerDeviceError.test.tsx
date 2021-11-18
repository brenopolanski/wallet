import { Contracts } from "@payvo/sdk-profiles";
import React from "react";
import { fireEvent, render, screen } from "utils/testing-library";

import { LedgerDeviceError } from "./LedgerDeviceError";

describe("LedgerDeviceError", () => {
	it("should call the onClose callback if given", () => {
		const onClose = jest.fn();

		render(
			<LedgerDeviceError
				isOpen={true}
				onClose={onClose}
				supportedModel={Contracts.WalletLedgerModel.NanoX}
				connectedModel={Contracts.WalletLedgerModel.NanoS}
			/>,
		);

		fireEvent.click(screen.getByTestId("modal__close-btn"));

		expect(onClose).toHaveBeenCalledWith();
	});

	it("should render with custom subtitle", () => {
		const subtitle = "Connect your Ledger Nano S and confirm input";
		render(
			<LedgerDeviceError
				isOpen={true}
				supportedModel={Contracts.WalletLedgerModel.NanoX}
				connectedModel={Contracts.WalletLedgerModel.NanoS}
				subtitle={subtitle}
			/>,
		);

		expect(screen.getByText(subtitle)).toBeInTheDocument();
	});
});
