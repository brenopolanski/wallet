import Transport, { Observer } from "@ledgerhq/hw-transport";
import { createTransportReplayer, RecordStore } from "@ledgerhq/hw-transport-mocker";
import { LedgerProvider } from "app/contexts/Ledger/Ledger";
import React from "react";
import { act, fireEvent, render } from "utils/testing-library";

import { LedgerWaitingDevice } from "./LedgerWaitingDevice";

const transport: typeof Transport = createTransportReplayer(RecordStore.fromString(""));

describe("LedgerWaitingDevice", () => {
	it("should call the onClose callback if given", () => {
		const onClose = jest.fn();

		const { getByTestId } = render(
			<LedgerProvider transport={transport}>
				<LedgerWaitingDevice isOpen={true} onClose={onClose} />
			</LedgerProvider>,
		);

		act(() => {
			fireEvent.click(getByTestId("modal__close-btn"));
		});

		expect(onClose).toHaveBeenCalled();
	});

	it("should emit true when devices is available", () => {
		const onDeviceAvailable = jest.fn();
		const unsubscribe = jest.fn();
		let observer: Observer<any>;

		const listenSpy = jest.spyOn(transport, "listen").mockImplementationOnce((obv) => {
			observer = obv;
			return { unsubscribe };
		});

		render(
			<LedgerProvider transport={transport}>
				<LedgerWaitingDevice isOpen={true} onDeviceAvailable={onDeviceAvailable} />
			</LedgerProvider>,
		);

		act(() => {
			observer!.next({ descriptor: "", type: "add" });
		});

		expect(onDeviceAvailable).toHaveBeenCalledWith(true);

		listenSpy.mockReset();
	});

	it("should render with custom subtitle", () => {
		const subtitle = "Connect your Ledger Nano S and confirm input";
		const { getByText } = render(
			<LedgerProvider transport={transport}>
				<LedgerWaitingDevice isOpen={true} subtitle={subtitle} />
			</LedgerProvider>,
		);

		expect(getByText(subtitle)).toBeInTheDocument();
	});
});
