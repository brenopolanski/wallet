import { Amount } from "app/components/Amount";
import { Button } from "app/components/Button";
import { Circle } from "app/components/Circle";
import { Skeleton } from "app/components/Skeleton";
import { CurrencyData } from "domains/exchange/contracts";
import React from "react";
import { useTranslation } from "react-i18next";

interface CurrencyIconProperties {
	image?: string;
	ticker?: string;
}

const CurrencyIcon = ({ image, ticker }: CurrencyIconProperties) => {
	if (!image) {
		return (
			<Circle
				size="sm"
				className="bg-theme-secondary-200 border-theme-secondary-200 dark:bg-theme-secondary-700 dark:border-theme-secondary-700 ring-theme-background"
				noShadow
			/>
		);
	}

	return (
		<div className="flex items-center justify-center w-8 h-8">
			<img src={image} alt={`${ticker?.toUpperCase()} Icon`} className="w-full h-full" />
		</div>
	);
};

interface FormDividerProperties {
	isLoading: boolean;
	exchangeRate: number;
	fromCurrency: CurrencyData;
	toCurrency: CurrencyData;
	onSwapCurrencies: () => void;
}

const FormDivider = ({
	isLoading,
	exchangeRate,
	fromCurrency,
	toCurrency,
	onSwapCurrencies,
}: FormDividerProperties) => {
	const { t } = useTranslation();

	const renderExchangeRate = () => {
		if (isLoading) {
			return <Skeleton width={200} height={14} />;
		}

		if (exchangeRate) {
			return (
				<span data-testid="FormDivider__exchange-rate">
					1 {fromCurrency?.coin.toUpperCase()} ≈ <Amount value={exchangeRate} ticker={toCurrency?.coin} />
				</span>
			);
		}

		return <span>{t("COMMON.NOT_AVAILABLE")}</span>;
	};

	return (
		<div className="flex ml-8 space-x-8">
			<div className="relative h-20 my-1 border-l border-theme-secondary-300 dark:border-theme-secondary-800">
				<div className="absolute w-2 h-2 rounded-full border border-theme-secondary-300 dark:border-theme-secondary-800 bg-theme-background top-1/2 transform -translate-x-1/2 -translate-y-1/2" />
			</div>

			<div className="flex flex-1 items-center">
				<div className="flex items-center space-x-2 text-sm">
					<span className="font-semibold text-theme-primary-600 border-b border-theme-primary-600 border-dashed mt-px">
						{t("EXCHANGE.EXCHANGE_FORM.ESTIMATED_RATE")}:
					</span>
					{renderExchangeRate()}
				</div>

				<Button
					data-testid="ExchangeForm__swap-button"
					className="ml-auto"
					size="icon"
					variant="secondary"
					icon="ArrowDownUp"
					disabled={!fromCurrency && !toCurrency}
					onClick={onSwapCurrencies}
				/>
			</div>
		</div>
	);
};

export { CurrencyIcon, FormDivider };
