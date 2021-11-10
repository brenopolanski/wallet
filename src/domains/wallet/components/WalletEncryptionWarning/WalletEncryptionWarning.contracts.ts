export interface WalletEncryptionWarningProperties {
	importType: string;
	onCancel: () => void;
	onConfirm: () => Promise<void>;
}
