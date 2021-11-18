import { Contracts } from "@payvo/sdk-profiles";
import { DropdownOption } from "app/components/Dropdown";

export interface WalletsProperties {
	title?: string;
	onCreateWallet?: () => void;
	onImportWallet?: () => void;
	onImportLedgerWallet?: () => void;
	listPagerLimit?: number;
	walletsCount?: number;
	isLoading?: boolean;
}

export interface GridWallet {
	isBlank?: boolean;
	wallet: Contracts.IReadWriteWallet;
}

export interface WalletGridProperties {
	actions?: DropdownOption[];
	isVisible?: boolean;
	isLoading?: boolean;
	sliderOptions?: Record<string, any>;
	wallets: GridWallet[];
	onWalletAction?: (action: string, wallet: Contracts.IReadWriteWallet) => void;
}

export interface WalletListProperties {
	hasWalletsMatchingOtherNetworks: boolean;
	hasMore?: boolean;
	isLoading?: boolean;
	isVisible?: boolean;
	onRowClick?: (walletId: string) => void;
	onViewMore?: () => void;
	wallets: GridWallet[];
	walletsDisplayType?: string;
	isCompact?: boolean;
}

export interface UseWalletDisplayProperties {
	wallets?: Contracts.IReadWriteWallet[];
	selectedNetworkIds?: string[];
	displayType?: string;
	viewMore?: boolean;
	listPagerLimit?: number;
}
