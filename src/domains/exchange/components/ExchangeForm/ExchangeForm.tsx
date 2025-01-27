import { Contracts } from "@payvo/sdk-profiles";
import { Button } from "app/components/Button";
import { Form } from "app/components/Form";
import { StepIndicator } from "app/components/StepIndicator";
import { TabPanel, Tabs } from "app/components/Tabs";
import { useEnvironmentContext } from "app/contexts";
import { useActiveProfile, useValidation } from "app/hooks";
import { toasts } from "app/services";
import { useExchangeContext } from "domains/exchange/contexts/Exchange";
import { ExchangeFormState, Order } from "domains/exchange/contracts";
import {
	assertCurrency,
	assertExchangeService,
	assertExchangeTransaction,
	isInvalidAddressError,
	isInvalidRefundAddressError,
} from "domains/exchange/utils";
import React, { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { delay } from "utils/delay";

import { ConfirmationStep } from "./ConfirmationStep";
import { FormStep } from "./FormStep";
import { ReviewStep } from "./ReviewStep";
import { StatusStep } from "./StatusStep";

enum Step {
	FormStep = 1,
	ReviewStep,
	StatusStep,
	ConfirmationStep,
}

const ExchangeForm = ({ orderId, onReady }: { orderId?: string; onReady: () => void }) => {
	const { t } = useTranslation();

	const [isFinished, setIsFinished] = useState(false);

	const activeProfile = useActiveProfile();
	const { persist } = useEnvironmentContext();
	const { exchangeService, provider } = useExchangeContext();
	const { exchangeOrder } = useValidation();
	const history = useHistory();

	assertExchangeService(exchangeService);

	const [exchangeTransaction, setExchangeTransaction] = useState<Contracts.IExchangeTransaction | undefined>();
	const [activeTab, setActiveTab] = useState<Step>(Step.FormStep);
	const [showRefundInput, setShowRefundInput] = useState(false);

	const form = useForm<ExchangeFormState>({ mode: "onChange" });

	const { clearErrors, formState, getValues, handleSubmit, register, trigger, setValue, watch } = form;
	const { isDirty, isSubmitting, isValid } = formState;

	const { currencies, fromCurrency, toCurrency, minPayinAmount, minPayoutAmount, recipientWallet, refundWallet } =
		watch();

	useEffect(() => {
		const fetchCurrencies = async () => {
			try {
				const currencies = await exchangeService.currencies();
				setValue("currencies", currencies);
			} catch {
				//
			}
		};

		fetchCurrencies();
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		const initExchangeTransaction = async () => {
			if (currencies && provider) {
				const transaction = activeProfile
					.exchangeTransactions()
					.values()
					.find((order) => order.orderId() === orderId && order.provider() === provider.slug);

				assertExchangeTransaction(transaction);

				setExchangeTransaction(transaction);
				setActiveTab(transaction.isFinished() ? Step.ConfirmationStep : Step.StatusStep);

				let extendedCurrency: any;

				const fromCurrency = currencies.find(({ coin }: any) => coin === transaction.input().ticker);

				assertCurrency(fromCurrency);

				extendedCurrency = await exchangeService.currency(fromCurrency.coin);
				setValue("fromCurrency", { ...fromCurrency, ...extendedCurrency });

				const toCurrency = currencies.find(({ coin }: any) => coin === transaction.output().ticker);

				assertCurrency(toCurrency);

				extendedCurrency = await exchangeService.currency(toCurrency.coin);
				setValue("toCurrency", { ...toCurrency, ...extendedCurrency });

				onReady();
			}
		};

		if (orderId) {
			initExchangeTransaction();
		} else {
			onReady();
		}
	}, [activeProfile, currencies, exchangeService, exchangeTransaction, orderId, provider, setValue, onReady]);

	useEffect(() => {
		register("currencies");

		register("payinAmount", exchangeOrder.payinAmount(minPayinAmount, fromCurrency?.coin.toUpperCase()));
		register("payoutAmount", exchangeOrder.payoutAmount(minPayoutAmount, toCurrency?.coin.toUpperCase()));
		register("recipientWallet", exchangeOrder.recipientWallet(exchangeService, toCurrency?.coin));
		register("refundWallet", exchangeOrder.refundWallet(exchangeService, fromCurrency?.coin));

		register("externalId");
		register("refundExternalId");

		register("fromCurrency", exchangeOrder.fromCurrency());
		register("toCurrency", exchangeOrder.toCurrency());

		register("minPayinAmount");
		register("minPayoutAmount");
		register("exchangeRate");

		register("estimatedTime");

		if (recipientWallet) {
			if (toCurrency) {
				trigger("recipientWallet");
			} else {
				clearErrors("recipientWallet");
			}
		}

		if (refundWallet) {
			if (fromCurrency) {
				trigger("refundWallet");
			} else {
				clearErrors("refundWallet");
			}
		}
	}, [
		clearErrors,
		exchangeOrder,
		exchangeService,
		fromCurrency,
		minPayinAmount,
		minPayoutAmount,
		recipientWallet,
		refundWallet,
		register,
		t,
		toCurrency,
		trigger,
	]);

	const submitForm = useCallback(async () => {
		const { fromCurrency, toCurrency, recipientWallet, refundWallet, payinAmount, externalId, refundExternalId } =
			getValues();

		const orderParameters: Order = {
			address: recipientWallet,
			amount: +payinAmount,
			from: fromCurrency?.coin,
			to: toCurrency?.coin,
		};

		if (showRefundInput && refundWallet) {
			orderParameters.refundAddress = refundWallet;
		}

		/* istanbul ignore next */
		if (toCurrency?.hasExternalId && externalId) {
			orderParameters.externalId = externalId;

			if (refundExternalId) {
				orderParameters.refundExternalId = refundExternalId;
			}
		}

		const order = await exchangeService.createOrder(orderParameters);

		const exchangeTransaction = activeProfile.exchangeTransactions().create({
			input: {
				address: order.payinAddress,
				amount: order.amountFrom,
				ticker: order.from,
			},
			orderId: order.id,
			output: {
				address: order.payoutAddress,
				amount: order.amountTo,
				ticker: order.to,
			},
			provider: provider!.slug,
		});

		await persist();

		setExchangeTransaction(exchangeTransaction);
	}, [activeProfile, exchangeService, getValues, persist, provider, showRefundInput]);

	const handleBack = () => {
		if (activeTab === Step.FormStep) {
			history.push(`/profiles/${activeProfile.id()}/exchange`);
		}

		setActiveTab((prev) => prev - 1);
	};

	const handleNext = useCallback(async () => {
		const newIndex = activeTab + 1;

		if (newIndex === Step.StatusStep) {
			try {
				await handleSubmit(submitForm)();
				setActiveTab(newIndex);
			} catch (error) {
				if (isInvalidAddressError(error)) {
					return toasts.error(
						t("EXCHANGE.ERROR.INVALID_ADDRESS", { ticker: toCurrency?.coin.toUpperCase() }),
					);
				}

				if (isInvalidRefundAddressError(error)) {
					return toasts.error(
						t("EXCHANGE.ERROR.INVALID_REFUND_ADDRESS", { ticker: fromCurrency?.coin.toUpperCase() }),
					);
				}

				toasts.error(t("EXCHANGE.ERROR.GENERIC"));
			}

			return;
		}

		setActiveTab(newIndex);
	}, [activeTab, fromCurrency, handleSubmit, submitForm, t, toCurrency]);

	const handleStatusUpdate = useCallback(
		(id: string, parameters: any) => {
			activeProfile.exchangeTransactions().update(id, parameters);

			if (parameters.status === Contracts.ExchangeTransactionStatus.Finished) {
				setIsFinished(true);
			}
		},
		[activeProfile],
	);

	useEffect(() => {
		let timeout: NodeJS.Timeout;

		if (isFinished) {
			timeout = delay(handleNext, 5000);
		}

		return () => clearTimeout(timeout);
	}, [handleNext, isFinished]);

	const renderRefundToggle = () => {
		if (showRefundInput) {
			return (
				<button
					data-testid="ExchangeForm__remove-refund-address"
					type="button"
					className="link font-semibold text-sm"
					onClick={() => setShowRefundInput(false)}
				>
					{t("EXCHANGE.REFUND_WALLET.REMOVE")}
				</button>
			);
		}

		return (
			<button
				data-testid="ExchangeForm__add-refund-address"
				type="button"
				className="link font-semibold text-sm"
				onClick={() => setShowRefundInput(true)}
			>
				{t("EXCHANGE.REFUND_WALLET.ADD")}
			</button>
		);
	};

	return (
		<Form data-testid="ExchangeForm" context={form as any} onSubmit={submitForm}>
			<Tabs activeId={activeTab}>
				<StepIndicator size={4} activeIndex={activeTab} />

				<div className="mt-8">
					<TabPanel tabId={1}>
						<FormStep profile={activeProfile} showRefundInput={showRefundInput} />
					</TabPanel>

					<TabPanel tabId={2}>
						<ReviewStep />
					</TabPanel>

					<TabPanel tabId={3}>
						<StatusStep exchangeTransaction={exchangeTransaction!} onUpdate={handleStatusUpdate} />
					</TabPanel>

					<TabPanel tabId={4}>
						<ConfirmationStep exchangeTransaction={exchangeTransaction} />
					</TabPanel>

					<div className="flex items-center justify-end mt-8 space-x-3">
						{activeTab < Step.StatusStep && (
							<>
								{activeTab === Step.FormStep && <div className="mr-auto">{renderRefundToggle()}</div>}

								<Button
									data-testid="ExchangeForm__back-button"
									disabled={isSubmitting}
									variant="secondary"
									onClick={handleBack}
								>
									{t("COMMON.BACK")}
								</Button>

								<Button
									data-testid="ExchangeForm__continue-button"
									disabled={isSubmitting || (isDirty ? !isValid : true)}
									isLoading={isSubmitting}
									onClick={handleNext}
								>
									{t("COMMON.CONTINUE")}
								</Button>
							</>
						)}

						{activeTab === Step.ConfirmationStep && (
							<Button
								data-testid="ExchangeForm__finish-button"
								onClick={() => history.push(`/profiles/${activeProfile.id()}/dashboard`)}
							>
								{t("COMMON.GO_TO_PORTFOLIO")}
							</Button>
						)}
					</div>
				</div>
			</Tabs>
		</Form>
	);
};

export { ExchangeForm };
