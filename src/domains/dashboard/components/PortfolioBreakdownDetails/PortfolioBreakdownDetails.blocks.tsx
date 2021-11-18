import { Amount } from "app/components/Amount";
import { Table, TableCell, TableRow } from "app/components/Table";
import { useTheme } from "app/hooks";
import { AssetItem } from "domains/dashboard/components/PortfolioBreakdown/PortfolioBreakdown.contracts";
import { formatPercentage, getColor } from "domains/dashboard/components/PortfolioBreakdown/PortfolioBreakdown.helpers";
import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Column, TableState } from "react-table";

import {
	AssetListItemProperties,
	AssetListProperties,
	BalanceProperties,
	TooltipProperties,
} from "./PortfolioBreakdownDetails.contracts";

const AssetListItem: React.VFC<AssetListItemProperties> = ({ asset, index, exchangeCurrency }) => {
	const { isDarkMode } = useTheme();
	const color = getColor(index, isDarkMode);

	return (
		<TableRow>
			<TableCell variant="start" innerClassName="space-x-3" isCompact>
				<div className={`w-1 h-5 rounded bg-theme-${color}`} />
				<span className="font-semibold">{asset.label}</span>
			</TableCell>

			<TableCell innerClassName="justify-end" isCompact>
				<Amount value={asset.amount} ticker={asset.label} className="font-semibold" />
			</TableCell>

			<TableCell innerClassName="justify-end" isCompact>
				<Amount
					value={asset.convertedAmount}
					ticker={exchangeCurrency}
					className="text-theme-secondary-text font-semibold"
				/>
			</TableCell>

			<TableCell variant="end" innerClassName="justify-end" isCompact>
				<span className="text-theme-secondary-text font-semibold">{formatPercentage(asset.percent)}</span>
			</TableCell>
		</TableRow>
	);
};

const AssetList: React.VFC<AssetListProperties> = ({ assets, exchangeCurrency }) => {
	const { t } = useTranslation();

	const initialState = useMemo<Partial<TableState<AssetItem>>>(
		() => ({
			sortBy: [
				{
					id: "label",
				},
			],
		}),
		[],
	);

	const columns = useMemo<Column<AssetItem>[]>(
		() => [
			{
				Header: t("COMMON.ASSET"),
				accessor: "label",
			},
			{
				Header: t("COMMON.BALANCE"),
				accessor: "amount",
				className: "justify-end",
			},
			{
				Header: t("COMMON.CURRENCY"),
				accessor: "convertedAmount",
				className: "justify-end",
			},
			{
				Header: "%",
				accessor: "percent",
				className: "justify-end",
			},
		],
		[t],
	);

	const renderTableRow = useCallback(
		(asset: AssetItem, index: number) => (
			<AssetListItem asset={asset} index={index} exchangeCurrency={exchangeCurrency} />
		),
		[exchangeCurrency],
	);

	return (
		<Table columns={columns} data={assets} initialState={initialState}>
			{renderTableRow}
		</Table>
	);
};

const Tooltip: React.VFC<TooltipProperties> = ({ dataPoint: { color, data } }) => (
	<div
		data-testid="PortfolioBreakdownDetails__tooltip"
		className="flex items-center bg-theme-secondary-900 dark:bg-theme-secondary-800 rounded px-3 py-2 space-x-3 divide-x divide-theme-secondary-700 text-sm font-semibold"
	>
		<div className="flex items-center space-x-2">
			<div className={`h-3 w-1 rounded bg-theme-${color}`} />
			<span className="text-white">{data.label}</span>
		</div>

		<span className="pl-3 text-theme-secondary-500">{data.percentFormatted}</span>
	</div>
);

const Balance: React.VFC<BalanceProperties> = ({ ticker, value }) => {
	const { t } = useTranslation();

	return (
		<div className="flex flex-col items-center justify-center space-y-2">
			<span className="font-semibold text-sm text-theme-secondary-700 dark:text-theme-secondary-500">
				{t("COMMON.YOUR_BALANCE")}
			</span>
			<h3 className="font-bold text-theme-secondary-900 dark:text-theme-secondary-200">
				<Amount ticker={ticker} value={value} />
			</h3>
			<span className="font-semibold text-sm text-theme-secondary-700 dark:text-theme-secondary-500">
				{ticker}
			</span>
		</div>
	);
};

export { AssetList, Balance, Tooltip };
