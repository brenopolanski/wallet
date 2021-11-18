import React from "react";
import { Route } from "react-router-dom";
import { fireEvent, render, screen, waitFor } from "utils/testing-library";

import { SyncErrorMessage } from "./ProfileSyncStatusMessage";

describe("SyncErrorMessage", () => {
	const failedNetworkNames = ["ARK Devnet", "ARK Mainnet", "Lisk Devnet"];

	it("should render one failed network", async () => {
		const { container } = render(
			<Route path="/">
				<SyncErrorMessage failedNetworkNames={[failedNetworkNames[0]]} />
			</Route>,
			{
				routes: ["/"],
			},
		);

		await screen.findByText(failedNetworkNames[0]);

		expect(container).toMatchSnapshot();
	});

	it("should render two failed networks", async () => {
		const { container } = render(
			<Route path="/">
				<SyncErrorMessage failedNetworkNames={[failedNetworkNames[0], failedNetworkNames[1]]} />
			</Route>,
			{
				routes: ["/"],
			},
		);

		await screen.findByText(failedNetworkNames[0]);
		await screen.findByText(failedNetworkNames[1]);

		expect(container).toMatchSnapshot();
	});

	it("should render multiple failed networks", async () => {
		const { container } = render(
			<Route path="/">
				<SyncErrorMessage failedNetworkNames={failedNetworkNames} />
			</Route>,
			{
				routes: ["/"],
			},
		);

		await screen.findByText(failedNetworkNames[0]);
		await screen.findByText(failedNetworkNames[1]);

		expect(container).toMatchSnapshot();
	});

	it("should handle retry", async () => {
		const onRetry = jest.fn();
		const { container } = render(
			<Route path="/">
				<SyncErrorMessage failedNetworkNames={failedNetworkNames} onRetry={onRetry} />
			</Route>,
			{
				routes: ["/"],
			},
		);

		await screen.findByText(failedNetworkNames[0]);
		await screen.findByText(failedNetworkNames[1]);
		await screen.findByText(failedNetworkNames[2]);

		fireEvent.click(screen.getByTestId("SyncErrorMessage__retry"));

		await waitFor(() => expect(onRetry).toHaveBeenCalledWith());

		expect(container).toMatchSnapshot();
	});
});
