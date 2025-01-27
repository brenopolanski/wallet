import { ExchangeService } from "domains/exchange/services/exchange.service";

export const exchangeOrder = (t: any) => ({
	fromCurrency: () => ({
		required: t("COMMON.VALIDATION.FIELD_REQUIRED", {
			field: t("EXCHANGE.EXCHANGE_FORM.FROM_CURRENCY"),
		}),
	}),
	payinAmount: (minimum?: number, ticker?: string) => ({
		validate: {
			minimum: (amount: number) => {
				if (amount < (minimum || 0)) {
					return t("EXCHANGE.VALIDATION.MIN_AMOUNT", { amount: minimum, ticker });
				}

				return true;
			},
			required: (amount: number) => {
				if (!amount) {
					return t("COMMON.VALIDATION.FIELD_REQUIRED", {
						field: t("EXCHANGE.EXCHANGE_FORM.PAYIN_AMOUNT"),
					}).toString();
				}

				return true;
			},
		},
	}),
	payoutAmount: (minimum?: number, ticker?: string) => ({
		validate: {
			minimum: (amount: number) => {
				if (amount < (minimum || 0)) {
					return t("EXCHANGE.VALIDATION.MIN_AMOUNT", { amount: minimum, ticker });
				}

				return true;
			},
			required: (amount: number) => {
				if (!amount) {
					return t("COMMON.VALIDATION.FIELD_REQUIRED", {
						field: t("EXCHANGE.EXCHANGE_FORM.PAYOUT_AMOUNT"),
					}).toString();
				}

				return true;
			},
		},
	}),
	recipientWallet: (exchangeService: ExchangeService, currency: string) => ({
		required: t("COMMON.VALIDATION.FIELD_REQUIRED", {
			field: t("EXCHANGE.EXCHANGE_FORM.RECIPIENT_WALLET"),
		}),
		validate: async (address: string) => {
			try {
				const isValid = await exchangeService.validateAddress(currency.toLowerCase(), address);

				if (!isValid) {
					return t("EXCHANGE.VALIDATION.INVALID_ADDRESS", {
						ticker: currency.toUpperCase(),
					});
				}

				return true;
			} catch {
				return true;
			}
		},
	}),
	refundWallet: (exchangeService: ExchangeService, currency: string) => ({
		validate: async (address: string) => {
			if (!address) {
				return true;
			}

			try {
				const isValid = await exchangeService.validateAddress(currency.toLowerCase(), address);

				if (!isValid) {
					return t("EXCHANGE.VALIDATION.INVALID_ADDRESS", {
						ticker: currency.toUpperCase(),
					});
				}

				return true;
			} catch {
				return true;
			}
		},
	}),
	toCurrency: () => ({
		required: t("COMMON.VALIDATION.FIELD_REQUIRED", {
			field: t("EXCHANGE.EXCHANGE_FORM.TO_CURRENCY"),
		}),
	}),
});
