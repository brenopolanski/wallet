import { Amount } from "app/components/Amount";
import { Table, TableCell, TableRow } from "app/components/Table";
import { AssetItem } from "domains/dashboard/components/PortfolioBreakdown/PortfolioBreakdown.contracts";
import { formatPercentage, getColor } from "domains/dashboard/components/PortfolioBreakdown/PortfolioBreakdown.helpers";
import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Column } from "react-table";

interface AssetListItemProperties {
	asset: AssetItem;
	index: number;
	exchangeCurrency: string;
}

const AssetListItem: React.VFC<AssetListItemProperties> = ({ asset, index, exchangeCurrency }) => {
	const color = getColor(index);

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

interface AssetListProperties {
	assets: AssetItem[];
	exchangeCurrency: string;
}

const AssetList: React.VFC<AssetListProperties> = ({ assets, exchangeCurrency }) => {
	const { t } = useTranslation();

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
		<Table columns={columns} data={assets}>
			{renderTableRow}
		</Table>
	);
};

export { AssetList };
