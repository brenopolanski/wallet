/* eslint-disable @typescript-eslint/require-await */
import { Networks } from "@payvo/sdk";
import userEvent from "@testing-library/user-event";
import React from "react";
import { env, getDefaultProfileId, getDefaultWalletId, render, waitFor } from "utils/testing-library";

import { ReceiveFunds } from "./ReceiveFunds";

let network: Networks.Network;

describe("ReceiveFunds", () => {
	beforeEach(() => {
		const profile = env.profiles().findById(getDefaultProfileId());
		const wallet = profile.wallets().findById(getDefaultWalletId());
		network = wallet.network();
	});

	it("should render without a wallet name", async () => {
		const { asFragment, queryAllByTestId } = render(<ReceiveFunds isOpen={true} address="abc" network={network} />);

		await waitFor(() => expect(queryAllByTestId("ReceiveFunds__name")).toHaveLength(0));
		await waitFor(() => expect(queryAllByTestId("ReceiveFunds__address")).toHaveLength(1));
		await waitFor(() => expect(queryAllByTestId("ReceiveFunds__qrcode")).toHaveLength(1));

		expect(asFragment()).toMatchSnapshot();
	});

	it("should not render qrcode without an address", async () => {
		// @ts-ignore
		const { asFragment, queryAllByTestId } = render(<ReceiveFunds isOpen={true} network={network} />);

		await waitFor(() => expect(queryAllByTestId("ReceiveFunds__name")).toHaveLength(0));
		await waitFor(() => expect(queryAllByTestId("ReceiveFunds__address")).toHaveLength(1));
		await waitFor(() => expect(queryAllByTestId("ReceiveFunds__qrcode")).toHaveLength(0));

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render with a wallet name", async () => {
		const { asFragment, queryAllByTestId } = render(
			<ReceiveFunds isOpen={true} address="abc" name="My Wallet" network={network} />,
		);

		await waitFor(() => expect(queryAllByTestId("ReceiveFunds__name")).toHaveLength(1));
		await waitFor(() => expect(queryAllByTestId("ReceiveFunds__address")).toHaveLength(1));
		await waitFor(() => expect(queryAllByTestId("ReceiveFunds__qrcode")).toHaveLength(1));

		expect(asFragment()).toMatchSnapshot();
	});

	it("should handle close", async () => {
		const onClose = jest.fn();

		const { getByTestId, queryAllByTestId } = render(
			<ReceiveFunds isOpen={true} address="abc" name="My Wallet" network={network} onClose={onClose} />,
		);

		await waitFor(() => expect(queryAllByTestId("ReceiveFunds__name")).toHaveLength(1));
		await waitFor(() => expect(queryAllByTestId("ReceiveFunds__address")).toHaveLength(1));
		await waitFor(() => expect(queryAllByTestId("ReceiveFunds__qrcode")).toHaveLength(1));

		userEvent.click(getByTestId("modal__close-btn"));

		expect(onClose).toHaveBeenCalledWith(expect.objectContaining({ nativeEvent: expect.any(MouseEvent) }));
	});

	it("should open qr code form", async () => {
		const { getByTestId, queryAllByTestId } = render(
			<ReceiveFunds isOpen={true} address="abc" name="My Wallet" network={network} />,
		);

		await waitFor(() => expect(queryAllByTestId("ReceiveFunds__name")).toHaveLength(1));
		await waitFor(() => expect(queryAllByTestId("ReceiveFunds__address")).toHaveLength(1));
		await waitFor(() => expect(queryAllByTestId("ReceiveFunds__qrcode")).toHaveLength(1));

		userEvent.click(getByTestId("ReceiveFunds__toggle"));

		await waitFor(() => expect(getByTestId("ReceiveFundsForm__amount")).not.toHaveValue());
		await waitFor(() => expect(getByTestId("ReceiveFundsForm__memo")).not.toHaveValue());
	});
});
