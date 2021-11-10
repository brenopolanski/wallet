import { Contracts } from "@payvo/profiles";
import { Enums } from "@payvo/sdk";
import { Amount } from "app/components/Amount";
import { Avatar } from "app/components/Avatar";
import { Button } from "app/components/Button";
import { Clipboard } from "app/components/Clipboard";
import { Dropdown, DropdownOption } from "app/components/Dropdown";
import { Icon } from "app/components/Icon";
import { Tooltip } from "app/components/Tooltip";
import { TruncateMiddleDynamic } from "app/components/TruncateMiddleDynamic";
import { WalletIcons } from "app/components/WalletIcons";
import { useEnvironmentContext } from "app/contexts";
import { usePrevious, useWalletAlias } from "app/hooks";
import cn from "classnames";
import { NetworkIcon } from "domains/network/components/NetworkIcon";
import { UnlockTokensModal } from "domains/transaction/components/UnlockTokens";
import { DeleteWallet } from "domains/wallet/components/DeleteWallet";
import { ReceiveFunds } from "domains/wallet/components/ReceiveFunds";
import { SignMessage } from "domains/wallet/components/SignMessage";
import { UpdateWalletName } from "domains/wallet/components/UpdateWalletName";
import { VerifyMessage } from "domains/wallet/components/VerifyMessage";
import { WalletEncryptionWarning } from "domains/wallet/components/WalletEncryptionWarning";
import { useWalletSync } from "domains/wallet/hooks/use-wallet-sync";
import { useWalletOptions } from "domains/wallet/pages/WalletDetails/hooks/use-wallet-options";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import tw, { styled } from "twin.macro";
import { assertString } from "utils/assertions";
import { openExternal } from "utils/electron-utils";

interface WalletHeaderProperties {
	profile: Contracts.IProfile;
	wallet: Contracts.IReadWriteWallet;
	currencyDelta?: number;
	onSend?: () => void;
	isUpdatingTransactions?: boolean;
	onUpdate?: (status: boolean) => void;
}

const WalletHeaderButton = styled.button`
	${tw`inline-flex items-center justify-center w-8 h-8 transition-all duration-100 ease-linear rounded outline-none focus:(outline-none ring-2 ring-theme-primary-400) text-theme-secondary-text hover:text-theme-secondary-500 disabled:(cursor-not-allowed text-theme-secondary-800)`}
`;

export const WalletHeader = ({
	profile,
	wallet,
	currencyDelta,
	onSend,
	isUpdatingTransactions,
	onUpdate,
}: WalletHeaderProperties) => {
	const [modal, setModal] = useState<string | undefined>();

	const { env } = useEnvironmentContext();
	const { syncAll } = useWalletSync({ env, profile });
	const [isSyncing, setIsSyncing] = useState(false);
	const previousIsUpdatingTransactions = usePrevious(isUpdatingTransactions);

	const history = useHistory();

	const { t } = useTranslation();
	const { persist } = useEnvironmentContext();

	const { getWalletAlias } = useWalletAlias();

	const { alias } = getWalletAlias({
		address: wallet.address(),
		network: wallet.network(),
		profile,
	});

	const { primaryOptions, secondaryOptions, additionalOptions, registrationOptions } = useWalletOptions(wallet);

	const isUnlockBalanceButtonVisible = useMemo(() => {
		let supported: boolean;
		const hasLockedBalance = wallet.network().usesLockedBalance() && !!wallet.balance("locked");

		if (wallet.isLedger()) {
			supported =
				wallet.network().allows(Enums.FeatureFlag.TransactionUnlockTokenLedgerS) ||
				wallet.network().allows(Enums.FeatureFlag.TransactionUnlockTokenLedgerX);
		} else {
			supported = wallet.network().allows(Enums.FeatureFlag.TransactionUnlockToken);
		}

		return supported && hasLockedBalance;
	}, [wallet]);

	const handleStar = async () => {
		wallet.toggleStarred();
		await persist();
	};

	const handleDeleteWallet = async () => {
		setModal(undefined);

		profile.wallets().forget(wallet.id());
		profile.notifications().transactions().forgetByRecipient(wallet.address());
		await persist();

		history.push(`/profiles/${profile.id()}/dashboard`);
	};

	const handleSelect = (option: DropdownOption) => {
		if (option.value === "multi-signature") {
			history.push(`/profiles/${profile.id()}/wallets/${wallet.id()}/send-registration/multiSignature`);
		}

		if (option.value === "second-signature" && !wallet.usesPassword()) {
			history.push(`/profiles/${profile.id()}/wallets/${wallet.id()}/send-registration/secondSignature`);
		}

		if (option.value === "delegate-registration") {
			history.push(`/profiles/${profile.id()}/wallets/${wallet.id()}/send-registration/delegateRegistration`);
		}

		if (option.value === "delegate-resignation") {
			history.push(`/profiles/${profile.id()}/wallets/${wallet.id()}/send-delegate-resignation`);
		}

		if (option.value === "store-hash") {
			history.push(`/profiles/${profile.id()}/wallets/${wallet.id()}/send-ipfs`);
		}

		if (option.value === "open-explorer") {
			openExternal(wallet.explorerLink());
		}

		setModal(option.value?.toString());
	};

	const syncWallet = async () => {
		onUpdate?.(true);
		setIsSyncing(true);

		await syncAll(wallet);

		if (isUpdatingTransactions === undefined) {
			setIsSyncing(false);
			onUpdate?.(false);
		}
	};

	useEffect(() => {
		if (isSyncing && previousIsUpdatingTransactions && !isUpdatingTransactions) {
			setIsSyncing(false);
			onUpdate?.(false);
		}
	}, [isSyncing, previousIsUpdatingTransactions, isUpdatingTransactions, onUpdate]);

	const handleConfirmEncryptionWarning = () => {
		history.push(`/profiles/${profile.id()}/wallets/${wallet.id()}/send-registration/secondSignature`);
	};

	const exchangeCurrency = profile.settings().get<string>(Contracts.ProfileSetting.ExchangeCurrency);
	assertString(exchangeCurrency);

	return (
		<>
			<header className="flex items-center" data-testid="WalletHeader">
				<div className="flex items-center pr-12 w-1/2 border-r h-13 border-theme-secondary-800">
					<div className="flex -space-x-1">
						<NetworkIcon
							network={wallet.network()}
							size="lg"
							className="border-theme-secondary-700 text-theme-secondary-text"
							noShadow
							tooltipDarkTheme
						/>
						<Avatar size="lg" address={wallet.address()} shadowClassName="ring-theme-secondary-900" />
					</div>

					<div className="flex overflow-hidden flex-col py-2 pr-2 -my-2 ml-4 -mr-2 w-full">
						<div className="flex items-center space-x-2 text-theme-secondary-text">
							{!!alias && (
								<span data-testid="WalletHeader__name" className="text-sm font-semibold">
									{alias}
								</span>
							)}

							<div className="flex items-center space-x-1">
								<WalletIcons
									wallet={wallet}
									iconColor="text-theme-secondary-text"
									iconSize="md"
									exclude={["isStarred", "isTestNetwork"]}
									tooltipDarkTheme
								/>
							</div>
						</div>

						<div className="flex items-center space-x-5 w-full">
							<TruncateMiddleDynamic
								value={wallet.address()}
								className="flex-1 text-lg font-semibold text-white whitespace-nowrap no-ligatures"
								tooltipDarkTheme
							/>

							<div className="flex items-end mb-1 space-x-3 text-theme-secondary-text">
								<Clipboard
									variant="icon"
									data={wallet.address()}
									tooltip={t("WALLETS.PAGE_WALLET_DETAILS.COPY_ADDRESS")}
									tooltipDarkTheme
								>
									<Icon name="Copy" className="hover:text-theme-secondary-500" />
								</Clipboard>

								{!!wallet.publicKey() && (
									<Clipboard
										variant="icon"
										data={wallet.publicKey() as string}
										tooltip={t("WALLETS.PAGE_WALLET_DETAILS.COPY_PUBLIC_KEY")}
										tooltipDarkTheme
									>
										<Icon name="CopyKey" className="hover:text-theme-secondary-500" />
									</Clipboard>
								)}
							</div>
						</div>
					</div>
				</div>

				<div className="flex items-center pl-12 w-1/2 h-13">
					<div className="flex flex-col mr-auto">
						<div className="flex items-center text-sm font-semibold text-theme-secondary-text">
							<span>{t("COMMON.BALANCE")}:</span>

							{!wallet.network().isTest() && (
								<Amount
									value={wallet.convertedBalance()}
									ticker={exchangeCurrency}
									data-testid="WalletHeader__currency-balance"
									className="ml-1"
								/>
							)}

							{!!currencyDelta && (
								<span
									className={`inline-flex items-center ml-2 ${
										currencyDelta > 0 ? "text-theme-success-600" : "text-theme-danger-500"
									}`}
								>
									<Icon name={currencyDelta > 0 ? "ChevronUpSmall" : "ChevronDownSmall"} size="sm" />
									<span className="ml-1">{currencyDelta}%</span>
								</span>
							)}
						</div>

						<div className="flex items-center">
							<Amount
								value={wallet.balance()}
								ticker={wallet.currency()}
								data-testid="WalletHeader__balance"
								className="text-lg font-semibold text-white"
							/>

							{isUnlockBalanceButtonVisible && (
								<div className="flex items-baseline text-theme-secondary-700 ml-1 space-x-1">
									<span className="text-lg font-semibold">/</span>
									<div
										className="flex items-center space-x-2"
										data-testid="WalletHeader__balance-locked"
									>
										<Amount
											value={wallet.balance("locked")}
											ticker={wallet.currency()}
											className="font-semibold text-sm"
										/>
										<Icon name="Lock" />
									</div>
								</div>
							)}
						</div>
					</div>

					<div className="flex items-center my-auto space-x-3">
						<Tooltip
							content={isSyncing ? t("WALLETS.UPDATING_WALLET_DATA") : t("WALLETS.UPDATE_WALLET_DATA")}
							theme="dark"
							disabled={!wallet.hasSyncedWithNetwork()}
						>
							<WalletHeaderButton
								data-testid="WalletHeader__refresh"
								type="button"
								aria-busy={isSyncing}
								onClick={syncWallet}
								disabled={isSyncing}
							>
								<Icon
									name="ArrowRotateLeft"
									className={cn({ "animate-spin": isSyncing })}
									style={{ animationDirection: "reverse" }}
								/>
							</WalletHeaderButton>
						</Tooltip>

						<Tooltip
							content={
								wallet.isStarred()
									? t("WALLETS.PAGE_WALLET_DETAILS.UNSTAR_WALLET")
									: t("WALLETS.PAGE_WALLET_DETAILS.STAR_WALLET")
							}
							theme="dark"
						>
							<WalletHeaderButton
								data-testid="WalletHeader__star-button"
								type="button"
								onClick={handleStar}
							>
								<Icon
									className={cn({ "text-theme-warning-400": wallet.isStarred() })}
									name={wallet.isStarred() ? "StarFilled" : "Star"}
								/>
							</WalletHeaderButton>
						</Tooltip>
					</div>

					<Button
						data-testid="WalletHeader__send-button"
						disabled={
							wallet.balance() === 0 || !wallet.hasBeenFullyRestored() || !wallet.hasSyncedWithNetwork()
						}
						className="my-auto ml-3"
						onClick={onSend}
					>
						{t("COMMON.SEND")}
					</Button>

					{isUnlockBalanceButtonVisible && (
						<Tooltip content={t("TRANSACTION.UNLOCK_TOKENS.LOCKED_BALANCE")} theme="dark">
							<Button
								variant="transparent"
								size="icon"
								className="text-white bg-theme-secondary-800 hover:bg-theme-primary-700 my-auto ml-3"
								data-testid="WalletHeader__locked-balance-button"
								onClick={() => setModal("unlockable-balances")}
							>
								<Icon name="Lock" size="lg" />
							</Button>
						</Tooltip>
					)}

					<div data-testid="WalletHeader__more-button" className="my-auto ml-3">
						<Dropdown
							toggleContent={
								<Button
									variant="transparent"
									size="icon"
									className="text-white bg-theme-secondary-800 hover:bg-theme-primary-700"
								>
									<Icon name="EllipsisVertical" size="lg" />
								</Button>
							}
							onSelect={handleSelect}
							options={[primaryOptions, registrationOptions, additionalOptions, secondaryOptions]}
						/>
					</div>
				</div>
			</header>

			{modal === "sign-message" && (
				<SignMessage
					profile={profile}
					walletId={wallet.id()}
					isOpen={true}
					onClose={() => setModal(undefined)}
					onCancel={() => setModal(undefined)}
				/>
			)}

			<VerifyMessage
				isOpen={modal === "verify-message"}
				onClose={() => setModal(undefined)}
				onCancel={() => setModal(undefined)}
				walletId={wallet.id()}
				profileId={profile.id()}
			/>

			{modal === "receive-funds" && (
				<ReceiveFunds
					address={wallet.address()}
					name={alias}
					network={wallet.network()}
					onClose={() => setModal(undefined)}
				/>
			)}

			{modal === "wallet-name" && (
				<UpdateWalletName
					onAfterSave={() => setModal(undefined)}
					onCancel={() => setModal(undefined)}
					profile={profile}
					wallet={wallet}
				/>
			)}

			{modal === "delete-wallet" && (
				<DeleteWallet
					onClose={() => setModal(undefined)}
					onCancel={() => setModal(undefined)}
					onDelete={handleDeleteWallet}
				/>
			)}

			{modal === "second-signature" && (
				<WalletEncryptionWarning
					importType={wallet.actsWithMnemonicWithEncryption() ? "mnemonic" : "secret"}
					onCancel={() => setModal(undefined)}
					onConfirm={handleConfirmEncryptionWarning}
				/>
			)}

			{modal === "unlockable-balances" && (
				<UnlockTokensModal profile={profile} wallet={wallet} onClose={() => setModal(undefined)} />
			)}
		</>
	);
};
