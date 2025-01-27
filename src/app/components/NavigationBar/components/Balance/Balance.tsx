import { Contracts } from "@payvo/sdk-profiles";
import { Amount } from "app/components/Amount";
import { useProfileBalance } from "app/hooks/use-profile-balance";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { assertProfile, assertString } from "utils/assertions";

import { BalanceSkeleton } from "./BalanceSkeleton";

interface BalanceProperties {
	profile?: Contracts.IProfile;
	isLoading?: boolean;
}

export const Balance: React.FC<BalanceProperties> = ({ profile, isLoading }: BalanceProperties) => {
	const [width, setWidth] = useState<number | undefined>();

	const reference = useRef<HTMLDivElement>(null);

	const { t } = useTranslation();
	const { convertedBalance } = useProfileBalance({ isLoading, profile });

	useEffect(() => setWidth((width) => reference.current?.clientWidth || width), [convertedBalance]);

	if (isLoading) {
		return <BalanceSkeleton width={width} />;
	}

	assertProfile(profile);

	if (!profile.status().isRestored()) {
		return <BalanceSkeleton width={width} />;
	}

	const ticker = profile.settings().get<string>(Contracts.ProfileSetting.ExchangeCurrency);

	assertString(ticker);

	return (
		<div className="text-right">
			<div className="text-xs font-semibold text-theme-secondary-500">{t("COMMON.YOUR_BALANCE")}</div>
			<div
				ref={reference}
				className="text-sm font-bold text-theme-secondary-text dark:text-theme-text"
				data-testid="Balance__value"
			>
				<Amount value={convertedBalance} ticker={ticker} />
			</div>
		</div>
	);
};
