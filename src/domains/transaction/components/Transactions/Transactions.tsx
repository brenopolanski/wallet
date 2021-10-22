import { Contracts, DTO } from "@payvo/profiles";
import { Button } from "app/components/Button";
import { EmptyBlock } from "app/components/EmptyBlock";
import { Tab, TabList, Tabs } from "app/components/Tabs";
import { FilterTransactions } from "domains/transaction/components/FilterTransactions";
import { TransactionDetailModal } from "domains/transaction/components/TransactionDetailModal";
import { TransactionTable } from "domains/transaction/components/TransactionTable";
import { useProfileTransactions } from "domains/transaction/hooks/use-profile-transactions";
import React, { memo, useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";

interface TransactionsProperties {
	emptyText?: string;
	profile: Contracts.IProfile;
	isVisible?: boolean;
	wallets: Contracts.IReadWriteWallet[];
	isLoading?: boolean;
	title?: React.ReactNode;
	onLoading?: (status: boolean) => void;
	isUpdatingWallet?: boolean;
}

export const Transactions = memo(
	({
		emptyText,
		profile,
		isVisible = true,
		wallets,
		isLoading = false,
		title,
		isUpdatingWallet,
		onLoading,
	}: TransactionsProperties) => {
		const { t } = useTranslation();

		const [transactionModalItem, setTransactionModalItem] = useState<
			DTO.ExtendedConfirmedTransactionData | undefined
		>(undefined);

		const [activeTransactionTypeLabel, setActiveTransactionTypeLabel] = useState("");

		const {
			updateFilters,
			isLoadingTransactions,
			isLoadingMore,
			transactions,
			activeMode,
			activeTransactionType,
			fetchMore,
			hasMore,
		} = useProfileTransactions({ profile, wallets });

		useEffect(() => {
			if (isLoading) {
				return;
			}

			updateFilters({
				activeMode: "all",
				activeTransactionType: undefined,
			});
		}, [isLoading, wallets.length, updateFilters]);

		useEffect(() => {
			onLoading?.(isLoadingTransactions);
		}, [isLoadingTransactions, onLoading]);

		useEffect(() => {
			if (isUpdatingWallet) {
				updateFilters({ activeMode, activeTransactionType, timestamp: Date.now() });
			}
		}, [isUpdatingWallet]); // eslint-disable-line react-hooks/exhaustive-deps

		if (!isVisible) {
			return <></>;
		}

		return (
			<>
				{title && (
					<div className="flex relative justify-between">
						<h2 className="mb-6 text-2xl font-bold">{title}</h2>
					</div>
				)}

				<Tabs
					className="mb-8"
					activeId={activeMode}
					onChange={(activeTab) => {
						if (activeTab === activeMode) {
							return;
						}

						if (isLoading) {
							return;
						}

						updateFilters({
							activeMode: activeTab as string,
							activeTransactionType,
						});
					}}
				>
					<TabList className="w-full h-15">
						<Tab tabId="all">{t("TRANSACTION.ALL")}</Tab>
						<Tab tabId="received">{t("TRANSACTION.INCOMING")}</Tab>
						<Tab tabId="sent">{t("TRANSACTION.OUTGOING")}</Tab>

						<div className="flex flex-1" />

						<FilterTransactions
							className="my-auto mr-6"
							wallets={wallets}
							onSelect={(option, type) => {
								setActiveTransactionTypeLabel(option.label);
								updateFilters({
									activeMode,
									activeTransactionType: type,
								});
							}}
							isDisabled={wallets.length === 0}
						/>
					</TabList>
				</Tabs>

				<TransactionTable
					transactions={transactions}
					exchangeCurrency={profile.settings().get<string>(Contracts.ProfileSetting.ExchangeCurrency)}
					hideHeader={!isLoadingTransactions && transactions.length === 0}
					isLoading={isLoadingTransactions}
					skeletonRowsLimit={8}
					onRowClick={setTransactionModalItem}
					profile={profile}
				/>

				{transactions.length > 0 && hasMore && (
					<Button
						data-testid="transactions__fetch-more-button"
						variant="secondary"
						className="mt-10 mb-5 w-full"
						disabled={isLoadingMore}
						onClick={() => fetchMore()}
					>
						{isLoadingMore ? t("COMMON.LOADING") : t("COMMON.VIEW_MORE")}
					</Button>
				)}

				{transactions.length === 0 && !activeTransactionType && !isLoadingTransactions && (
					<EmptyBlock className="-mt-5">
						{emptyText || t("DASHBOARD.LATEST_TRANSACTIONS.EMPTY_MESSAGE")}
					</EmptyBlock>
				)}

				{transactions.length === 0 && !!activeTransactionType && !isLoadingTransactions && (
					<EmptyBlock className="-mt-5">
						<Trans
							i18nKey="DASHBOARD.LATEST_TRANSACTIONS.NO_RESULTS"
							values={{
								type: activeTransactionTypeLabel,
							}}
							components={{ bold: <strong /> }}
						/>
					</EmptyBlock>
				)}

				{transactionModalItem && (
					<TransactionDetailModal
						isOpen={!!transactionModalItem}
						transactionItem={transactionModalItem}
						profile={profile}
						onClose={() => setTransactionModalItem(undefined)}
					/>
				)}
			</>
		);
	},
);

Transactions.displayName = "Transactions";
