import { Contracts } from "@payvo/profiles";
import { AmountCrypto } from "app/components/Amount";
import { Avatar } from "app/components/Avatar";
import { Card } from "app/components/Card";
import { Circle } from "app/components/Circle";
import { DropdownOption } from "app/components/Dropdown";
import { Icon } from "app/components/Icon";
import { Tooltip } from "app/components/Tooltip";
import { TruncateMiddleDynamic } from "app/components/TruncateMiddleDynamic";
import { WalletIcons } from "app/components/WalletIcons";
import { useActiveProfile, useWalletAlias } from "app/hooks";
import cn from "classnames";
import { NetworkIcon } from "domains/network/components/NetworkIcon";
import { isFullySynced } from "domains/wallet/utils/is-fully-synced";
import React, { useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { isElementTruncated } from "utils/is-element-truncated";

import { WalletCardSkeleton } from "./WalletCardSkeleton";

interface WalletCardProperties {
	actions?: DropdownOption[];
	onWalletAction?: any;
	isLoading?: boolean;
	className?: string;
	wallet?: Contracts.IReadWriteWallet;
	displayType?: string;
}

export const WalletCard = ({
	actions,
	onWalletAction,
	isLoading = false,
	className,
	wallet,
	displayType = "all",
}: WalletCardProperties) => {
	const activeProfile = useActiveProfile();

	const history = useHistory();
	const { t } = useTranslation();

	const { getWalletAlias } = useWalletAlias();

	const defaultAlias = wallet?.alias();

	const { alias } = useMemo(
		() =>
			getWalletAlias({
				address: wallet?.address(),
				network: wallet?.network(),
				profile: activeProfile,
			}),
		[activeProfile, defaultAlias, getWalletAlias, wallet], // eslint-disable-line react-hooks/exhaustive-deps
	);

	const aliasRef = useRef(null);

	const canDisplayBalance = wallet ? isFullySynced(wallet) : false;

	if (isLoading) {
		return <WalletCardSkeleton />;
	}

	if (wallet === undefined) {
		const walletIcon = () => {
			if (displayType === "all") {
				return;
			}

			return (
				<Icon
					name={displayType === "starred" ? "StarFilled" : "Ledger"}
					className="text-theme-primary-100 dark:text-theme-secondary-800"
				/>
			);
		};

		return (
			<div data-testid="WalletCard__blank" className={cn("w-64 inline-block", className)}>
				<Card addonIcons={walletIcon()} className="h-48">
					<div className="flex flex-col justify-between p-5 h-full">
						<div className="flex -space-x-1">
							<Circle
								size="lg"
								className="bg-theme-background border-theme-primary-100 dark:border-theme-secondary-800"
							/>
							<Circle
								size="lg"
								className="bg-theme-background border-theme-primary-100 dark:border-theme-secondary-800"
							/>
						</div>

						<div className="mt-auto text-lg font-bold text-theme-primary-100 dark:text-theme-secondary-800">
							{t("COMMON.BALANCE")}
						</div>

						<span className="mt-1 text-xs font-semibold truncate text-theme-primary-100 dark:text-theme-secondary-800">
							{t("COMMON.ADDRESS")}
						</span>
					</div>
				</Card>
			</div>
		);
	}

	return (
		<div className={cn("w-64 inline-block", className)} data-testid={`WalletCard__${wallet.address()}`}>
			<Card
				actions={actions}
				onSelect={({ value }: DropdownOption) => onWalletAction?.(value, wallet)}
				addonIcons={<WalletIcons wallet={wallet} />}
				className="h-48"
				onClick={
					canDisplayBalance
						? () => history.push(`/profiles/${activeProfile.id()}/wallets/${wallet.id()}`)
						: undefined
				}
			>
				<div className="flex relative flex-col justify-between p-5 h-full">
					<div className="flex items-center space-x-4">
						<div className="-space-x-1 whitespace-nowrap">
							<NetworkIcon size="lg" network={wallet.network()} />
							<Avatar size="lg" address={wallet.address()} />
						</div>

						<Tooltip content={alias} disabled={!isElementTruncated(aliasRef?.current)}>
							<span ref={aliasRef} className="font-semibold truncate text-theme-secondary-text">
								{alias}
							</span>
						</Tooltip>
					</div>

					{canDisplayBalance ? (
						<AmountCrypto
							value={wallet.balance()}
							ticker={wallet.network().ticker()}
							className="mt-auto text-lg font-bold text-theme-text"
						/>
					) : (
						<div className="w-44 mt-4 h-4.5 rounded bg-theme-secondary-200 dark:bg-theme-secondary-800" />
					)}

					<TruncateMiddleDynamic
						value={wallet?.address()}
						className="mt-1 text-xs font-semibold whitespace-nowrap text-theme-secondary-text no-ligatures"
					/>
				</div>
			</Card>
		</div>
	);
};
