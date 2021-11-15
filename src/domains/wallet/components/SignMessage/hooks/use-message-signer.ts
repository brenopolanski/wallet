import LedgerTransportNodeHID from "@ledgerhq/hw-transport-node-hid-singleton";
import { Services } from "@payvo/sdk";
import { Contracts as ProfileContracts } from "@payvo/sdk-profiles";

const signWithLedger = async (
	message: string,
	wallet: ProfileContracts.IReadWriteWallet,
	transport: typeof LedgerTransportNodeHID,
) => {
	await wallet.ledger().connect(transport);

	const path = wallet.data().get<string>(ProfileContracts.WalletData.DerivationPath);

	let signatory = wallet.publicKey();

	if (!signatory) {
		signatory = await wallet.coin().ledger().getPublicKey(path!);
	}

	const signature = await wallet.ledger().signMessage(path!, Buffer.from(message));

	return {
		message,
		signatory,
		signature,
	};
};

const withAbortPromise =
	(signal?: AbortSignal) =>
	<T>(promise: Promise<T>) =>
		new Promise<T>((resolve, reject) => {
			if (signal) {
				signal.addEventListener("abort", () => reject("ERR_ABORT"));
			}

			return promise.then(resolve).catch(reject);
		});

// @TODO: extract this into the SDK/Profiles
export const useMessageSigner = (transport: typeof LedgerTransportNodeHID) => {
	const sign = async (
		wallet: ProfileContracts.IReadWriteWallet,
		message: string,
		mnemonic?: string,
		wif?: string,
		secret?: string,
		options?: {
			abortSignal?: AbortSignal;
		},
	): Promise<Services.SignedMessage> => {
		if (wallet.isLedger()) {
			return withAbortPromise(options?.abortSignal)(signWithLedger(message, wallet, transport));
		}

		let signatory: any;

		if (mnemonic) {
			signatory = await wallet.signatory().mnemonic(mnemonic);
		}

		if (wif) {
			signatory = await wallet.signatory().mnemonic(wif);
		}

		if (secret) {
			signatory = await wallet.signatory().secret(secret);
		}

		return wallet.message().sign({ message, signatory });
	};

	return { sign };
};
