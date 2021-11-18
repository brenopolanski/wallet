import { LSK } from "@payvo/sdk-lsk";
import { Contracts } from "@payvo/sdk-profiles";
import userEvent from "@testing-library/user-event";
import * as sharedGraphUtils from "app/components/Graphs/Graphs.shared";
import * as useThemeHook from "app/hooks/use-theme";
import { buildTranslations } from "app/i18n/helpers";
import nock from "nock";
import React from "react";
import { env, render, screen } from "utils/testing-library";

import { PortfolioBreakdown } from "./PortfolioBreakdown";

const translations = buildTranslations();

describe("PortfolioBreakdown", () => {
	let profile: Contracts.IProfile;

	let arkWallet: Contracts.IReadWriteWallet;
	let lskWallet: Contracts.IReadWriteWallet;

	let portfolioBreakdownMock: jest.SpyInstance;
	let isRestoredMock: jest.SpyInstance;
	let balanceMock: jest.SpyInstance;

	let useGraphWidthMock: jest.SpyInstance;

	beforeAll(async () => {
		nock.disableNetConnect();

		env.registerCoin("LSK", LSK);

		profile = env.profiles().create("blank");

		profile.settings().set(Contracts.ProfileSetting.ExchangeCurrency, "USD");

		arkWallet = (await profile.walletFactory().generate({ coin: "ARK", network: "ark.mainnet" })).wallet;
		lskWallet = (await profile.walletFactory().generate({ coin: "LSK", network: "lsk.mainnet" })).wallet;

		profile.wallets().push(arkWallet);
		profile.wallets().push(lskWallet);

		// Mock graph width to 100.
		useGraphWidthMock = jest.spyOn(sharedGraphUtils, "useGraphWidth").mockReturnValue([undefined as never, 100]);
	});

	afterAll(() => {
		nock.enableNetConnect();

		env.profiles().forget(profile.id());

		useGraphWidthMock.mockRestore();
	});

	beforeEach(() => {
		portfolioBreakdownMock = jest.spyOn(profile.portfolio(), "breakdown").mockReturnValue([
			{ coin: arkWallet.coin(), shares: 85, source: 85, target: 85 },
			{ coin: lskWallet.coin(), shares: 15, source: 15, target: 15 },
		]);

		isRestoredMock = jest.spyOn(profile.status(), "isRestored").mockReturnValue(true);
		balanceMock = jest.spyOn(profile, "convertedBalance").mockReturnValue(100);
	});

	afterEach(() => {
		portfolioBreakdownMock.mockRestore();
		isRestoredMock.mockRestore();
		balanceMock.mockRestore();
	});

	it.each([true, false])("should render with dark mode = %s", (isDarkMode) => {
		const useThemeMock = jest.spyOn(useThemeHook, "useTheme").mockReturnValue({ isDarkMode } as never);

		const { asFragment } = render(<PortfolioBreakdown profile={profile} profileIsSyncingExchangeRates={false} />);

		expect(screen.getByTestId("PortfolioBreakdown")).toBeInTheDocument();

		expect(screen.getByTestId("Amount")).toHaveTextContent("$100.00");
		expect(screen.getByTestId("PortfolioBreakdown__assets")).toHaveTextContent("2");
		expect(screen.getByTestId("PortfolioBreakdown__wallets")).toHaveTextContent("2");

		expect(screen.getByTestId("LineGraph__svg")).toBeInTheDocument();
		expect(screen.getAllByTestId("LineGraph__item")).toHaveLength(2);

		expect(screen.getByText(translations.COMMON.MORE_DETAILS)).not.toBeDisabled();

		expect(asFragment()).toMatchSnapshot();

		useThemeMock.mockRestore();
	});

	it("should render loading", () => {
		portfolioBreakdownMock.mockReturnValue([]);

		const { asFragment, rerender } = render(
			<PortfolioBreakdown profile={profile} profileIsSyncingExchangeRates={true} />,
		);

		expect(screen.getByTestId("PortfolioBreakdownSkeleton")).toBeInTheDocument();

		isRestoredMock.mockReturnValue(false);

		rerender(<PortfolioBreakdown profile={profile} profileIsSyncingExchangeRates={false} />);

		expect(screen.getByTestId("PortfolioBreakdownSkeleton")).toBeInTheDocument();

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render empty", () => {
		portfolioBreakdownMock.mockReturnValue([]);

		const { asFragment } = render(<PortfolioBreakdown profile={profile} profileIsSyncingExchangeRates={false} />);

		expect(screen.getByTestId("EmptyBlock")).toBeInTheDocument();
		expect(screen.getByTestId("EmptyBlock")).toHaveTextContent(/Your portfolio is currently empty/);

		expect(asFragment()).toMatchSnapshot();
	});

	it.each([true, false])("should render zero balance state with dark mode = %s", (isDarkMode) => {
		const useThemeMock = jest.spyOn(useThemeHook, "useTheme").mockReturnValue({ isDarkMode } as never);

		balanceMock.mockReturnValue(0);

		const { asFragment } = render(<PortfolioBreakdown profile={profile} profileIsSyncingExchangeRates={false} />);

		expect(screen.getByTestId("PortfolioBreakdown")).toBeInTheDocument();
		expect(screen.getByTestId("LineGraph__empty")).toBeInTheDocument();

		expect(screen.getByText(translations.COMMON.MORE_DETAILS)).toBeDisabled();

		expect(asFragment()).toMatchSnapshot();

		useThemeMock.mockRestore();
	});

	it("should have a button to open detail modal", () => {
		render(<PortfolioBreakdown profile={profile} profileIsSyncingExchangeRates={false} />);

		expect(screen.getByText(translations.COMMON.MORE_DETAILS)).toBeEnabled();

		userEvent.click(screen.getByText(translations.COMMON.MORE_DETAILS));

		expect(screen.getByTestId("modal__inner")).toBeInTheDocument();
		expect(screen.getByText(translations.DASHBOARD.PORTFOLIO_BREAKDOWN_DETAILS.TITLE)).toBeInTheDocument();

		userEvent.click(screen.getByTestId("modal__close-btn"));

		expect(screen.queryByTestId("modal__inner")).not.toBeInTheDocument();
	});

	it("should show tooltip when hovering graph elements", () => {
		render(<PortfolioBreakdown profile={profile} profileIsSyncingExchangeRates={false} />);

		expect(screen.getByTestId("LineGraph__svg")).toBeInTheDocument();
		expect(screen.getAllByTestId("LineGraph__item")).toHaveLength(2);

		expect(screen.queryByTestId("PortfolioBreakdown__tooltip")).not.toBeInTheDocument();

		userEvent.hover(screen.getAllByTestId("LineGraph__item")[0]);

		expect(screen.getByTestId("PortfolioBreakdown__tooltip")).toBeInTheDocument();
		expect(screen.getByTestId("PortfolioBreakdown__tooltip")).toHaveTextContent(/ARK/);
		expect(screen.getByTestId("PortfolioBreakdown__tooltip")).toHaveTextContent(/\$85.00/);
		expect(screen.getByTestId("PortfolioBreakdown__tooltip")).toHaveTextContent(/85%/);

		userEvent.unhover(screen.getAllByTestId("LineGraph__item")[0]);
		userEvent.hover(screen.getAllByTestId("LineGraph__item")[1]);

		expect(screen.getByTestId("PortfolioBreakdown__tooltip")).toHaveTextContent(/LSK/);
		expect(screen.getByTestId("PortfolioBreakdown__tooltip")).toHaveTextContent(/\$15.00/);
		expect(screen.getByTestId("PortfolioBreakdown__tooltip")).toHaveTextContent(/15%/);
	});
});
