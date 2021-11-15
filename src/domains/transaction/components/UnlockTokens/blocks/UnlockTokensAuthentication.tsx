import { Contracts } from "@payvo/sdk-profiles";
import { Button } from "app/components/Button";
import { AuthenticationStep, LedgerStates } from "domains/transaction/components/AuthenticationStep";
import { UnlockTokensFormState } from "domains/transaction/components/UnlockTokens/UnlockTokens.contracts";
import React from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

type Properties = LedgerStates & {
	wallet: Contracts.IReadWriteWallet;
	onBack: () => void;
};

export const UnlockTokensAuthentication: React.FC<Properties> = ({
	wallet,
	onBack,
	ledgerIsAwaitingDevice,
	ledgerIsAwaitingApp,
}: Properties) => {
	const { t } = useTranslation();

	const { formState } = useFormContext<UnlockTokensFormState>();

	const { isSubmitting, isValid } = formState;

	return (
		<>
			<AuthenticationStep
				ledgerIsAwaitingDevice={ledgerIsAwaitingDevice}
				ledgerIsAwaitingApp={ledgerIsAwaitingApp}
				wallet={wallet}
			/>

			<div className="flex justify-end pt-3 space-x-3">
				<Button variant="secondary" onClick={onBack}>
					{t("COMMON.BACK")}
				</Button>
				<Button
					type="submit"
					data-testid="UnlockTokensAuthentication__send"
					disabled={!isValid || isSubmitting}
					isLoading={isSubmitting}
					icon="DoubleArrowRight"
					iconPosition="right"
				>
					<span>{t("COMMON.SEND")}</span>
				</Button>
			</div>
		</>
	);
};
