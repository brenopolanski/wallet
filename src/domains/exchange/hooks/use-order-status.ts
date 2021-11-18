import { UUID } from "@payvo/sdk-cryptography";
import { Contracts } from "@payvo/sdk-profiles";
import { httpClient } from "app/services";
import { OrderStatusResponse } from "domains/exchange/contracts";
import { ExchangeService } from "domains/exchange/services/exchange.service";
import { useCallback } from "react";

export const useOrderStatus = () => {
	const checkOrderStatus = useCallback(async (exchangeTransactions: Contracts.IExchangeTransaction[]) => {
		const exchangeServices: Record<string, ExchangeService> = {};

		try {
			const allStatuses = await Promise.all(
				exchangeTransactions.map((exchangeTransaction: Contracts.IExchangeTransaction) => {
					/* istanbul ignore else */
					if (!exchangeServices[exchangeTransaction.provider()]) {
						exchangeServices[exchangeTransaction.provider()] = new ExchangeService(
							exchangeTransaction.provider(),
							httpClient,
						);
					}

					return exchangeServices[exchangeTransaction.provider()].orderStatus(exchangeTransaction.orderId(), {
						t: UUID.random(),
					});
				}),
			);

			return allStatuses.reduce((statuses, response) => {
				statuses[response.id] = response;
				return statuses;
			}, {} as Record<string, OrderStatusResponse>);
		} catch {
			//
		}
	}, []);

	const prepareParameters = useCallback(
		(exchangeTransaction: Contracts.IExchangeTransaction, orderStatus: OrderStatusResponse) => {
			const result = {
				input: { ...exchangeTransaction.input() },
				output: { ...exchangeTransaction.output() },
				status: orderStatus.status,
			};

			if (orderStatus.payinHash) {
				result.input.hash = orderStatus.payinHash;
			}

			if (orderStatus.payoutHash) {
				result.output.hash = orderStatus.payoutHash;
			}

			if (orderStatus.amountTo && orderStatus.amountTo !== exchangeTransaction.output().amount) {
				result.output.amount = orderStatus.amountTo;
			}

			return result;
		},
		[],
	);

	return {
		checkOrderStatus,
		prepareParameters,
	};
};
