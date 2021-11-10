import { uniq } from "@arkecosystem/utils";
import { Contracts } from "@payvo/profiles";
import { Button } from "app/components/Button";
import { FormField, FormLabel, SubForm } from "app/components/Form";
import { useWalletAlias } from "app/hooks";
import { SelectRecipient } from "domains/profile/components/SelectRecipient";
import { RecipientList } from "domains/transaction/components/RecipientList";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

export interface Participant {
	address: string;
	alias?: string;
	publicKey: string;
}

interface Properties {
	profile: Contracts.IProfile;
	wallet: Contracts.IReadWriteWallet;
	onChange?: (wallets: Participant[]) => void;
	onChangeMandatoryKeys?: (publicKeys: string[]) => void;
	defaultParticipants?: Participant[];
	minRequiredSignatures?: number;
}

const defaultProps = {
	defaultParticipants: [],
};

export const AddParticipant = ({
	minRequiredSignatures,
	profile,
	wallet,
	onChange,
	onChangeMandatoryKeys,
	defaultParticipants = defaultProps.defaultParticipants,
}: Properties) => {
	const { t } = useTranslation();

	const [mandatoryKeys, setMandatoryKeys] = useState<string[]>([]);
	const [isValidating, setIsValidating] = useState(false);
	const [participants, setParticipants] = useState<Participant[]>(defaultParticipants);
	const lastValidationReference = useRef<unknown | undefined>();

	const { getWalletAlias } = useWalletAlias();

	const form = useForm({ mode: "onSubmit", reValidateMode: "onSubmit" });
	const { register, handleSubmit, setValue, watch } = form;
	const { address, participantAlias } = watch();

	useEffect(() => {
		register("participantAlias");
	}, [register]);

	useEffect(() => {
		if (defaultParticipants.length === 0) {
			const { alias } = getWalletAlias({
				address: wallet.address(),
				network: wallet.network(),
				profile,
			});

			setParticipants([
				{
					address: wallet.address(),
					alias,
					publicKey: wallet.publicKey()!,
				},
			]);
		}
	}, [wallet, defaultParticipants, getWalletAlias, profile]);

	const addParticipant = () => {
		const reference = lastValidationReference.current as Contracts.IReadWriteWallet;
		const participant = {
			address: reference.address(),
			alias: participantAlias,
			publicKey: reference.publicKey()!,
		};

		const newParticipants = [...participants, participant];
		setParticipants(newParticipants);
		onChange?.(newParticipants);

		setTimeout(() => setValue("address", ""));
	};

	useEffect(() => {
		setMandatoryKeys(mandatoryKeys.slice(0, minRequiredSignatures));
	}, [minRequiredSignatures]);

	useEffect(() => {
		onChangeMandatoryKeys?.(mandatoryKeys);
	}, [mandatoryKeys]);

	const removeParticipant = (index: number) => {
		const remainingParticipants = [...participants];

		removeMandatoryKey(remainingParticipants[index].publicKey);

		remainingParticipants.splice(index, 1);

		setParticipants(remainingParticipants);
		onChange?.(remainingParticipants);
	};

	const addMandatoryKey = (publicKey: string) => {
		if (!minRequiredSignatures) {
			return;
		}

		if (mandatoryKeys.length === +minRequiredSignatures) {
			// TODO: Inform user about reaching max mandatoryKeys limit
			return;
		}

		setMandatoryKeys(uniq([...mandatoryKeys, publicKey]));
	};

	const removeMandatoryKey = (publicKey: string) => {
		setMandatoryKeys(mandatoryKeys.filter((item) => item !== publicKey));
	};

	const findDuplicate = useCallback(
		(address: string) => {
			if (participants.some((item) => item.address === address)) {
				return t("TRANSACTION.MULTISIGNATURE.ERROR.ADDRESS_ALREADY_ADDED");
			}
			return true;
		},
		[participants, t],
	);

	const findByAddress = useCallback(
		async (address: string) => {
			setIsValidating(true);
			lastValidationReference.current = undefined;

			try {
				let participantWallet: unknown = profile
					.wallets()
					.findByAddressWithNetwork(address, wallet.networkId());

				if (!participantWallet) {
					const response = await wallet.client().wallets({
						identifiers: [
							{
								type: "address",
								value: address,
							},
						],
					});

					const remote = response.findByAddress(address);

					if (!remote) {
						return t("TRANSACTION.MULTISIGNATURE.ERROR.ADDRESS_NOT_FOUND");
					}

					participantWallet = remote;
				}

				if (!(participantWallet as Contracts.IReadOnlyWallet)?.publicKey()) {
					return t("TRANSACTION.MULTISIGNATURE.ERROR.PUBLIC_KEY_NOT_FOUND");
				}

				lastValidationReference.current = participantWallet;
				return true;
			} catch {
				return t("TRANSACTION.MULTISIGNATURE.ERROR.ADDRESS_NOT_FOUND");
			} finally {
				setIsValidating(false);
			}
		},
		[profile, t, wallet],
	);

	return (
		<div>
			<FormProvider {...form}>
				<SubForm>
					<FormField name="address">
						<FormLabel label={t("TRANSACTION.MULTISIGNATURE.PARTICIPANT")} />
						<SelectRecipient
							exceptMultiSignature
							network={wallet.network()}
							address={address}
							profile={profile}
							ref={register({
								required: true,
								validate: {
									findByAddress,
									findDuplicate,
								},
							})}
							onChange={(address, alias) => {
								setValue("address", address, { shouldDirty: true });
								setValue("participantAlias", alias.alias);
							}}
						/>
					</FormField>

					<Button
						className="my-4 w-full"
						variant="secondary"
						type="button"
						disabled={isValidating || !address}
						isLoading={isValidating}
						onClick={handleSubmit(() => addParticipant())}
					>
						{t("TRANSACTION.MULTISIGNATURE.ADD_PARTICIPANT")}
					</Button>
				</SubForm>
			</FormProvider>

			<div className="mt-3 border-b border-dashed border-theme-secondary-300 dark:border-theme-secondary-800">
				<RecipientList
					disableButton={(address: string) => address === wallet.address()}
					isEditable
					label="TRANSACTION.MULTISIGNATURE.PARTICIPANT_#"
					onRemove={removeParticipant}
					recipients={participants}
					showAmount={false}
					showExchangeAmount={wallet.network().isLive()}
					ticker={wallet.currency()}
					tooltipDisabled={t("TRANSACTION.MULTISIGNATURE.REMOVE_NOT_ALLOWED")}
					useMandatoryOption={wallet.network().multiSignatureType() === "advanced"}
					mandatoryKeys={mandatoryKeys}
					onAddMandatoryKey={addMandatoryKey}
					onRemoveMandatoryKey={removeMandatoryKey}
				/>
			</div>
		</div>
	);
};
