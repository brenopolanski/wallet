import { Amount } from "app/components/Amount";
import { Checkbox } from "app/components/Checkbox";
import { FormField } from "app/components/Form";
import { Icon } from "app/components/Icon";
import { Link } from "app/components/Link";
import { TruncateMiddleDynamic } from "app/components/TruncateMiddleDynamic";
import { useExchangeContext } from "domains/exchange/contexts/Exchange";
import React from "react";
import { useFormContext } from "react-hook-form";
import { Trans, useTranslation } from "react-i18next";

export const ReviewStep = () => {
	const { t } = useTranslation();

	const { provider: exchangeProvider } = useExchangeContext();

	const { register, watch } = useFormContext();
	const { exchangeRate, estimatedTime, payinAmount, payoutAmount, fromCurrency, toCurrency, recipientWallet } =
		watch();

	return (
		<div data-testid="ExchangeForm__review-step" className="space-y-6">
			<div className="flex flex-col border rounded-xl border-theme-secondary-300 dark:border-theme-secondary-800">
				<div className="flex flex-col py-5 px-6">
					<span className="text-theme-secondary-500 dark:text-theme-secondary-700 text-sm font-semibold">
						{t("EXCHANGE.EXCHANGE_FORM.YOU_SEND")}
					</span>
					<Amount value={payinAmount} ticker={fromCurrency?.coin} className="text-lg font-semibold" />
					<span className="text-xs font-semibold">
						1 {fromCurrency?.coin.toUpperCase()} ≈ <Amount value={exchangeRate} ticker={toCurrency?.coin} />
					</span>
				</div>

				<div className="border-t border-theme-secondary-300 dark:border-theme-secondary-800 relative">
					<div className="absolute flex items-center justify-center w-11 h-11 top-1/2 transform -translate-y-1/2 right-6 bg-theme-background border-theme-secondary-300 dark:border-theme-secondary-800 border rounded-full">
						<Icon name="MoneyCoinSwap" size="lg" />
					</div>
				</div>

				<div className="flex flex-col py-5 px-6">
					<span className="text-theme-secondary-500 dark:text-theme-secondary-700 text-sm font-semibold">
						{t("EXCHANGE.EXCHANGE_FORM.YOU_GET")}
					</span>
					<Amount value={payoutAmount} ticker={toCurrency?.coin} className="text-lg font-semibold" />
					<TruncateMiddleDynamic value={recipientWallet} className="text-xs font-semibold no-ligatures" />
				</div>
			</div>

			{estimatedTime && (
				<div className="flex flex-col">
					<span className="text-theme-secondary-500 dark:text-theme-secondary-700 text-sm font-semibold">
						{t("EXCHANGE.EXCHANGE_FORM.ESTIMATED_ARRIVAL")}
					</span>
					<span className="text-lg font-semibold">
						{t("EXCHANGE.EXCHANGE_FORM.ESTIMATED_TIME", { estimatedTime })}
					</span>
				</div>
			)}

			<FormField name="hasAgreedToTerms">
				<label className="flex items-center space-x-3 w-max cursor-pointer">
					<Checkbox name="hasAgreedToTerms" ref={register({ required: true })} />
					<span>
						<Trans
							i18nKey="EXCHANGE.EXCHANGE_FORM.TERMS"
							values={{
								exchange: "ChangeNOW",
								privacy: "Privacy Policy",
								terms: "Terms of Use",
							}}
							components={{
								linkPrivacyPolicy: <Link to={exchangeProvider?.privacyPolicy} isExternal />,
								linkTerms: <Link to={exchangeProvider?.termsOfService} isExternal />,
							}}
						/>
					</span>
				</label>
			</FormField>
		</div>
	);
};
