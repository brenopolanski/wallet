/* eslint-disable @typescript-eslint/require-await */
import userEvent from "@testing-library/user-event";
import * as updaterHook from "app/hooks/use-updater";
import React from "react";
import { render, waitFor } from "utils/testing-library";

import { FirstStep } from "./Step1";
import { SecondStep } from "./Step2";
import { ThirdStep } from "./Step3";
import { WalletUpdate } from "./WalletUpdate";

describe("WalletUpdate", () => {
	it("should not render if not open", () => {
		const { asFragment, getByTestId } = render(<WalletUpdate isOpen={false} />);

		expect(() => getByTestId("modal__inner")).toThrow(/Unable to find an element by/);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render 1st step", () => {
		const { asFragment, getByTestId } = render(<FirstStep />);

		expect(getByTestId("WalletUpdate__first-step")).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render 2nd step", () => {
		const { asFragment, getByTestId } = render(<SecondStep />);

		expect(getByTestId("WalletUpdate__second-step")).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render 2nd step with progress status", () => {
		const { asFragment, getByTestId } = render(<SecondStep percent={20} />);

		expect(getByTestId("WalletUpdate__second-step")).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render 3rd step", () => {
		const { asFragment, getByTestId } = render(<ThirdStep />);

		expect(getByTestId("WalletUpdate__third-step")).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render", async () => {
		const { asFragment, findByTestId } = render(<WalletUpdate isOpen={true} />);
		await findByTestId("WalletUpdate__first-step");

		expect(asFragment()).toMatchSnapshot();
	});

	it("should handle close", async () => {
		const onClose = jest.fn();
		const { getByTestId, findByTestId } = render(<WalletUpdate isOpen={true} onClose={onClose} />);
		await findByTestId("WalletUpdate__first-step");
		userEvent.click(getByTestId("modal__close-btn"));
		await waitFor(() => expect(onClose).toHaveBeenCalledWith());
	});

	it("should handle cancel", async () => {
		const onCancel = jest.fn();
		const { getByTestId, findByTestId } = render(<WalletUpdate isOpen={true} onCancel={onCancel} />);
		await findByTestId("WalletUpdate__first-step");
		userEvent.click(getByTestId("WalletUpdate__cancel-button"));
		await waitFor(() => expect(onCancel).toHaveBeenCalledWith());
	});

	it("should handle update", async () => {
		const { getByTestId, findByTestId } = render(<WalletUpdate isOpen={true} />);
		await findByTestId("WalletUpdate__first-step");
		userEvent.click(getByTestId("WalletUpdate__update-button"));
		await findByTestId("WalletUpdate__second-step");
	});

	it("should handle install", async () => {
		const quitInstall = jest.fn();
		// @ts-ignore
		jest.spyOn(updaterHook, "useUpdater").mockReturnValue({
			downloadStatus: "completed",
			quitInstall,
		});

		const { getByTestId } = render(<WalletUpdate isOpen={true} />);
		userEvent.click(getByTestId("WalletUpdate__install-button"));
		await waitFor(() => expect(quitInstall).toHaveBeenCalledWith(undefined));
	});
});
