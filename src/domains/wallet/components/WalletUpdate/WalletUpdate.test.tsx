/* eslint-disable @typescript-eslint/require-await */
import * as updaterHook from "app/hooks/use-updater";
import React from "react";
import { fireEvent, render, screen, waitFor } from "utils/testing-library";

import { FirstStep } from "./Step1";
import { SecondStep } from "./Step2";
import { ThirdStep } from "./Step3";
import { WalletUpdate } from "./WalletUpdate";

describe("WalletUpdate", () => {
	it("should not render if not open", () => {
		const { asFragment } = render(<WalletUpdate isOpen={false} />);

		expect(() => screen.getByTestId("modal__inner")).toThrow(/Unable to find an element by/);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render 1st step", () => {
		const { asFragment } = render(<FirstStep />);

		expect(screen.getByTestId("WalletUpdate__first-step")).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render 2nd step", () => {
		const { asFragment } = render(<SecondStep />);

		expect(screen.getByTestId("WalletUpdate__second-step")).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render 2nd step with progress status", () => {
		const { asFragment } = render(<SecondStep percent={20} />);

		expect(screen.getByTestId("WalletUpdate__second-step")).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render 3rd step", () => {
		const { asFragment } = render(<ThirdStep />);

		expect(screen.getByTestId("WalletUpdate__third-step")).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render", async () => {
		const { asFragment } = render(<WalletUpdate isOpen={true} />);
		await screen.findByTestId("WalletUpdate__first-step");

		expect(asFragment()).toMatchSnapshot();
	});

	it("should handle close", async () => {
		const onClose = jest.fn();
		render(<WalletUpdate isOpen={true} onClose={onClose} />);
		await screen.findByTestId("WalletUpdate__first-step");
		fireEvent.click(screen.getByTestId("modal__close-btn"));
		await waitFor(() => expect(onClose).toHaveBeenCalledWith());
	});

	it("should handle cancel", async () => {
		const onCancel = jest.fn();
		render(<WalletUpdate isOpen={true} onCancel={onCancel} />);
		await screen.findByTestId("WalletUpdate__first-step");
		fireEvent.click(screen.getByTestId("WalletUpdate__cancel-button"));
		await waitFor(() => expect(onCancel).toHaveBeenCalledWith());
	});

	it("should handle update", async () => {
		render(<WalletUpdate isOpen={true} />);
		await screen.findByTestId("WalletUpdate__first-step");
		fireEvent.click(screen.getByTestId("WalletUpdate__update-button"));
		await screen.findByTestId("WalletUpdate__second-step");
	});

	it("should handle install", async () => {
		const quitInstall = jest.fn();
		// @ts-ignore
		jest.spyOn(updaterHook, "useUpdater").mockReturnValue({
			downloadStatus: "completed",
			quitInstall,
		});

		render(<WalletUpdate isOpen={true} />);
		fireEvent.click(screen.getByTestId("WalletUpdate__install-button"));
		await waitFor(() => expect(quitInstall).toHaveBeenCalledWith(undefined));
	});
});
