import { Contracts } from "@payvo/sdk-profiles";
import { Address } from "app/components/Address";
import { Amount } from "app/components/Amount";
import { Avatar } from "app/components/Avatar";
import { TableCell, TableRow } from "app/components/Table";
import { WalletIcons } from "app/components/WalletIcons";
import { useActiveProfile, useWalletAlias } from "app/hooks";
import cn from "classnames";
import { NetworkIcon } from "domains/network/components/NetworkIcon";
import { isFullySynced } from "domains/wallet/utils/is-fully-synced";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { shouldUseDarkColors } from "utils/electron-utils";

export interface WalletListItemProperties {
	wallet: Contracts.IReadWriteWallet;
	activeWalletId?: string;
	onClick?: (walletId: string) => void;
	isCompact?: boolean;
}

export const WalletListItem: React.FC<WalletListItemProperties> = ({
	wallet,
	activeWalletId,
	onClick,
	isCompact = false,
}: WalletListItemProperties) => {
	const { t } = useTranslation();

	const isSelected = useMemo(() => activeWalletId === wallet.id(), [activeWalletId, wallet]);

	const activeProfile = useActiveProfile();

	const canDisplayBalance = isFullySynced(wallet);

	const shadowClasses = useMemo(
		() =>
			cn(
				"group-hover:ring-theme-secondary-100 group-hover:bg-theme-secondary-100 dark:group-hover:ring-black dark:group-hover:bg-black",
				{
					"ring-theme-background": !isSelected,
					"ring-theme-success-100": isSelected && !shouldUseDarkColors(),
					"ring-theme-success-900": isSelected && shouldUseDarkColors(),
				},
			),
		[isSelected],
	);

	const { getWalletAlias } = useWalletAlias();

	const { alias } = useMemo(
		() =>
			getWalletAlias({
				address: wallet?.address(),
				network: wallet?.network(),
				profile: activeProfile,
			}),
		[activeProfile, getWalletAlias, wallet],
	);

	let lastCellContent: string | JSX.Element;

	if (wallet.network().isTest() || !canDisplayBalance) {
		lastCellContent = t("COMMON.NOT_AVAILABLE");
	} else {
		lastCellContent = <Amount ticker={wallet.exchangeCurrency()} value={wallet.convertedBalance()} />;
	}

	return (
		<TableRow isSelected={isSelected} onClick={canDisplayBalance ? () => onClick?.(wallet.id()) : undefined}>
			<TableCell variant="start" innerClassName="space-x-4" isCompact={isCompact}>
				<div
					className={cn(
						"flex-shrink-0 flex items-center",
						{ "space-x-4": isCompact },
						{ "-space-x-1": !isCompact },
					)}
				>
					<NetworkIcon
						size="lg"
						network={wallet.network()}
						shadowClassName={shadowClasses}
						isCompact={isCompact}
					/>
					<Avatar size={isCompact ? "xs" : "lg"} address={wallet.address()} shadowClassName={shadowClasses} />
				</div>
				<div className="w-20 flex-1">
					<Address walletName={alias} address={wallet.address()} />
				</div>
			</TableCell>

			<TableCell innerClassName="justify-center text-sm font-bold text-center align-middle" isCompact={isCompact}>
				<div className="inline-flex items-center space-x-1">
					<WalletIcons wallet={wallet} iconSize="lg" />
				</div>
			</TableCell>

			<TableCell innerClassName="font-semibold justify-end" isCompact={isCompact}>
				{canDisplayBalance ? (
					<Amount value={wallet.balance()} ticker={wallet.network().ticker()} />
				) : (
					<span className="text-theme-secondary-text font-normal">{t("COMMON.NOT_AVAILABLE")}</span>
				)}
			</TableCell>

			<TableCell variant="end" innerClassName="justify-end text-theme-secondary-text" isCompact={isCompact}>
				{lastCellContent}
			</TableCell>
		</TableRow>
	);
};
