import { Contracts } from "@payvo/sdk-profiles";
import { Alert } from "app/components/Alert";
import { Icon } from "app/components/Icon";
import { Spinner } from "app/components/Spinner";
import cn from "classnames";
import React from "react";
import { useTranslation } from "react-i18next";

interface StatusIconProperties {
	label?: string;
	isDone: boolean;
	isLoading: boolean;
}

const StatusIcon = ({ label, isDone, isLoading }: StatusIconProperties) => {
	const renderIcon = () => {
		if (isDone) {
			return (
				<div
					data-testid="StatusIcon__check-mark"
					className="flex items-center justify-center w-8 h-8 rounded-full bg-theme-primary-100 dark:bg-theme-secondary-800 text-theme-primary-600 dark:text-theme-secondary-200"
				>
					<Icon name="CheckmarkSmall" size="sm" />
				</div>
			);
		}

		if (isLoading) {
			return (
				<span data-testid="StatusIcon__spinner">
					<Spinner />
				</span>
			);
		}

		return (
			<div
				data-testid="StatusIcon__empty"
				className="w-8 h-8 rounded-full border-2 border-theme-secondary-300 dark:border-theme-secondary-800"
			/>
		);
	};

	return (
		<div className="flex flex-col w-8 items-center space-y-2">
			{renderIcon()}
			<span
				className={cn(
					"font-semibold whitespace-nowrap text-sm",
					isDone
						? "text-theme-secondary-700 dark:text-theme-secondary-600"
						: "text-theme-secondary-500 dark:text-theme-secondary-700",
				)}
			>
				{label}
			</span>
		</div>
	);
};

const StatusSpacer = ({ isActive }: { isActive: boolean }) => (
	<div className="flex items-center h-8 flex-1 px-2">
		<div
			className={cn(
				"w-full h-0.5 rounded-l rounded-r",
				isActive ? "bg-theme-primary-600" : "bg-theme-secondary-300 dark:bg-theme-secondary-800",
			)}
		/>
	</div>
);

const ExchangeStatus = ({ exchangeTransaction }: { exchangeTransaction: Contracts.IExchangeTransaction }) => {
	const { t } = useTranslation();

	if (exchangeTransaction.isFailed()) {
		return (
			<Alert className="my-6" variant="danger">
				{t("EXCHANGE.TRANSACTION_STATUS.FAILED")}
			</Alert>
		);
	}

	if (exchangeTransaction.isRefunded()) {
		return (
			<Alert className="my-6" variant="warning">
				{t("EXCHANGE.TRANSACTION_STATUS.REFUNDED")}
			</Alert>
		);
	}

	// if (exchangeTransaction.isVerifying()) {
	if (exchangeTransaction.status() === Contracts.ExchangeTransactionStatus.Verifying) {
		return (
			<Alert className="my-6" variant="warning">
				{t("EXCHANGE.TRANSACTION_STATUS.VERIFYING")}
			</Alert>
		);
	}

	if (exchangeTransaction.isExpired()) {
		return (
			<Alert className="my-6" variant="danger">
				{t("EXCHANGE.TRANSACTION_STATUS.EXPIRED")}
			</Alert>
		);
	}

	const status = exchangeTransaction.status();

	return (
		<div className="my-6 flex items-top justify-center px-20">
			<StatusIcon
				label={t("EXCHANGE.TRANSACTION_STATUS.AWAITING_DEPOSIT")}
				isDone={status > Contracts.ExchangeTransactionStatus.Confirming}
				isLoading={
					status >= Contracts.ExchangeTransactionStatus.New &&
					status <= Contracts.ExchangeTransactionStatus.Confirming
				}
			/>

			<StatusSpacer isActive={status >= Contracts.ExchangeTransactionStatus.Exchanging} />

			<StatusIcon
				label={t("EXCHANGE.TRANSACTION_STATUS.EXCHANGING")}
				isDone={status > Contracts.ExchangeTransactionStatus.Exchanging}
				isLoading={
					status > Contracts.ExchangeTransactionStatus.Confirming &&
					status <= Contracts.ExchangeTransactionStatus.Sending
				}
			/>

			<StatusSpacer isActive={status >= Contracts.ExchangeTransactionStatus.Sending} />

			<StatusIcon
				label={t("EXCHANGE.TRANSACTION_STATUS.SENDING")}
				isDone={status > Contracts.ExchangeTransactionStatus.Sending}
				isLoading={status > Contracts.ExchangeTransactionStatus.Exchanging}
			/>
		</div>
	);
};

export { ExchangeStatus };
