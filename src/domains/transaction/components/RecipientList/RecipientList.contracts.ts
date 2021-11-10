type RecipientListLabel = "TRANSACTION.MULTISIGNATURE.PARTICIPANT_#";

export interface RecipientItem {
	address: string;
	alias?: string;
	amount?: number;
	isDelegate?: boolean;
	publicKey?: string;
}

export interface RecipientListItemProperties {
	disableButton?: (address: string) => boolean;
	exchangeTicker: string;
	isEditable?: boolean;
	label?: RecipientListLabel;
	listIndex: number;
	onRemove?: (index: number) => void;
	recipient: RecipientItem;
	showAmount?: boolean;
	showExchangeAmount?: boolean;
	ticker: string;
	tooltipDisabled?: string;
	variant?: "condensed";
	useMandatoryOption?: boolean;
	isMandatory?: boolean;
	onEnableMandatory?: (publicKey: string) => void;
	onDisableMandatory?: (publicKey: string) => void;
}

export interface RecipientListProperties {
	disableButton?: (address: string) => boolean;
	isEditable: boolean;
	label?: RecipientListLabel;
	onRemove?: (index: number) => void;
	recipients: RecipientItem[];
	showAmount: boolean;
	showExchangeAmount: boolean;
	ticker: string;
	tooltipDisabled?: string;
	variant?: "condensed";
	useMandatoryOption?: boolean;
	mandatoryKeys?: string[];
	onRemoveMandatoryKey?: (publicKey: string) => void;
	onAddMandatoryKey?: (publicKey: string) => void;
}
