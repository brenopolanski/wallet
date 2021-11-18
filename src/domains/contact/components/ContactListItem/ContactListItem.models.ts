import { Contracts } from "@payvo/sdk-profiles";

export interface ContactListItemOption {
	label: string;
	value: string | number;
}

export interface ContactListItemProperties {
	item: any;
	options?: ContactListItemOption[];
	useTestNetworks: boolean;
	onAction?: (action: ContactListItemOption, address: any) => void;
	onSend?: (address: Contracts.IContactAddress) => void;
}
