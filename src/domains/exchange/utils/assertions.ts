import { Contracts } from "@payvo/sdk-profiles";
import { ExchangeTransaction } from "@payvo/sdk-profiles/distribution/cjs/exchange-transaction";
import { AssertionError } from "assert";
import { CurrencyData } from "domains/exchange/contracts";
import { ExchangeService } from "domains/exchange/services/exchange.service";

export function assertExchangeService(exchangeService?: ExchangeService): asserts exchangeService is ExchangeService {
	if (!(exchangeService instanceof ExchangeService)) {
		throw new AssertionError({
			message: `Expected 'exchangeService' to be ExchangeService, but received ${exchangeService}`,
		});
	}
}

export function assertExchangeTransaction(
	exchangeTransaction?: Contracts.IExchangeTransaction,
): asserts exchangeTransaction is ExchangeTransaction {
	if (!(exchangeTransaction instanceof ExchangeTransaction)) {
		throw new AssertionError({
			message: `Expected 'exchangeTransaction' to be Contracts.IExchangeTransaction, but received ${exchangeTransaction}`,
		});
	}
}

export function assertCurrency(currencyData?: CurrencyData): asserts currencyData is CurrencyData {
	if (!currencyData || typeof currencyData !== "object" || !("coin" in currencyData && "name" in currencyData)) {
		throw new AssertionError({
			message: `Expected 'currencyData' to be CurrencyData, but received ${currencyData}`,
		});
	}
}
