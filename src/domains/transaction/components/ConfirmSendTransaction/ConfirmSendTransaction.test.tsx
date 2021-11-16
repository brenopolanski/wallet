import { Contracts } from "@payvo/profiles";
import userEvent from "@testing-library/user-event";
import React from "react";
import { env, getDefaultProfileId, render, screen } from "utils/testing-library";

import { ConfirmSendTransaction } from "./ConfirmSendTransaction";

let profile: Contracts.IProfile;

describe("ConfirmSendTransaction", () => {
	beforeAll(() => {
		profile = env.profiles().findById(getDefaultProfileId());
	});

	it("should not render if not open", () => {
		const { asFragment } = render(
			<ConfirmSendTransaction isOpen={false} profile={profile} unconfirmedTransactions={[]} />,
		);

		expect(() => screen.getByTestId("modal__inner")).toThrow(/Unable to find an element by/);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render modal", () => {
		const { asFragment } = render(
			<ConfirmSendTransaction isOpen={true} profile={profile} unconfirmedTransactions={[]} />,
		);

		expect(screen.getByTestId("modal__inner")).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should confirm", () => {
		const onConfirm = jest.fn();
		render(
			<ConfirmSendTransaction
				isOpen={true}
				profile={profile}
				unconfirmedTransactions={[]}
				onConfirm={onConfirm}
			/>,
		);

		expect(screen.getByTestId("modal__inner")).toBeInTheDocument();

		userEvent.click(screen.getByTestId("ConfirmSendTransaction__confirm"));

		expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ nativeEvent: expect.any(MouseEvent) }));
	});

	it("should cancel", () => {
		const onCancel = jest.fn();
		render(
			<ConfirmSendTransaction isOpen={true} profile={profile} unconfirmedTransactions={[]} onClose={onCancel} />,
		);

		expect(screen.getByTestId("modal__inner")).toBeInTheDocument();

		userEvent.click(screen.getByTestId("ConfirmSendTransaction__cancel"));

		expect(onCancel).toHaveBeenCalledWith(expect.objectContaining({ nativeEvent: expect.any(MouseEvent) }));
	});
});
