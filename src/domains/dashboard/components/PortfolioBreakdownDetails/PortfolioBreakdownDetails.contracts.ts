import { GraphDataPoint } from "app/components/Graphs/Graphs.contracts";
import { AssetItem } from "domains/dashboard/components/PortfolioBreakdown/PortfolioBreakdown.contracts";

interface PortfolioBreakdownDetailsProperties {
	isOpen: boolean;
	assets: AssetItem[];
	exchangeCurrency: string;
	onClose: () => void;
	balance: number;
}

interface AssetListItemProperties {
	asset: AssetItem;
	index: number;
	exchangeCurrency: string;
}

interface AssetListProperties {
	assets: AssetItem[];
	exchangeCurrency: string;
}

interface TooltipProperties {
	dataPoint: GraphDataPoint;
}

interface BalanceProperties {
	ticker: string;
	value: number;
}

export type {
	AssetListItemProperties,
	AssetListProperties,
	BalanceProperties,
	PortfolioBreakdownDetailsProperties,
	TooltipProperties,
};