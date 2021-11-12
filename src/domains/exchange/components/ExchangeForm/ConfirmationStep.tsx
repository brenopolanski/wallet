import { Contracts } from "@payvo/profiles";
import { Amount } from "app/components/Amount";
import { Clipboard } from "app/components/Clipboard";
import { Icon } from "app/components/Icon";
import { Image } from "app/components/Image";
import { Label } from "app/components/Label";
import { Link } from "app/components/Link";
import { TruncateMiddleDynamic } from "app/components/TruncateMiddleDynamic";
import React, { useRef } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

interface ConfirmationStepProperties {
	exchangeTransaction?: Contracts.IExchangeTransaction;
}

interface ExplorerLinkProperties {
	value: string;
	explorerMask?: string;
}

const ExplorerLink = ({ value, explorerMask }: ExplorerLinkProperties) => {
	const ref = useRef(null);

	const explorerUrl = (value: string, explorerMask: string) => explorerMask.replace("{}", value);

	if (explorerMask) {
		return (
			<span data-testid="ExplorerLink" ref={ref} className="overflow-hidden">
				<Link to={explorerUrl(value, explorerMask)} isExternal>
					<TruncateMiddleDynamic value={value} offset={24} parentRef={ref} />
				</Link>
			</span>
		);
	}

	return <TruncateMiddleDynamic value={value} />;
};

export const ConfirmationStep = ({ exchangeTransaction }: ConfirmationStepProperties) => {
	const { t } = useTranslation();

	const { watch } = useFormContext();
	const { fromCurrency, toCurrency } = watch();

	if (!exchangeTransaction) {
		return <></>;
	}

	const renderAddress = (address: string, explorerMask?: string) => (
		<div className="flex items-center space-x-2 whitespace-nowrap text-lg font-semibold">
			<ExplorerLink value={address} explorerMask={explorerMask} />

			<span className="flex text-theme-primary-300 dark:text-theme-secondary-600">
				<Clipboard variant="icon" data={address}>
					<Icon name="Copy" />
				</Clipboard>
			</span>
		</div>
	);

	const renderHash = (hash?: string, explorerMask?: string) => {
		if (!hash) {
			return <span className="font-semibold text-lg">{t("COMMON.NOT_AVAILABLE")}</span>;
		}

		return (
			<div className="flex items-center space-x-2 whitespace-nowrap text-lg font-semibold">
				<ExplorerLink value={hash} explorerMask={explorerMask} />

				<span className="flex text-theme-primary-300 dark:text-theme-secondary-600">
					<Clipboard variant="icon" data={hash}>
						<Icon name="Copy" />
					</Clipboard>
				</span>
			</div>
		);
	};

	return (
		<div data-testid="ExchangeForm__confirmation-step" className="flex flex-col space-y-8">
			<div className="flex items-center mx-auto space-x-3">
				<Icon name="CircleCheckMark" size="xl" />
				<h2 className="font-bold text-2xl m-0">{t("EXCHANGE.EXCHANGE_FORM.TRANSACTION_COMPLETE")}</h2>
			</div>

			<div className="flex flex-col space-y-5">
				<div className="flex items-center space-x-3">
					<span className="flex items-center justify-center w-6 h-6 rounded bg-theme-primary-200 dark:bg-theme-secondary-800 font-semibold">
						1
					</span>
					<h3 className="font-bold text-lg m-0">
						{t("EXCHANGE.EXCHANGE_FORM.CURRENCY_INPUT", {
							currency: fromCurrency?.coin.toUpperCase() || "",
						})}
					</h3>
				</div>

				<div className="flex space-x-6">
					<div className="flex flex-shrink-0 items-center justify-center w-24 h-24 rounded-xl bg-theme-secondary-200 dark:bg-theme-secondary-700">
						<Image name="Wallet" domain="exchange" className="w-12" />
					</div>

					<div className="flex flex-col flex-1 space-y-4 overflow-hidden">
						<div className="flex flex-col space-y-2">
							<span className="font-semibold text-sm text-theme-secondary-500 dark:text-theme-secondary-700">
								{t("EXCHANGE.EXCHANGE_FORM.INPUT_TRANSACTION_ID")}
							</span>

							{renderHash(exchangeTransaction.input().hash, fromCurrency?.transactionExplorerMask)}
						</div>

						<div className="flex flex-col space-y-2">
							<span className="font-semibold text-sm text-theme-secondary-500 dark:text-theme-secondary-700">
								{t("EXCHANGE.EXCHANGE_FORM.EXCHANGE_ADDRESS", {
									currency: toCurrency?.coin.toUpperCase() || "",
								})}
							</span>

							{renderAddress(exchangeTransaction.input().address, fromCurrency?.addressExplorerMask)}
						</div>

						<div className="flex flex-col space-y-2">
							<span className="font-semibold text-sm text-theme-secondary-500 dark:text-theme-secondary-700">
								{t("EXCHANGE.EXCHANGE_FORM.AMOUNT_SENT")}
							</span>

							<Label color="danger" className="whitespace-nowrap mr-auto">
								<Amount
									className="text-lg font-semibold"
									value={exchangeTransaction.input().amount}
									ticker={exchangeTransaction.input().ticker}
									isNegative
									showSign
								/>
							</Label>
						</div>
					</div>
				</div>
			</div>

			<div className="px-10 -mx-10 border-t border-dashed border-theme-secondary-300 dark:border-theme-secondary-800" />

			<div className="flex flex-col space-y-5">
				<div className="flex items-center space-x-3">
					<span className="flex items-center justify-center w-6 h-6 rounded bg-theme-primary-200 dark:bg-theme-secondary-800 font-semibold">
						2
					</span>
					<h3 className="font-bold text-lg m-0">
						{t("EXCHANGE.EXCHANGE_FORM.CURRENCY_OUTPUT", {
							currency: toCurrency?.coin.toUpperCase() || "",
						})}
					</h3>
				</div>

				<div className="flex space-x-6">
					<div className="flex flex-shrink-0 items-center justify-center w-24 h-24 rounded-xl bg-theme-secondary-200 dark:bg-theme-secondary-700">
						<Image name="Exchange" domain="exchange" className="w-12" />
					</div>

					<div className="flex flex-col flex-1 space-y-4 overflow-hidden">
						<div className="flex flex-col space-y-2 w-full">
							<span className="font-semibold text-sm text-theme-secondary-500 dark:text-theme-secondary-700">
								{t("EXCHANGE.EXCHANGE_FORM.OUTPUT_TRANSACTION_ID")}
							</span>

							{renderHash(exchangeTransaction.output().hash, toCurrency?.transactionExplorerMask)}
						</div>

						<div className="flex flex-col space-y-2">
							<span className="font-semibold text-sm text-theme-secondary-500 dark:text-theme-secondary-700">
								{t("EXCHANGE.EXCHANGE_FORM.YOUR_ADDRESS", {
									currency: toCurrency?.coin.toUpperCase() || "",
								})}
							</span>

							{renderAddress(exchangeTransaction.output().address, toCurrency?.addressExplorerMask)}
						</div>

						<div className="flex flex-col space-y-2">
							<span className="font-semibold text-sm text-theme-secondary-500 dark:text-theme-secondary-700">
								{t("EXCHANGE.EXCHANGE_FORM.AMOUNT_RECEIVED")}
							</span>

							<Label color="success" className="whitespace-nowrap mr-auto">
								<Amount
									className="text-lg font-semibold"
									value={exchangeTransaction.output().amount}
									ticker={exchangeTransaction.output().ticker}
									showSign
								/>
							</Label>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
