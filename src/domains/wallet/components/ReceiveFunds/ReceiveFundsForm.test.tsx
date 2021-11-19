/* eslint-disable @typescript-eslint/require-await */
import { Networks } from "@payvo/sdk";
import userEvent from "@testing-library/user-event";
import React from "react";
import {
	env,
	getDefaultProfileId,
	getDefaultWalletId,
	renderWithForm,
	waitFor,
} from "utils/testing-library";

import { ReceiveFundsForm } from "./ReceiveFundsForm";

let network: Networks.Network;

describe("ReceiveFundsForm", () => {
	beforeEach(() => {
		const profile = env.profiles().findById(getDefaultProfileId());
		const wallet = profile.wallets().findById(getDefaultWalletId());
		network = wallet.network();
	});

	it("should render", async () => {
		const { asFragment, getByTestId } = renderWithForm(<ReceiveFundsForm network={network} />);

		await waitFor(() => expect(getByTestId("ReceiveFundsForm__amount")).not.toHaveValue());
		await waitFor(() => expect(getByTestId("ReceiveFundsForm__memo")).not.toHaveValue());

		expect(asFragment()).toMatchSnapshot();
	});

	it("should emit amount onChange event", async () => {
		const { asFragment, getByTestId, form } = renderWithForm(<ReceiveFundsForm network={network} />);

		await waitFor(() => expect(getByTestId("ReceiveFundsForm__amount")).not.toHaveValue());

		userEvent.paste(getByTestId("ReceiveFundsForm__amount"), "10");

		await waitFor(() => expect(form()?.getValues("amount")).toBe("10"));

		expect(asFragment()).toMatchSnapshot();
	});

	it("should emit memo onChange event", async () => {
		const { asFragment, getByTestId, form } = renderWithForm(<ReceiveFundsForm network={network} />);
		await waitFor(() => expect(getByTestId("ReceiveFundsForm__memo")).not.toHaveValue());

		userEvent.paste(getByTestId("ReceiveFundsForm__memo"), "test");
		await waitFor(() => expect(form()?.getValues("memo")).toBe("test"));
		await waitFor(() => expect(getByTestId("ReceiveFundsForm__memo")).toHaveValue("test"));

		expect(asFragment()).toMatchSnapshot();
	});

	it("should not show memo if is not supported by network", async () => {
		const memo = Array.from({ length: 256 }).fill("x").join("");

		const memoMock = jest.spyOn(network, "usesMemo").mockReturnValue(false);

		const { asFragment, getByTestId } = renderWithForm(<ReceiveFundsForm network={network} />, {
			defaultValues: { memo },
		});

		expect(() => getByTestId("ReceiveFundsForm__memo")).toThrow(/Unable to find an element by/);

		expect(asFragment()).toMatchSnapshot();

		memoMock.mockRestore();
	});
});
