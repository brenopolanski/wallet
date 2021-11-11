import { upperFirst } from "@arkecosystem/utils";
import { Contracts as ProfileContracts, DTO } from "@payvo/profiles";
import { Services } from "@payvo/sdk";
import { useLedgerContext } from "app/contexts";
import { withAbortPromise } from "domains/transaction/utils";

type SignFunction = (input: any) => Promise<string>;

const prepareMultiSignature = async (
	input: Services.TransactionInputs,
	wallet: ProfileContracts.IReadWriteWallet,
): Promise<Services.TransactionInputs> => ({
	...input,
	signatory: await wallet.signatory().multiSignature(wallet.multiSignature().all() as Services.MultiSignatureAsset),
});

const prepareLedger = async (input: Services.TransactionInputs, wallet: ProfileContracts.IReadWriteWallet) => ({
	...input,
	signatory: await wallet.signatory().ledger(wallet.data().get<string>(ProfileContracts.WalletData.DerivationPath)!),
});

export const useTransactionBuilder = () => {
	const { abortConnectionRetry } = useLedgerContext();

	const build = async (
		type: string,
		input: Services.TransactionInputs,
		wallet: ProfileContracts.IReadWriteWallet,
		options?: {
			abortSignal?: AbortSignal;
		},
	): Promise<{ uuid: string; transaction: DTO.ExtendedSignedTransactionData }> => {
		await wallet.transaction().sync();

		const service = wallet.transaction();

		// @ts-ignore
		const signFunction = (service[`sign${upperFirst(type)}`] as SignFunction).bind(service);
		let data = { ...input };

		if (wallet.isMultiSignature()) {
			data = await prepareMultiSignature(data, wallet);
		}

		if (wallet.isLedger()) {
			data = await withAbortPromise(options?.abortSignal, abortConnectionRetry)(prepareLedger(data, wallet));
		}

		const uuid = await signFunction(data);

		return {
			transaction: wallet.transaction().transaction(uuid),
			uuid,
		};
	};

	return { build };
};
