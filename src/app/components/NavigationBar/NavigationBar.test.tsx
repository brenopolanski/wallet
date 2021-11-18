/* eslint-disable @typescript-eslint/require-await */
import { Contracts } from "@payvo/sdk-profiles";
import * as navigation from "app/constants/navigation";
import * as environmentHooks from "app/hooks/env";
import * as useScrollHook from "app/hooks/use-scroll";
import { createMemoryHistory } from "history";
import React from "react";
import { Route } from "react-router-dom";
import { env as mockedTestEnvironment, fireEvent, getDefaultProfileId, render, screen, waitFor } from "utils/testing-library";

import { NavigationBar } from "./NavigationBar";

const dashboardURL = `/profiles/${getDefaultProfileId()}/dashboard`;
const history = createMemoryHistory();

jest.spyOn(environmentHooks, "useActiveProfile").mockImplementation(() =>
	mockedTestEnvironment.profiles().findById(getDefaultProfileId()),
);

jest.spyOn(navigation, "getNavigationMenu").mockReturnValue([
	{
		mountPath: (profileId: string) => `/profiles/${profileId}/dashboard`,
		title: "Portfolio",
	},
	{
		mountPath: () => "/test",
		title: "test",
	},
]);

describe("NavigationBar", () => {
	beforeAll(async () => {
		history.push(dashboardURL);
	});

	it.each([true, false])("should render full variant when profile restored is %s", (isRestored) => {
		const isRestoredMock = jest
			.spyOn(mockedTestEnvironment.profiles().findById(getDefaultProfileId()).status(), "isRestored")
			.mockReturnValue(isRestored);

		const { container, asFragment } = render(<NavigationBar />);

		expect(container).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();

		isRestoredMock.mockRestore();
	});

	it("should render as logo-only variant", () => {
		const { container, asFragment } = render(<NavigationBar variant="logo-only" />);

		expect(container).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render with shadow if there is a scroll", () => {
		const scrollSpy = jest.spyOn(useScrollHook, "useScroll").mockImplementation(() => 1);

		const { container, asFragment } = render(<NavigationBar />);

		expect(container).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();

		scrollSpy.mockRestore();
	});

	it("should render with title", () => {
		const title = "Desktop Wallet";

		const { container, asFragment } = render(<NavigationBar title={title} />);

		expect(container).toBeInTheDocument();
		expect(container).toHaveTextContent(title);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render with custom menu", () => {
		const { container, asFragment } = render(<NavigationBar />);

		expect(container).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should handle menu click", () => {
		const { history } = render(<NavigationBar />);

		fireEvent.click(screen.getByText("test"));

		expect(history.location.pathname).toBe("/test");
	});

	it("should open user actions dropdown on click", () => {
		const getUserInfoActionsMock = jest.spyOn(navigation, "getUserInfoActions").mockReturnValue([
			{ label: "Option 1", mountPath: () => "/test", title: "test", value: "/test" },
			{ label: "Option 2", mountPath: () => "/test2", title: "test2", value: "/test2" },
		]);

		const { history } = render(<NavigationBar />);
		const toggle = screen.getByTestId("navbar__useractions");

		fireEvent.click(toggle);

		expect(screen.getByText("Option 1")).toBeInTheDocument();

		fireEvent.click(screen.getByText("Option 1"));

		expect(history.location.pathname).toBe("/test");

		getUserInfoActionsMock.mockRestore();
	});

	it("should handle click to send button", () => {
		const mockProfile = environmentHooks.useActiveProfile();
		const { history } = render(<NavigationBar />);

		const sendButton = screen.getByTestId("navbar__buttons--send");

		fireEvent.click(sendButton);

		expect(history.location.pathname).toBe(`/profiles/${mockProfile.id()}/send-transfer`);
	});

	it("should handle receive funds", async () => {
		render(
			<Route path="/profiles/:profileId/dashboard">
				<NavigationBar />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		fireEvent.click(screen.getByTestId("navbar__buttons--receive"));

		await expect(screen.findByTestId("modal__inner")).resolves.toHaveTextContent("Select Account");

		fireEvent.click(screen.getAllByText("Select")[0]);

		await screen.findByTestId("ReceiveFunds__name");
		await screen.findByTestId("ReceiveFunds__address");
		await waitFor(() => expect(screen.queryAllByTestId("ReceiveFunds__qrcode")).toHaveLength(1));

		fireEvent.click(screen.getByTestId("modal__close-btn"));

		expect(() => screen.getByTestId("modal__inner")).toThrow(/Unable to find an element by/);
	});

	it("should close the search wallet modal", async () => {
		render(
			<Route path="/profiles/:profileId/dashboard">
				<NavigationBar />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		const receiveFundsButton = screen.getByTestId("navbar__buttons--receive");

		fireEvent.click(receiveFundsButton);

		await expect(screen.findByTestId("modal__inner")).resolves.toHaveTextContent("Select Account");

		fireEvent.click(screen.getByTestId("modal__close-btn"));

		expect(() => screen.getByTestId("modal__inner")).toThrow(/Unable to find an element by/);
	});

	it("should disable send transfer button when no Live wallets in test network", () => {
		const mockProfile = environmentHooks.useActiveProfile();
		const profileSettingsMock = jest.spyOn(mockProfile.settings(), "get").mockImplementation((key: string) => {
			if (key === Contracts.ProfileSetting.Name) {
				return "John Doe";
			}
			if (key === Contracts.ProfileSetting.UseTestNetworks) {
				return false;
			}
			if (key === Contracts.ProfileSetting.ExchangeCurrency) {
				return "USD";
			}

			return "";
		});

		const { container } = render(<NavigationBar />);

		expect(container).toBeInTheDocument();
		expect(screen.getByTestId("navbar__buttons--send")).toHaveAttribute("disabled");

		profileSettingsMock.mockRestore();
	});
});
