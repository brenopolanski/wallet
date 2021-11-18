import { Button } from "app/components/Button";
import { EmptyBlock } from "app/components/EmptyBlock";
import { Table } from "app/components/Table";
import { WalletListItem } from "app/components/WalletListItem";
import { WalletListItemSkeleton } from "app/components/WalletListItem/WalletListItemSkeleton";
import React, { FC, useCallback, useMemo } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Column } from "react-table";

import { GridWallet, WalletListProperties } from "./Wallets.contracts";

export const WalletsList: FC<WalletListProperties> = ({
	hasMore,
	hasWalletsMatchingOtherNetworks,
	isLoading = false,
	isVisible = true,
	onRowClick,
	onViewMore,
	wallets,
	walletsDisplayType = "all",
	isCompact = false,
}) => {
	const { t } = useTranslation();

	const columns: Column<GridWallet>[] = [
		{
			Header: t("COMMON.WALLET_ADDRESS"),
			accessor: ({ wallet }) => wallet?.alias() || wallet?.address(),
		},
		{
			Header: t("COMMON.WALLET_TYPE"),
			cellWidth: "w-40",
			className: "justify-center",
		},
		{
			Header: t("COMMON.BALANCE"),
			accessor: ({ wallet }) => wallet?.balance?.(),
			cellWidth: "w-72",
			className: "flex-row-reverse justify-end",
		},
		{
			Header: t("COMMON.CURRENCY"),
			accessor: ({ wallet }) => wallet?.convertedBalance?.(),
			cellWidth: "w-44",
			className: "flex-row-reverse justify-end",
		},
	];

	const tableRows = useMemo<GridWallet[]>(() => {
		const skeletonRows = Array.from<GridWallet>({ length: 3 }).fill({} as GridWallet);
		return isLoading ? skeletonRows : wallets;
	}, [isLoading, wallets]);

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

	const renderTableRow = useCallback(
		(rowData: GridWallet) =>
			isLoading ? (
				<WalletListItemSkeleton isCompact={isCompact} />
			) : (
				<WalletListItem {...rowData} onClick={onRowClick} isCompact={isCompact} />
			),
		[isLoading, isCompact, onRowClick],
	);

	if (!isVisible) {
		return <></>;
	}

	return (
		<div data-testid="WalletsList">
			{(wallets.length > 0 || isLoading) && (
				<div data-testid="WalletTable">
					<Table columns={columns} data={tableRows}>
						{renderTableRow}
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
};
