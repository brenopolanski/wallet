import { Contracts } from "@payvo/sdk-profiles";
import { renderHook } from "@testing-library/react-hooks";
import userEvent from "@testing-library/user-event";
import { httpClient, toasts } from "app/services";
import { ExchangeProvider, useExchangeContext } from "domains/exchange/contexts/Exchange";
import { createMemoryHistory, MemoryHistory } from "history";
import nock from "nock";
import React, { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Route } from "react-router-dom";
import { env, fireEvent, getDefaultProfileId, render, screen, waitFor, within } from "utils/testing-library";

import { ConfirmationStep } from "./ConfirmationStep";
import { ExchangeForm } from "./ExchangeForm";
import { FormStep } from "./FormStep";
import { ReviewStep } from "./ReviewStep";
import { StatusStep } from "./StatusStep";

let profile: Contracts.IProfile;

const exchangeURL = `/profiles/${getDefaultProfileId()}/exchange/view`;
let history: MemoryHistory;

jest.mock("utils/delay", () => ({
	delay: (callback: () => void) => setTimeout(callback, 200),
}));

const Wrapper = ({ children }: { children: React.ReactNode }) => {
	const { exchangeProviders, exchangeService, fetchProviders, provider, setProvider } = useExchangeContext();

	useEffect(() => {
		const _fetchProviders = async () => fetchProviders();

		if (!exchangeProviders?.length) {
			_fetchProviders();
		}
	}, [exchangeProviders, fetchProviders]);

	useEffect(() => {
		if (exchangeProviders && !provider) {
			setProvider(exchangeProviders[0]);
		}
	}, [exchangeProviders, exchangeService, provider]);

	if (provider) {
		return <>{children}</>;
	}

	return null;
};

describe("ExchangeForm", () => {
	beforeAll(() => {
		nock.disableNetConnect();

		profile = env.profiles().findById(getDefaultProfileId());
	});

	beforeEach(() => {
		history = createMemoryHistory();
		history.push(exchangeURL);
	});

	afterEach(() => {
		profile.exchangeTransactions().flush();

		httpClient.clearCache();
	});

	const renderComponent = (component: React.ReactNode) =>
		render(
			<Route path="/profiles/:profileId/exchange/view">
				<ExchangeProvider>
					<Wrapper>{component}</Wrapper>
				</ExchangeProvider>
			</Route>,
			{
				history,
				routes: [exchangeURL],
			},
		);

	const selectCurrencies = async ({ from, to }: { from?: Record<string, string>; to?: Record<string, string> }) => {
		// from currency
		if (from) {
			await waitFor(() => {
				expect(screen.getAllByTestId("SelectDropdown__input")[0]).not.toBeDisabled();
			});

			await waitFor(() => expect(screen.getAllByTestId("SelectDropdown__input")[0]).toBeInTheDocument());
			fireEvent.change(screen.getAllByTestId("SelectDropdown__input")[0], { target: { value: from.name } });

			await waitFor(() => expect(screen.getAllByTestId("SelectDropdown__option--0")[0]).toBeInTheDocument());
			userEvent.click(screen.getAllByTestId("SelectDropdown__option--0")[0]);

			await waitFor(() => {
				expect(screen.getAllByTestId("SelectDropdown__input")[0]).toHaveValue(from.name);
			});

			await waitFor(() => {
				expect(screen.getByAltText(`${from.ticker} Icon`)).toBeInTheDocument();
			});
		}
		// to currency
		if (to) {
			await waitFor(() => {
				expect(screen.getAllByTestId("SelectDropdown__input")[1]).not.toBeDisabled();
			});

			await waitFor(() => expect(screen.getAllByTestId("SelectDropdown__input")[1]).toBeInTheDocument());
			fireEvent.change(screen.getAllByTestId("SelectDropdown__input")[1], { target: { value: to.name } });

			await waitFor(() => expect(screen.getAllByTestId("SelectDropdown__option--0")[0]).toBeInTheDocument());
			userEvent.click(screen.getAllByTestId("SelectDropdown__option--0")[0]);

			await waitFor(() => {
				expect(screen.getAllByTestId("SelectDropdown__input")[1]).toHaveValue(to.name);
			});

			await waitFor(() => {
				expect(screen.getByAltText(`${to.ticker} Icon`)).toBeInTheDocument();
			});
		}
	};

	it("should render exchange form", async () => {
		const onReady = jest.fn();

		const { container } = renderComponent(<ExchangeForm onReady={onReady} />);

		await waitFor(() => {
			expect(onReady).toHaveBeenCalledWith();
		});

		await waitFor(() => {
			expect(screen.getByTestId("ExchangeForm")).toBeInTheDocument();
		});

		const fromCurrencyDropdown = screen.getAllByTestId("SelectDropdown__input")[0];
		const toCurrencyDropdown = screen.getAllByTestId("SelectDropdown__input")[1];
		const recipientDropdown = screen.getAllByTestId("SelectDropdown__input")[2];

		expect(fromCurrencyDropdown).toBeDisabled();
		expect(toCurrencyDropdown).toBeDisabled();
		expect(recipientDropdown).toBeDisabled();

		await waitFor(() => {
			expect(fromCurrencyDropdown).not.toBeDisabled();
		});

		await waitFor(() => {
			expect(toCurrencyDropdown).not.toBeDisabled();
		});

		expect(container).toMatchSnapshot();
	});

	it("should render exchange form with id of pending order", async () => {
		const onReady = jest.fn();

		const exchangeTransaction = profile.exchangeTransactions().create({
			input: {
				address: "payinAddress",
				amount: 1,
				hash: "payinHash",
				ticker: "btc",
			},
			orderId: "id",
			output: {
				address: "payoutAddress",
				amount: 100,
				hash: "payoutHash",
				ticker: "ark",
			},
			provider: "changenow",
		});

		nock("https://exchanges.payvo.com")
			.get("/api/changenow/orders/id")
			.query(true)
			.reply(200, { data: { id: exchangeTransaction.orderId(), status: "new" } });

		const { container } = renderComponent(
			<ExchangeForm orderId={exchangeTransaction.orderId()} onReady={onReady} />,
		);

		await waitFor(() => {
			expect(screen.getByTestId("ExchangeForm")).toBeInTheDocument();
		});

		await waitFor(() => {
			expect(onReady).toHaveBeenCalledWith();
		});

		expect(screen.getByTestId("ExchangeForm__status-step")).toBeInTheDocument();
		expect(container).toMatchSnapshot();
	});

	it("should render exchange form with id of finished order", async () => {
		const onReady = jest.fn();

		const exchangeTransaction = profile.exchangeTransactions().create({
			input: {
				address: "payinAddress",
				amount: 1,
				hash: "payinHash",
				ticker: "btc",
			},
			orderId: "id",
			output: {
				address: "payoutAddress",
				amount: 100,
				hash: "payoutHash",
				ticker: "ark",
			},
			provider: "changenow",
		});
		profile
			.exchangeTransactions()
			.update(exchangeTransaction.id(), { status: Contracts.ExchangeTransactionStatus.Finished });

		const { container } = renderComponent(
			<ExchangeForm orderId={exchangeTransaction.orderId()} onReady={onReady} />,
		);

		await waitFor(() => {
			expect(screen.getByTestId("ExchangeForm")).toBeInTheDocument();
		});

		await waitFor(() => {
			expect(onReady).toHaveBeenCalledWith();
		});

		expect(screen.getByTestId("ExchangeForm__confirmation-step")).toBeInTheDocument();
		expect(container).toMatchSnapshot();
	});

	it("should go back to exchange page", async () => {
		const onReady = jest.fn();

		renderComponent(<ExchangeForm onReady={onReady} />);

		await waitFor(() => {
			expect(onReady).toHaveBeenCalledWith();
		});

		await waitFor(() => {
			expect(screen.getByTestId("ExchangeForm")).toBeInTheDocument();
		});

		await waitFor(() => expect(screen.getAllByTestId("SelectDropdown__input")).toHaveLength(3));
		const fromCurrencyDropdown = screen.getAllByTestId("SelectDropdown__input")[0];
		const toCurrencyDropdown = screen.getAllByTestId("SelectDropdown__input")[1];

		await waitFor(() => {
			expect(fromCurrencyDropdown).not.toBeDisabled();
		});

		await waitFor(() => {
			expect(toCurrencyDropdown).not.toBeDisabled();
		});

		const historySpy = jest.spyOn(history, "push").mockImplementation();
		userEvent.click(screen.getByTestId("ExchangeForm__back-button"));

		await waitFor(() => {
			expect(historySpy).toHaveBeenCalledWith(`/profiles/${getDefaultProfileId()}/exchange`);
		});

		historySpy.mockRestore();
	});

	it("should show an error alert if the selected pair is unavailable", async () => {
		nock("https://exchanges.payvo.com")
			.get("/api/changenow/currencies/eth")
			.reply(200, require("tests/fixtures/exchange/changenow/currency-eth.json"))
			.get("/api/changenow/tickers/btc/eth")
			.reply(422, { error: { message: "Unavailable Pair" } });

		const onReady = jest.fn();

		const { container } = renderComponent(<ExchangeForm onReady={onReady} />);

		await waitFor(() => {
			expect(onReady).toHaveBeenCalledWith();
		});

		await waitFor(() => {
			expect(screen.getByTestId("ExchangeForm")).toBeInTheDocument();
		});

		await selectCurrencies({
			from: { name: "Bitcoin", ticker: "BTC" },
			to: { name: "Ethereum", ticker: "ETH" },
		});

		await waitFor(() => {
			expect(container).toHaveTextContent("The pair BTC / ETH is not available");
		});
	});

	it("should show and hide refund address input", async () => {
		const onReady = jest.fn();

		renderComponent(<ExchangeForm onReady={onReady} />);

		await waitFor(() => {
			expect(onReady).toHaveBeenCalledWith();
		});

		await waitFor(() => {
			expect(screen.getByTestId("ExchangeForm")).toBeInTheDocument();
		});

		const fromCurrencyDropdown = screen.getAllByTestId("SelectDropdown__input")[0];
		const toCurrencyDropdown = screen.getAllByTestId("SelectDropdown__input")[1];
		const recipientDropdown = screen.getAllByTestId("SelectDropdown__input")[2];

		expect(fromCurrencyDropdown).toBeDisabled();
		expect(toCurrencyDropdown).toBeDisabled();
		expect(recipientDropdown).toBeDisabled();

		await waitFor(() => {
			expect(fromCurrencyDropdown).not.toBeDisabled();
		});

		await waitFor(() => {
			expect(toCurrencyDropdown).not.toBeDisabled();
		});

		userEvent.click(screen.getByTestId("ExchangeForm__add-refund-address"));
		await waitFor(() => {
			expect(screen.getByTestId("ExchangeForm__refund-address")).toBeInTheDocument();
		});

		await waitFor(() => {
			expect(screen.getByTestId("ExchangeForm__remove-refund-address")).toBeInTheDocument();
		});

		userEvent.click(screen.getByTestId("ExchangeForm__remove-refund-address"));

		await waitFor(() => {
			expect(() => screen.getByTestId("ExchangeForm__refund-address")).toThrow(/Unable to find an element by/);
		});
	});

	it("should show external id input if supported", async () => {
		const currency = require("tests/fixtures/exchange/changenow/currency-eth.json");

		currency.data.externalIdName = "external id";
		currency.data.hasExternalId = true;

		nock("https://exchanges.payvo.com").get("/api/changenow/currencies/eth").reply(200, currency);

		const onReady = jest.fn();

		renderComponent(<ExchangeForm onReady={onReady} />);

		await waitFor(() => {
			expect(onReady).toHaveBeenCalledWith();
		});

		await waitFor(() => {
			expect(screen.getByTestId("ExchangeForm")).toBeInTheDocument();
		});

		await selectCurrencies({
			from: { name: "Bitcoin", ticker: "BTC" },
			to: { name: "Ethereum", ticker: "ETH" },
		});

		await waitFor(() => {
			expect(screen.getByTestId("ExchangeForm__external-id")).toBeInTheDocument();
		});

		const externalInput = within(screen.getByTestId("ExchangeForm__external-id")).getByRole("textbox");
		fireEvent.change(externalInput, { target: { value: "external-id" } });

		await waitFor(() => {
			expect(externalInput).toHaveValue("external-id");
		});
	});

	it("should show external id input for refund if supported", async () => {
		const currency = require("tests/fixtures/exchange/changenow/currency-eth.json");

		currency.data.externalIdName = "external id";
		currency.data.hasExternalId = true;

		nock("https://exchanges.payvo.com")
			.get("/api/changenow/currencies/eth/payoutAddress")
			.reply(200, { data: true })
			.get("/api/changenow/currencies/eth")
			.reply(200, currency);

		const onReady = jest.fn();

		renderComponent(<ExchangeForm onReady={onReady} />);

		await waitFor(() => {
			expect(onReady).toHaveBeenCalledWith();
		});

		await waitFor(() => {
			expect(screen.getByTestId("ExchangeForm")).toBeInTheDocument();
		});

		await selectCurrencies({
			from: { name: "Ethereum", ticker: "ETH" },
			to: { name: "Bitcoin", ticker: "BTC" },
		});

		userEvent.click(screen.getByTestId("ExchangeForm__add-refund-address"));
		await waitFor(() => {
			expect(screen.getByTestId("ExchangeForm__refund-address")).toBeInTheDocument();
		});

		const refundDropdown = screen.getAllByTestId("SelectDropdown__input")[3];

		fireEvent.change(refundDropdown, { target: { value: "payoutAddress" } });

		await waitFor(() => {
			expect(refundDropdown).toHaveValue("payoutAddress");
		});

		expect(screen.getByTestId("ExchangeForm__refund-external-id")).toBeInTheDocument();

		const refundExternalInput = within(screen.getByTestId("ExchangeForm__refund-external-id")).getByRole("textbox");
		fireEvent.change(refundExternalInput, { target: { value: "refund-external-id" } });

		await waitFor(() => {
			expect(refundExternalInput).toHaveValue("refund-external-id");
		});
	});

	it("should swap currencies", async () => {
		const onReady = jest.fn();

		renderComponent(<ExchangeForm onReady={onReady} />);

		await waitFor(() => {
			expect(onReady).toHaveBeenCalledWith();
		});

		await waitFor(() => {
			expect(screen.getByTestId("ExchangeForm")).toBeInTheDocument();
		});

		await selectCurrencies({
			from: { name: "Bitcoin", ticker: "BTC" },
			to: { name: "Ark", ticker: "ARK" },
		});

		const fromCurrencyDropdown = screen.getAllByTestId("SelectDropdown__input")[0];
		const toCurrencyDropdown = screen.getAllByTestId("SelectDropdown__input")[1];

		userEvent.click(screen.getByTestId("ExchangeForm__swap-button"));

		await waitFor(() => {
			expect(fromCurrencyDropdown).toHaveValue("Ark");
		});

		expect(toCurrencyDropdown).toHaveValue("Bitcoin");
	});

	it("should calculate amounts", async () => {
		const onReady = jest.fn();

		renderComponent(<ExchangeForm onReady={onReady} />);

		await waitFor(() => {
			expect(onReady).toHaveBeenCalledWith();
		});

		await waitFor(() => {
			expect(screen.getByTestId("ExchangeForm")).toBeInTheDocument();
		});

		await selectCurrencies({
			from: { name: "Bitcoin", ticker: "BTC" },
			to: { name: "Ark", ticker: "ARK" },
		});

		const payinInput = screen.getAllByTestId("InputCurrency")[0];
		const payoutInput = screen.getAllByTestId("InputCurrency")[1];

		// amount input
		fireEvent.input(payinInput, { target: { value: "1" } });

		await waitFor(() => {
			expect(payinInput).toHaveValue("1");
		});

		await waitFor(() => {
			expect(payoutInput).toHaveValue("37042.3588384");
		});

		// update amount output
		fireEvent.input(payoutInput, { target: { value: "1" } });

		await waitFor(() => {
			expect(payinInput).toHaveValue("37042.3588384");
		});

		// remove from currency
		fireEvent.change(screen.getAllByTestId("SelectDropdown__input")[0], { target: { value: "" } });
		await waitFor(() => {
			expect(screen.getAllByTestId("SelectDropdown__input")[0]).not.toHaveValue();
		});

		expect(payinInput).not.toHaveValue();

		await selectCurrencies({
			from: { name: "Bitcoin", ticker: "BTC" },
		});

		expect(payinInput).toHaveValue("37042.3588384");
	});

	it("should remove amount if removing currency", async () => {
		const onReady = jest.fn();

		renderComponent(<ExchangeForm onReady={onReady} />);

		await waitFor(() => {
			expect(onReady).toHaveBeenCalledWith();
		});

		await waitFor(() => {
			expect(screen.getByTestId("ExchangeForm")).toBeInTheDocument();
		});

		await selectCurrencies({
			from: { name: "Bitcoin", ticker: "BTC" },
			to: { name: "Ark", ticker: "ARK" },
		});

		const payinInput = screen.getAllByTestId("InputCurrency")[0];
		const payoutInput = screen.getAllByTestId("InputCurrency")[1];

		// amount input
		fireEvent.input(payinInput, { target: { value: "1" } });

		await waitFor(() => {
			expect(payoutInput).toHaveValue("37042.3588384");
		});

		// remove from currency
		fireEvent.change(screen.getAllByTestId("SelectDropdown__input")[0], { target: { value: "" } });

		await waitFor(() => {
			expect(payinInput).not.toHaveValue();
		});

		// remove to currency
		fireEvent.change(screen.getAllByTestId("SelectDropdown__input")[1], { target: { value: "" } });

		await waitFor(() => {
			expect(payoutInput).not.toHaveValue();
		});
	});

	it("should remove payout amount if removing payin amount", async () => {
		const onReady = jest.fn();

		renderComponent(<ExchangeForm onReady={onReady} />);

		await waitFor(() => {
			expect(onReady).toHaveBeenCalledWith();
		});

		await waitFor(() => {
			expect(screen.getByTestId("ExchangeForm")).toBeInTheDocument();
		});

		await selectCurrencies({
			from: { name: "Bitcoin", ticker: "BTC" },
			to: { name: "Ark", ticker: "ARK" },
		});

		const payinInput = screen.getAllByTestId("InputCurrency")[0];
		const payoutInput = screen.getAllByTestId("InputCurrency")[1];

		// amount input
		fireEvent.input(payinInput, { target: { value: "1" } });

		await waitFor(() => {
			expect(payinInput).toHaveValue("1");
		});

		await waitFor(() => {
			expect(payoutInput).toHaveValue("37042.3588384");
		});

		// remove payin amount
		fireEvent.change(payinInput, { target: { value: "" } });

		await waitFor(() => {
			expect(payoutInput).not.toHaveValue();
		});
	});

	it("should remove payin amount if removing payout amount", async () => {
		const onReady = jest.fn();

		renderComponent(<ExchangeForm onReady={onReady} />);

		await waitFor(() => {
			expect(onReady).toHaveBeenCalledWith();
		});

		await waitFor(() => {
			expect(screen.getByTestId("ExchangeForm")).toBeInTheDocument();
		});

		await selectCurrencies({
			from: { name: "Bitcoin", ticker: "BTC" },
			to: { name: "Ark", ticker: "ARK" },
		});

		const payinInput = screen.getAllByTestId("InputCurrency")[0];
		const payoutInput = screen.getAllByTestId("InputCurrency")[1];

		// amount input
		fireEvent.input(payinInput, { target: { value: "1" } });

		await waitFor(() => {
			expect(payinInput).toHaveValue("1");
		});

		await waitFor(() => {
			expect(payoutInput).toHaveValue("37042.3588384");
		});

		// remove payout amount
		fireEvent.change(payoutInput, { target: { value: "" } });

		await waitFor(() => {
			expect(payinInput).not.toHaveValue();
		});
	});

	it("should not update payin amount when there is no from currency", async () => {
		const onReady = jest.fn();

		renderComponent(<ExchangeForm onReady={onReady} />);

		await waitFor(() => {
			expect(onReady).toHaveBeenCalledWith();
		});

		await waitFor(() => {
			expect(screen.getByTestId("ExchangeForm")).toBeInTheDocument();
		});

		await selectCurrencies({
			from: { name: "Bitcoin", ticker: "BTC" },
			to: { name: "Ark", ticker: "ARK" },
		});

		// remove from currency
		fireEvent.change(screen.getAllByTestId("SelectDropdown__input")[0], { target: { value: "" } });
		await waitFor(() => {
			expect(screen.getAllByTestId("SelectDropdown__input")[0]).not.toHaveValue();
		});

		const payinInput = screen.getAllByTestId("InputCurrency")[0];
		const payoutInput = screen.getAllByTestId("InputCurrency")[1];

		// amount input
		fireEvent.input(payoutInput, { target: { value: "1" } });

		await waitFor(() => {
			expect(payoutInput).toHaveValue("1");
		});

		await waitFor(() => {
			expect(payinInput).not.toHaveValue();
		});
	});

	it("should not update payout amount when there is no to currency", async () => {
		const onReady = jest.fn();

		renderComponent(<ExchangeForm onReady={onReady} />);

		await waitFor(() => {
			expect(onReady).toHaveBeenCalledWith();
		});

		await waitFor(() => {
			expect(screen.getByTestId("ExchangeForm")).toBeInTheDocument();
		});

		await selectCurrencies({
			from: { name: "Bitcoin", ticker: "BTC" },
			to: { name: "Ark", ticker: "ARK" },
		});

		// remove to currency
		fireEvent.change(screen.getAllByTestId("SelectDropdown__input")[1], { target: { value: "" } });
		await waitFor(() => {
			expect(screen.getAllByTestId("SelectDropdown__input")[1]).not.toHaveValue();
		});

		const payinInput = screen.getAllByTestId("InputCurrency")[0];
		const payoutInput = screen.getAllByTestId("InputCurrency")[1];

		// amount input
		fireEvent.input(payinInput, { target: { value: "1" } });

		await waitFor(() => {
			expect(payinInput).toHaveValue("1");
		});

		await waitFor(() => {
			expect(payoutInput).not.toHaveValue();
		});
	});

	it("should clear recipient address error when unsetting to currency", async () => {
		nock("https://exchanges.payvo.com")
			.get("/api/changenow/currencies/eth")
			.reply(200, require("tests/fixtures/exchange/changenow/currency-eth.json"))
			.get("/api/changenow/currencies/eth/payoutAddress")
			.reply(200, { data: false });

		const onReady = jest.fn();

		renderComponent(<ExchangeForm onReady={onReady} />);

		await waitFor(() => {
			expect(onReady).toHaveBeenCalledWith();
		});

		await waitFor(() => {
			expect(screen.getByTestId("ExchangeForm")).toBeInTheDocument();
		});

		await selectCurrencies({
			from: { name: "Bitcoin", ticker: "BTC" },
			to: { name: "Ethereum", ticker: "ETH" },
		});

		const recipientDropdown = screen.getAllByTestId("SelectDropdown__input")[2];

		fireEvent.change(recipientDropdown, { target: { value: "payoutAddress" } });

		await waitFor(() => {
			expect(recipientDropdown).toHaveValue("payoutAddress");
		});

		await waitFor(() => {
			expect(
				within(screen.getByTestId("ExchangeForm__recipient-address")).getAllByTestId("Input__error"),
			).toHaveLength(2);
		});

		// remove to currency
		fireEvent.change(screen.getAllByTestId("SelectDropdown__input")[1], { target: { value: "" } });

		await waitFor(() => {
			expect(() =>
				within(screen.getByTestId("ExchangeForm__recipient-address")).getAllByTestId("Input__error"),
			).toThrow(/Unable to find an element by/);
		});
	});

	it("should clear refund address error when unsetting from currency", async () => {
		nock("https://exchanges.payvo.com")
			.get("/api/changenow/currencies/eth")
			.reply(200, require("tests/fixtures/exchange/changenow/currency-eth.json"))
			.get("/api/changenow/currencies/eth/payoutAddress")
			.reply(200, { data: false });

		const onReady = jest.fn();

		renderComponent(<ExchangeForm onReady={onReady} />);

		await waitFor(() => {
			expect(onReady).toHaveBeenCalledWith();
		});

		await waitFor(() => {
			expect(screen.getByTestId("ExchangeForm")).toBeInTheDocument();
		});

		await selectCurrencies({
			from: { name: "Ethereum", ticker: "ETH" },
			to: { name: "Bitcoin", ticker: "BTC" },
		});

		userEvent.click(screen.getByTestId("ExchangeForm__add-refund-address"));
		await waitFor(() => {
			expect(screen.getByTestId("ExchangeForm__refund-address")).toBeInTheDocument();
		});

		const refundDropdown = screen.getAllByTestId("SelectDropdown__input")[3];

		fireEvent.change(refundDropdown, { target: { value: "payoutAddress" } });

		await waitFor(() => {
			expect(refundDropdown).toHaveValue("payoutAddress");
		});

		await waitFor(() => {
			expect(
				within(screen.getByTestId("ExchangeForm__refund-address")).getAllByTestId("Input__error"),
			).toHaveLength(2);
		});

		// remove from currency
		fireEvent.change(screen.getAllByTestId("SelectDropdown__input")[0], { target: { value: "" } });

		await waitFor(() => {
			expect(() =>
				within(screen.getByTestId("ExchangeForm__refund-address")).getAllByTestId("Input__error"),
			).toThrow(/Unable to find an element by/);
		});
	});

	it("should show a generic error toast", async () => {
		const { result } = renderHook(() => useTranslation());
		const { t } = result.current;

		nock("https://exchanges.payvo.com").post("/api/changenow/orders").reply(500, "Server Error");

		const onReady = jest.fn();

		renderComponent(<ExchangeForm onReady={onReady} />);

		await waitFor(() => {
			expect(onReady).toHaveBeenCalledWith();
		});

		await waitFor(() => {
			expect(screen.getByTestId("ExchangeForm")).toBeInTheDocument();
		});

		await selectCurrencies({
			from: { name: "Bitcoin", ticker: "BTC" },
			to: { name: "Ark", ticker: "ARK" },
		});

		const recipientDropdown = screen.getAllByTestId("SelectDropdown__input")[2];

		expect(recipientDropdown).not.toBeDisabled();

		fireEvent.change(recipientDropdown, { target: { value: "payoutAddress" } });

		await waitFor(() => {
			expect(recipientDropdown).toHaveValue("payoutAddress");
		});

		const payinInput = screen.getAllByTestId("InputCurrency")[0];
		const payoutInput = screen.getAllByTestId("InputCurrency")[1];

		// amount input
		fireEvent.input(payinInput, { target: { value: "1" } });

		await waitFor(() => {
			expect(payinInput).toHaveValue("1");
		});

		await waitFor(() => {
			expect(payoutInput).toHaveValue("37042.3588384");
		});

		expect(screen.getByTestId("FormDivider__exchange-rate")).toBeInTheDocument();

		expect(screen.getByTestId("ExchangeForm__continue-button")).not.toBeDisabled();

		// go to review step
		userEvent.click(screen.getByTestId("ExchangeForm__continue-button"));
		await waitFor(() => {
			expect(screen.getByTestId("ExchangeForm__review-step")).toBeInTheDocument();
		});

		// back to form step
		userEvent.click(screen.getByTestId("ExchangeForm__back-button"));
		await waitFor(() => {
			expect(screen.getByTestId("ExchangeForm__form-step")).toBeInTheDocument();
		});

		await waitFor(() => {
			expect(screen.getByTestId("ExchangeForm__continue-button")).not.toBeDisabled();
		});

		// go to review step
		userEvent.click(screen.getByTestId("ExchangeForm__continue-button"));
		await waitFor(() => {
			expect(screen.getByTestId("ExchangeForm__review-step")).toBeInTheDocument();
		});

		expect(screen.getByTestId("ExchangeForm__continue-button")).toBeDisabled();

		userEvent.click(screen.getByRole("checkbox"));

		await waitFor(() => {
			expect(screen.getByTestId("ExchangeForm__continue-button")).not.toBeDisabled();
		});

		const toastSpy = jest.spyOn(toasts, "error").mockImplementation();

		// submit form
		userEvent.click(screen.getByTestId("ExchangeForm__continue-button"));

		await waitFor(() => {
			expect(toastSpy).toHaveBeenCalledWith(t("EXCHANGE.ERROR.GENERIC"));
		});

		toastSpy.mockRestore();
	});

	it("should show an error toast if the provided address is invalid", async () => {
		const { result } = renderHook(() => useTranslation());
		const { t } = result.current;

		nock("https://exchanges.payvo.com")
			.post("/api/changenow/orders")
			.reply(422, { error: { message: "Invalid Address" } });

		const onReady = jest.fn();

		renderComponent(<ExchangeForm onReady={onReady} />);

		await waitFor(() => {
			expect(onReady).toHaveBeenCalledWith();
		});

		await waitFor(() => {
			expect(screen.getByTestId("ExchangeForm")).toBeInTheDocument();
		});

		await selectCurrencies({
			from: { name: "Bitcoin", ticker: "BTC" },
			to: { name: "Ark", ticker: "ARK" },
		});

		const recipientDropdown = screen.getAllByTestId("SelectDropdown__input")[2];

		expect(recipientDropdown).not.toBeDisabled();

		fireEvent.change(recipientDropdown, { target: { value: "payoutAddress" } });

		const payinInput = screen.getAllByTestId("InputCurrency")[0];
		const payoutInput = screen.getAllByTestId("InputCurrency")[1];

		await waitFor(() => {
			expect(recipientDropdown).toHaveValue("payoutAddress");
		});

		// amount input
		fireEvent.input(payinInput, { target: { value: "1" } });

		await waitFor(() => {
			expect(payinInput).toHaveValue("1");
		});

		await waitFor(() => {
			expect(payoutInput).toHaveValue("37042.3588384");
		});

		expect(screen.getByTestId("FormDivider__exchange-rate")).toBeInTheDocument();

		expect(screen.getByTestId("ExchangeForm__continue-button")).not.toBeDisabled();

		// go to review step
		userEvent.click(screen.getByTestId("ExchangeForm__continue-button"));
		await waitFor(() => {
			expect(screen.getByTestId("ExchangeForm__review-step")).toBeInTheDocument();
		});

		expect(screen.getByTestId("ExchangeForm__continue-button")).toBeDisabled();

		userEvent.click(screen.getByRole("checkbox"));

		await waitFor(() => {
			expect(screen.getByTestId("ExchangeForm__continue-button")).not.toBeDisabled();
		});

		const toastSpy = jest.spyOn(toasts, "error").mockImplementation();

		// submit form
		userEvent.click(screen.getByTestId("ExchangeForm__continue-button"));

		await waitFor(() => {
			expect(toastSpy).toHaveBeenCalledWith(t("EXCHANGE.ERROR.INVALID_ADDRESS", { ticker: "ARK" }));
		});

		toastSpy.mockRestore();
	});

	it("should show an error toast if the provided refund address is invalid", async () => {
		const { result } = renderHook(() => useTranslation());
		const { t } = result.current;

		nock("https://exchanges.payvo.com")
			.post("/api/changenow/orders")
			.reply(422, { error: { message: "Invalid Refund Address" } });

		const onReady = jest.fn();

		renderComponent(<ExchangeForm onReady={onReady} />);

		await waitFor(() => {
			expect(onReady).toHaveBeenCalledWith();
		});

		await waitFor(() => {
			expect(screen.getByTestId("ExchangeForm")).toBeInTheDocument();
		});

		await selectCurrencies({
			from: { name: "Bitcoin", ticker: "BTC" },
			to: { name: "Ark", ticker: "ARK" },
		});

		const recipientDropdown = screen.getAllByTestId("SelectDropdown__input")[2];

		expect(recipientDropdown).not.toBeDisabled();

		fireEvent.change(recipientDropdown, { target: { value: "payoutAddress" } });

		await waitFor(() => {
			expect(recipientDropdown).toHaveValue("payoutAddress");
		});

		const payinInput = screen.getAllByTestId("InputCurrency")[0];
		const payoutInput = screen.getAllByTestId("InputCurrency")[1];

		// amount input
		fireEvent.input(payinInput, { target: { value: "1" } });

		await waitFor(() => {
			expect(payinInput).toHaveValue("1");
		});

		await waitFor(() => {
			expect(payoutInput).toHaveValue("37042.3588384");
		});

		expect(screen.getByTestId("FormDivider__exchange-rate")).toBeInTheDocument();

		userEvent.click(screen.getByTestId("ExchangeForm__add-refund-address"));
		await waitFor(() => {
			expect(screen.getByTestId("ExchangeForm__refund-address")).toBeInTheDocument();
		});

		const refundInput = within(screen.getByTestId("ExchangeForm__refund-address")).getByTestId(
			"SelectDropdown__input",
		);
		fireEvent.change(refundInput, { target: { value: "refundAddress" } });

		await waitFor(() => {
			expect(refundInput).toHaveValue("refundAddress");
		});

		expect(screen.getByTestId("ExchangeForm__continue-button")).not.toBeDisabled();

		// go to review step
		userEvent.click(screen.getByTestId("ExchangeForm__continue-button"));
		await waitFor(() => {
			expect(screen.getByTestId("ExchangeForm__review-step")).toBeInTheDocument();
		});

		expect(screen.getByTestId("ExchangeForm__continue-button")).toBeDisabled();

		userEvent.click(screen.getByRole("checkbox"));

		await waitFor(() => {
			expect(screen.getByTestId("ExchangeForm__continue-button")).not.toBeDisabled();
		});

		const toastSpy = jest.spyOn(toasts, "error").mockImplementation();

		// submit form
		userEvent.click(screen.getByTestId("ExchangeForm__continue-button"));

		await waitFor(() => {
			expect(toastSpy).toHaveBeenCalledWith(t("EXCHANGE.ERROR.INVALID_REFUND_ADDRESS", { ticker: "BTC" }));
		});

		toastSpy.mockRestore();
	});

	it("should perform an exchange", async () => {
		const baseStatus = {
			amountFrom: 1,
			amountTo: 100,
			from: "btc",
			id: "182b657b2c259b",
			payinAddress: "payinAddress",
			payoutAddress: "payoutAddress",
			status: "new",
			to: "ark",
		};

		nock("https://exchanges.payvo.com")
			.post("/api/changenow/orders")
			.reply(200, () => require("tests/fixtures/exchange/changenow/order.json"))
			.get("/api/changenow/orders/182b657b2c259b")
			.query(true)
			.reply(200, { data: baseStatus })
			.get("/api/changenow/orders/182b657b2c259b")
			.query(true)
			.reply(200, { data: { ...baseStatus, status: "exchanging" } })
			.get("/api/changenow/orders/182b657b2c259b")
			.query(true)
			.reply(200, { data: { ...baseStatus, status: "sending" } })
			.get("/api/changenow/orders/182b657b2c259b")
			.query(true)
			.reply(200, {
				data: {
					...baseStatus,
					payinHash: "payinHash",
					payoutHash: "payoutHash",
					status: "finished",
				},
			});

		const onReady = jest.fn();

		const { findByTestId } = renderComponent(<ExchangeForm onReady={onReady} />);

		await waitFor(() => {
			expect(onReady).toHaveBeenCalledWith();
		});

		await waitFor(() => {
			expect(screen.getByTestId("ExchangeForm")).toBeInTheDocument();
		});

		await selectCurrencies({
			from: { name: "Bitcoin", ticker: "BTC" },
			to: { name: "Ark", ticker: "ARK" },
		});

		const recipientDropdown = screen.getAllByTestId("SelectDropdown__input")[2];

		expect(recipientDropdown).not.toBeDisabled();

		fireEvent.change(recipientDropdown, { target: { value: "payoutAddress" } });

		await waitFor(() => {
			expect(recipientDropdown).toHaveValue("payoutAddress");
		});

		const payinInput = screen.getAllByTestId("InputCurrency")[0];
		const payoutInput = screen.getAllByTestId("InputCurrency")[1];

		// amount input
		fireEvent.input(payinInput, { target: { value: "1" } });

		await waitFor(() => {
			expect(payinInput).toHaveValue("1");
		});

		await waitFor(() => {
			expect(payoutInput).toHaveValue("37042.3588384");
		});

		expect(screen.getByTestId("FormDivider__exchange-rate")).toBeInTheDocument();

		expect(screen.getByTestId("ExchangeForm__continue-button")).not.toBeDisabled();

		// go to review step
		userEvent.click(screen.getByTestId("ExchangeForm__continue-button"));
		await waitFor(() => {
			expect(screen.getByTestId("ExchangeForm__review-step")).toBeInTheDocument();
		});

		// back to form step
		userEvent.click(screen.getByTestId("ExchangeForm__back-button"));
		await waitFor(() => {
			expect(screen.getByTestId("ExchangeForm__form-step")).toBeInTheDocument();
		});

		await waitFor(() => {
			expect(screen.getByTestId("ExchangeForm__continue-button")).not.toBeDisabled();
		});

		// go to review step
		userEvent.click(screen.getByTestId("ExchangeForm__continue-button"));
		await waitFor(() => {
			expect(screen.getByTestId("ExchangeForm__review-step")).toBeInTheDocument();
		});

		expect(screen.getByTestId("ExchangeForm__continue-button")).toBeDisabled();

		userEvent.click(screen.getByRole("checkbox"));

		await waitFor(() => {
			expect(screen.getByTestId("ExchangeForm__continue-button")).not.toBeDisabled();
		});

		// submit form
		userEvent.click(screen.getByTestId("ExchangeForm__continue-button"));

		await waitFor(() => {
			expect(screen.getByTestId("ExchangeForm__status-step")).toBeInTheDocument();
		});

		// status: awaiting confirmation
		await waitFor(() => {
			expect(() => screen.getAllByTestId("StatusIcon__check-mark")).toThrow(/Unable to find an element by/);
		});

		expect(screen.getAllByTestId("StatusIcon__spinner")).toHaveLength(1);
		expect(screen.getAllByTestId("StatusIcon__empty")).toHaveLength(2);

		// status: finished
		await waitFor(
			() => {
				expect(screen.getAllByTestId("StatusIcon__check-mark")).toHaveLength(3);
			},
			{ timeout: 4000 },
		);

		expect(() => screen.getAllByTestId("StatusIcon__spinner")).toThrow(/Unable to find an element by/);
		expect(() => screen.getAllByTestId("StatusIcon__empty")).toThrow(/Unable to find an element by/);

		await waitFor(() => {
			expect(screen.getByTestId("ExchangeForm__confirmation-step")).toBeInTheDocument();
		});

		const historySpy = jest.spyOn(history, "push").mockImplementation();
		await findByTestId("ExchangeForm__finish-button", undefined, { timeout: 4000 });
		userEvent.click(screen.getByTestId("ExchangeForm__finish-button"));

		await waitFor(() => {
			expect(historySpy).toHaveBeenCalledWith(`/profiles/${getDefaultProfileId()}/dashboard`);
		});

		historySpy.mockRestore();
	});
});

describe("FormStep", () => {
	beforeAll(() => {
		profile = env.profiles().findById(getDefaultProfileId());
	});

	afterEach(() => {
		profile.exchangeTransactions().flush();
	});

	it("should render", async () => {
		const Component = () => {
			const form = useForm({
				mode: "onChange",
			});

			return (
				<FormProvider {...form}>
					<FormStep profile={profile} />
				</FormProvider>
			);
		};

		const { container } = render(
			<ExchangeProvider>
				<Wrapper>
					<Component />
				</Wrapper>
			</ExchangeProvider>,
		);

		await waitFor(() => {
			expect(screen.getByTestId("ExchangeForm__form-step")).toBeInTheDocument();
		});

		expect(container).toMatchSnapshot();
	});
});

describe("ReviewStep", () => {
	beforeAll(() => {
		profile = env.profiles().findById(getDefaultProfileId());
	});

	afterEach(() => {
		profile.exchangeTransactions().flush();
	});

	it("should render", async () => {
		const { result: form } = renderHook(() =>
			useForm({
				defaultValues: {
					fromCurrency: {
						addressExplorerMask: "https://blockchair.com/bitcoin/address/{}?from=changenow",
						coin: "btc",
						externalIdName: null,
						hasExternalId: false,
						name: "Bitcoin",
						transactionExplorerMask: "https://blockchair.com/bitcoin/transaction/{}?from=changenow",
					},
					minPayinAmount: 0,
					payinAmount: "1",
					payoutAmount: "1",
					recipientWallet: "AYx3T2He3Ubz7H5pycQNG2Cvn6HYzeiC73",
					toCurrency: {
						addressExplorerMask: "https://explorer.ark.io/wallets/{}",
						coin: "ark",
						externalIdName: null,
						hasExternalId: false,
						name: "Ark",
						transactionExplorerMask: "https://explorer.ark.io/transaction/{}",
					},
				},
				mode: "onChange",
			}),
		);

		const { container } = render(
			<ExchangeProvider>
				<Wrapper>
					<FormProvider {...form.current}>
						<ReviewStep />
					</FormProvider>
				</Wrapper>
			</ExchangeProvider>,
		);

		await waitFor(() => {
			expect(screen.getByTestId("ExchangeForm__review-step")).toBeInTheDocument();
		});

		expect(container).toMatchSnapshot();
	});
});

describe("StatusStep", () => {
	beforeAll(() => {
		profile = env.profiles().findById(getDefaultProfileId());
	});

	afterEach(() => {
		profile.exchangeTransactions().flush();
	});

	it("should render", async () => {
		const exchangeTransaction = profile.exchangeTransactions().create({
			input: {
				address: "payinAddress",
				amount: 1,
				hash: "payinHash",
				ticker: "btc",
			},
			orderId: "id",
			output: {
				address: "payoutAddress",
				amount: 100,
				hash: "payoutHash",
				ticker: "ark",
			},
			provider: "changenow",
		});

		nock("https://exchanges.payvo.com")
			.get("/api/changenow/orders/id")
			.query(true)
			.reply(200, { data: { id: exchangeTransaction.orderId(), status: "new" } });

		const { container } = render(
			<ExchangeProvider>
				<Wrapper>
					<StatusStep profile={profile} exchangeTransaction={exchangeTransaction} onUpdate={jest.fn()} />
				</Wrapper>
			</ExchangeProvider>,
		);

		await waitFor(() => {
			expect(screen.getByTestId("ExchangeForm__status-step")).toBeInTheDocument();
		});

		expect(container).toMatchSnapshot();
	});

	it("should execute onUpdate callback on status change", async () => {
		const onUpdate = jest.fn();

		const exchangeTransactionData = {
			input: {
				address: "payinAddress",
				amount: 1,
				hash: "payinHash",
				ticker: "btc",
			},
			output: {
				address: "payoutAddress",
				amount: 1,
				hash: "payoutHash",
				ticker: "ark",
			},
		};

		const exchangeTransaction = profile.exchangeTransactions().create({
			...exchangeTransactionData,
			orderId: "orderId",
			provider: "changenow",
		});

		nock("https://exchanges.payvo.com")
			.get(`/api/changenow/orders/${exchangeTransaction.orderId()}`)
			.query(true)
			.reply(200, { data: { id: exchangeTransaction.orderId(), status: "sending" } });

		render(
			<ExchangeProvider>
				<Wrapper>
					<StatusStep profile={profile} exchangeTransaction={exchangeTransaction} onUpdate={onUpdate} />
				</Wrapper>
			</ExchangeProvider>,
		);

		await waitFor(() => {
			expect(screen.getByTestId("ExchangeForm__status-step")).toBeInTheDocument();
		});

		// status: awaiting confirmation
		await waitFor(() => {
			expect(() => screen.getAllByTestId("StatusIcon__check-mark")).toThrow(/Unable to find an element by/);
		});

		expect(screen.getAllByTestId("StatusIcon__spinner")).toHaveLength(1);
		expect(screen.getAllByTestId("StatusIcon__empty")).toHaveLength(2);

		await waitFor(() => {
			expect(onUpdate).toHaveBeenCalledWith(exchangeTransaction.id(), {
				...exchangeTransactionData,
				status: expect.any(Number),
			});
		});
	});
});

describe("ConfirmationStep", () => {
	beforeAll(() => {
		profile = env.profiles().findById(getDefaultProfileId());
	});

	afterEach(() => {
		profile.exchangeTransactions().flush();
	});

	it("should render", async () => {
		const { result: form } = renderHook(() =>
			useForm({
				defaultValues: {
					fromCurrency: {
						addressExplorerMask: "https://blockchair.com/bitcoin/address/{}",
						coin: "btc",
						externalIdName: null,
						hasExternalId: false,
						name: "Bitcoin",
						transactionExplorerMask: "https://blockchair.com/bitcoin/transaction/{}",
					},
				},
				mode: "onChange",
			}),
		);

		const exchangeTransaction = profile.exchangeTransactions().create({
			input: {
				address: "payinAddress",
				amount: 1,
				hash: "payinHash",
				ticker: "btc",
			},
			orderId: "id",
			output: {
				address: "payoutAddress",
				amount: 100,
				ticker: "ark",
			},
			provider: "changenow",
		});

		exchangeTransaction.setStatus(Contracts.ExchangeTransactionStatus.Finished);

		const { container } = render(
			<ExchangeProvider>
				<Wrapper>
					<FormProvider {...form.current}>
						<ConfirmationStep exchangeTransaction={exchangeTransaction} />
					</FormProvider>
				</Wrapper>
			</ExchangeProvider>,
		);

		await waitFor(() => {
			expect(screen.getByTestId("ExchangeForm__confirmation-step")).toBeInTheDocument();
		});

		await waitFor(() => {
			expect(screen.getAllByTestId("ExplorerLink")).toHaveLength(2);
		});

		expect(container).toMatchSnapshot();
	});

	it("should not render without exchange transaction", async () => {
		const { result: form } = renderHook(() => useForm());

		const { container } = render(
			<FormProvider {...form.current}>
				<ConfirmationStep exchangeTransaction={undefined} />
			</FormProvider>,
		);

		await waitFor(() => {
			expect(() => screen.getByTestId("ExchangeForm__confirmation-step")).toThrow(/Unable to find an element by/);
		});

		expect(container).toMatchSnapshot();
	});
});
