import { Contracts, DTO } from "@payvo/sdk-profiles";

export interface NotificationTransactionsProperties {
	profile: Contracts.IProfile;
	transactions: DTO.ExtendedConfirmedTransactionData[];
	onNotificationAction?: (id: string) => void;
	onClick?: (transaction?: DTO.ExtendedConfirmedTransactionData) => void;
	containmentRef?: any;
	isLoading?: boolean;
	onVisibilityChange?: (isVisible: boolean) => void;
}
