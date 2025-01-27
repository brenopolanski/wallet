import { Contracts as ProfileContracts } from "@payvo/sdk-profiles";
import { useEnvironmentContext } from "app/contexts";
import { useActiveProfile } from "app/hooks";
import { FeeWarningVariant } from "domains/transaction/components/FeeWarning";
import { useCallback, useEffect, useMemo, useState } from "react";
import { TransactionFees } from "types";

type CallbackFunction = () => void;

export const useFeeConfirmation = (fee: number | string, fees: TransactionFees) => {
	const [showFeeWarning, setShowFeeWarning] = useState(false);
	const [feeWarningVariant, setFeeWarningVariant] = useState<FeeWarningVariant | undefined>();

	const activeProfile = useActiveProfile();
	const { persist } = useEnvironmentContext();

	useEffect(() => {
		if (!fee) {
			return;
		}

		if (+fee < fees?.min) {
			setFeeWarningVariant(FeeWarningVariant.Low);
		}

		if (+fee > fees?.static) {
			setFeeWarningVariant(FeeWarningVariant.High);
		}

		if (+fee >= fees?.min && +fee <= fees?.static) {
			setFeeWarningVariant(undefined);
		}
	}, [fee, fees]);

	const dismissFeeWarning = useCallback(
		async (callback: CallbackFunction, suppressWarning: boolean) => {
			setShowFeeWarning(false);

			if (suppressWarning) {
				activeProfile.settings().set(ProfileContracts.ProfileSetting.DoNotShowFeeWarning, true);

				await persist();
			}

			const result: any = callback();

			if (result instanceof Promise) {
				await result;
			}
		},
		[activeProfile, persist],
	);

	const requireFeeConfirmation = useMemo(
		() =>
			feeWarningVariant !== undefined &&
			!activeProfile.settings().get(ProfileContracts.ProfileSetting.DoNotShowFeeWarning),
		[activeProfile, feeWarningVariant],
	);

	return {
		dismissFeeWarning,
		feeWarningVariant,
		requireFeeConfirmation,
		setShowFeeWarning,
		showFeeWarning,
	};
};
