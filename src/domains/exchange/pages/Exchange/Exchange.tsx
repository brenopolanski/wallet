import { upperFirst } from "@payvo/sdk-helpers";
import { Contracts } from "@payvo/sdk-profiles";
import { Header } from "app/components/Header";
import { Page, Section } from "app/components/Layout";
import { useActiveProfile } from "app/hooks";
import { toasts } from "app/services";
import { DeleteExchangeTransaction } from "domains/exchange/components/DeleteExchangeTransaction";
import { ExchangeGrid } from "domains/exchange/components/ExchangeGrid";
import { ExchangeNavigationBar } from "domains/exchange/components/ExchangeNavigationBar";
import { ExchangeTransactionsTable } from "domains/exchange/components/ExchangeTransactionsTable";
import { useExchangeContext } from "domains/exchange/contexts/Exchange";
import { OrderStatusResponse } from "domains/exchange/contracts";
import { useOrderStatus } from "domains/exchange/hooks/use-order-status";
import { assertExchangeTransaction } from "domains/exchange/utils";
import React, { useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { assertString } from "utils/assertions";
import { delay } from "utils/delay";

enum ExchangeView {
	Exchanges = "EXCHANGES",
	Transactions = "TRANSACTIONS",
}

export const Exchange = () => {
	const { t } = useTranslation();

	const activeProfile = useActiveProfile();
	const history = useHistory();

	const [currentView, setCurrentView] = useState<ExchangeView>(ExchangeView.Exchanges);

	const [selectedExchangeTransaction, setSelectedExchangeTransaction] =
		useState<Contracts.IExchangeTransaction | null>(null);

	const { exchangeProviders, fetchProviders } = useExchangeContext();
	const { checkOrderStatus, prepareParameters } = useOrderStatus();

	useEffect(() => {
		let timeout: NodeJS.Timeout;

		const handleStatusChange = (orderStatus: OrderStatusResponse) => {
			const exchangeTransaction = activeProfile
				.exchangeTransactions()
				.values()
				.find(
					(exchangeTransaction: Contracts.IExchangeTransaction) =>
						exchangeTransaction.provider() === orderStatus.providerId &&
						exchangeTransaction.orderId() === orderStatus.id,
				);

			assertExchangeTransaction(exchangeTransaction);

			const parameters = prepareParameters(exchangeTransaction, orderStatus);
			activeProfile.exchangeTransactions().update(exchangeTransaction.id(), parameters);
		};

		const fetchStatus = async () => {
			const responses = await checkOrderStatus(activeProfile.exchangeTransactions().pending());

			if (responses) {
				for (const response of Object.values(responses)) {
					handleStatusChange(response);
				}
			}

			timeout = delay(fetchStatus, 15_000);
		};

		fetchStatus();

		return () => clearTimeout(timeout);
	}, [activeProfile, checkOrderStatus, prepareParameters]);

	useEffect(() => {
		const _fetchProviders = async () => fetchProviders();

		if (!exchangeProviders) {
			_fetchProviders();
		}
	}, [exchangeProviders, fetchProviders]);

	const handleLaunchExchange = (exchangeId: string) => {
		history.push(`/profiles/${activeProfile.id()}/exchange/view?exchangeId=${exchangeId}`);
	};

	const handleViewChange = (view?: string | number) => {
		assertString(view);

		const value = ExchangeView[upperFirst(view.toLowerCase()) as keyof typeof ExchangeView];

		setCurrentView(value);
	};

	const handleDelete = (exchangeTransaction: Contracts.IExchangeTransaction) => {
		setSelectedExchangeTransaction(null);

		toasts.success(
			<Trans
				i18nKey="EXCHANGE.PAGE_EXCHANGES.DELETE_CONFIRMATION"
				values={{ orderId: exchangeTransaction.orderId() }}
				components={{ bold: <strong /> }}
			/>,
		);
	};

	const renderContent = () => {
		if (currentView === ExchangeView.Exchanges) {
			return (
				<ExchangeGrid
					exchanges={exchangeProviders || []}
					isLoading={!exchangeProviders}
					onClick={handleLaunchExchange}
				/>
			);
		}

		return (
			<>
				<ExchangeTransactionsTable
					exchangeTransactions={activeProfile.exchangeTransactions().values()}
					isCompact={!activeProfile.appearance().get("useExpandedTables")}
					onClick={(providerId: string, orderId: string) => {
						history.push(
							`/profiles/${activeProfile.id()}/exchange/view?exchangeId=${providerId}&orderId=${orderId}`,
						);
					}}
					onRemove={(exchangeTransaction: Contracts.IExchangeTransaction) =>
						setSelectedExchangeTransaction(exchangeTransaction)
					}
				/>

				{selectedExchangeTransaction && (
					<DeleteExchangeTransaction
						isOpen={!!selectedExchangeTransaction}
						exchangeTransaction={selectedExchangeTransaction}
						profile={activeProfile}
						onCancel={() => setSelectedExchangeTransaction(null)}
						onClose={() => setSelectedExchangeTransaction(null)}
						onDelete={handleDelete}
					/>
				)}
			</>
		);
	};

	return (
		<>
			<Page isBackDisabled={true} data-testid="Exchange">
				<Section>
					<Header
						title={t("EXCHANGE.PAGE_EXCHANGES.TITLE")}
						subtitle={t("EXCHANGE.PAGE_EXCHANGES.SUBTITLE")}
					/>
				</Section>

				<ExchangeNavigationBar
					currentView={currentView}
					exchangeTransactionsCount={activeProfile.exchangeTransactions().count()}
					onChange={handleViewChange}
				/>

				<Section>{renderContent()}</Section>
			</Page>
		</>
	);
};
