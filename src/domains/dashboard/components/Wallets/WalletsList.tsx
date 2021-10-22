import { Contracts } from "@payvo/profiles";
import { Button } from "app/components/Button";
import { EmptyBlock } from "app/components/EmptyBlock";
import { Table } from "app/components/Table";
import { WalletListItem } from "app/components/WalletListItem";
import { WalletListItemSkeleton } from "app/components/WalletListItem/WalletListItemSkeleton";
import React, { memo } from "react";
import { Trans, useTranslation } from "react-i18next";

import { WalletListProperties } from ".";

export const WalletsList = memo(
	({
		hasMore,
		hasWalletsMatchingOtherNetworks,
		isLoading = false,
		isVisible = true,
		onRowClick,
		onViewMore,
		wallets,
		walletsDisplayType = "all",
		isCompact = false,
	}: WalletListProperties) => {
		const { t } = useTranslation();

		const columns = [
			{
				Header: t("COMMON.WALLET_ADDRESS"),
				accessor: ({ wallet }: { wallet: Contracts.IReadWriteWallet }) => wallet?.alias() || wallet?.address(),
			},
			{
				Header: t("COMMON.WALLET_TYPE"),
				cellWidth: "w-40",
				className: "justify-center",
			},
			{
				Header: t("COMMON.BALANCE"),
				accessor: ({ wallet }: { wallet: Contracts.IReadWriteWallet }) => wallet?.balance?.(),
				cellWidth: "w-72",
				className: "flex-row-reverse justify-end",
			},
			{
				Header: t("COMMON.CURRENCY"),
				accessor: ({ wallet }: { wallet: Contracts.IReadWriteWallet }) => wallet?.convertedBalance?.(),
				cellWidth: "w-44",
				className: "flex-row-reverse justify-end",
			},
		];

		if (!isVisible) {
			return <></>;
		}

		const skeletonRows = Array.from({ length: 3 }).fill({});

		const tableRows = isLoading ? skeletonRows : wallets;

		const emptyBlockContent = () => {
			if (walletsDisplayType !== "all") {
				return (
					<Trans
						i18nKey={
							hasWalletsMatchingOtherNetworks
								? "DASHBOARD.WALLET_CONTROLS.EMPTY_MESSAGE_TYPE_FILTERED"
								: "DASHBOARD.WALLET_CONTROLS.EMPTY_MESSAGE_TYPE"
						}
						values={{
							type: walletsDisplayType === "starred" ? t("COMMON.STARRED") : t("COMMON.LEDGER"),
						}}
						components={{ bold: <strong /> }}
					/>
				);
			}

			if (hasWalletsMatchingOtherNetworks) {
				return t("DASHBOARD.WALLET_CONTROLS.EMPTY_MESSAGE_FILTERED");
			}

			return t("DASHBOARD.WALLET_CONTROLS.EMPTY_MESSAGE");
		};

		return (
			<div data-testid="WalletsList">
				{(wallets.length > 0 || isLoading) && (
					<div data-testid="WalletTable">
						<Table columns={columns} data={tableRows}>
							{(rowData: any) =>
								isLoading ? (
									<WalletListItemSkeleton isCompact={isCompact} />
								) : (
									<WalletListItem {...rowData} onClick={onRowClick} isCompact={isCompact} />
								)
							}
						</Table>

						{hasMore && (
							<Button
								variant="secondary"
								className="mt-10 mb-5 w-full"
								data-testid="WalletsList__ViewMore"
								onClick={onViewMore}
							>
								{t("COMMON.VIEW_MORE")}
							</Button>
						)}
					</div>
				)}

				{!isLoading && !hasMore && wallets.length === 0 && <EmptyBlock>{emptyBlockContent()}</EmptyBlock>}
			</div>
		);
	},
);

WalletsList.displayName = "WalletsList";
