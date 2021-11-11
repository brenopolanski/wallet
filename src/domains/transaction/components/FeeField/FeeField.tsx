import { isEqual } from "@arkecosystem/utils";
import { Contracts } from "@payvo/profiles";
import { Networks } from "@payvo/sdk";
import { useDebounce, useFees } from "app/hooks";
import { toasts } from "app/services";
import { InputFee } from "domains/transaction/components/InputFee";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

interface Properties {
	type: string;
	data: Record<string, any> | undefined;
	network: Networks.Network;
	profile: Contracts.IProfile;
}

export const FeeField: React.FC<Properties> = ({ type, network, profile, ...properties }: Properties) => {
	const isMounted = useRef(true);
	const { t } = useTranslation();

	const { calculate } = useFees(profile);

	const [isLoadingFee, setIsLoadingFee] = useState(false);

	const { setError, clearErrors, watch, setValue, getValues } = useFormContext();
	const { fees, inputFeeSettings = {} } = watch(["fees", "inputFeeSettings"]);

	// getValues does not get the value of `defaultValues` on first render
	const [defaultFee] = useState(() => watch("fee"));
	const fee = getValues("fee") || defaultFee;

	const [data, isLoadingData] = useDebounce(properties.data, 700);

	const isCalculatingFee = useMemo(() => isLoadingData || isLoadingFee, [isLoadingData, isLoadingFee]);
	const usesSizeBasedFee = useMemo(() => network.feeType() === "size", [network]);
	const usesStaticFee = useMemo(() => network.feeType() !== "dynamic" || !fees?.isDynamic, [fees, network]);

	const showFeeChangedToast = () => {
		toasts.warning(t("TRANSACTION.PAGE_TRANSACTION_SEND.FORM_STEP.FEE_UPDATE"));
	};

	useEffect(() => {
		if (usesSizeBasedFee || type === "multiSignature") {
			if (isCalculatingFee) {
				// This message does not need i18n as it is only intended to mark
				// the form as invalid until fee calculation has been completed.
				setError("feeCalculation", { message: "fee calculation not completed" });
			} else {
				clearErrors("feeCalculation");
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isCalculatingFee, setError, clearErrors, usesSizeBasedFee]);

	useEffect(() => {
		const recalculateFee = async () => {
			// Set fees to 0 when fee type is "size" but current form data
			// is not sufficient yet to calculate the transaction fees.
			if (usesSizeBasedFee) {
				const resetFees = () => {
					setValue("fees", { avg: 0, max: 0, min: 0, static: 0 });
				};

				if (data === undefined) {
					return resetFees();
				}

				if (type === "transfer" && (!data.amount || !data.to)) {
					return resetFees();
				}

				if (type === "multiPayment" && !data.payments?.length) {
					return resetFees();
				}

				if (type === "vote" && !data.votes?.length && !data.unvotes?.length) {
					return resetFees();
				}

				if (type === "delegateRegistration" && !data.username) {
					return resetFees();
				}

				if (type === "secondSignature" && !data.mnemonic) {
					return resetFees();
				}
			}

			setIsLoadingFee(true);

			const transactionFees = await calculate({
				coin: network.coin(),
				data,
				network: network.id(),
				type,
			});

			if (!isEqual(getValues("fees"), transactionFees)) {
				if (
					network.feeType() === "static" ||
					transactionFees.isDynamic === false ||
					getValues("fee") === undefined
				) {
					const newFee = transactionFees.isDynamic ? transactionFees.avg : transactionFees.static;

					if (getValues("fee") !== undefined) {
						showFeeChangedToast();
					}

					setValue("fee", newFee, { shouldDirty: true, shouldValidate: true });
				}

				if (usesSizeBasedFee && +getValues("fee") < +transactionFees.min) {
					setValue("fee", transactionFees.min, { shouldDirty: true, shouldValidate: true });

					showFeeChangedToast();
				}

				setValue("fees", transactionFees, { shouldDirty: true, shouldValidate: true });
			}

			/* istanbul ignore next */
			if (isMounted.current) {
				setIsLoadingFee(false);
			}
		};

		recalculateFee();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [calculate, data, getValues, isMounted, network, setValue, type, usesSizeBasedFee]);

	useEffect(
		/* istanbul ignore next */
		() => () => {
			isMounted.current = false;
		},
		[],
	);

	return (
		<InputFee
			min={fees?.min}
			avg={fees?.avg}
			max={fees?.max}
			loading={!fees || isLoadingFee}
			value={fee}
			step={0.01}
			disabled={usesStaticFee && !usesSizeBasedFee}
			network={network}
			profile={profile}
			onChange={(value) => {
				setValue("fee", value, { shouldDirty: true, shouldValidate: true });
			}}
			viewType={inputFeeSettings.viewType}
			onChangeViewType={(viewType) => {
				setValue(
					"inputFeeSettings",
					{ ...inputFeeSettings, viewType },
					{ shouldDirty: true, shouldValidate: true },
				);
			}}
			simpleValue={inputFeeSettings.simpleValue}
			onChangeSimpleValue={(simpleValue) => {
				setValue(
					"inputFeeSettings",
					{ ...inputFeeSettings, simpleValue },
					{ shouldDirty: true, shouldValidate: true },
				);
			}}
		/>
	);
};
