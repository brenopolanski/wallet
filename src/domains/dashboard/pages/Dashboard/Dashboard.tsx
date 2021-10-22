import { Contracts, DTO } from "@payvo/profiles";
import { EmptyBlock } from "app/components/EmptyBlock";
import { Page, Section } from "app/components/Layout";
import { useConfiguration, useEnvironmentContext } from "app/contexts";
import { useActiveProfile } from "app/hooks";
import { Wallets } from "domains/dashboard/components/Wallets";
import { useLatestTransactions } from "domains/dashboard/hooks/use-latest-transactions";
import { WelcomeModal } from "domains/profile/components/WelcomeModal";
import { TransactionDetailModal } from "domains/transaction/components/TransactionDetailModal";
import { TransactionTable } from "domains/transaction/components/TransactionTable";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";

export const Dashboard = () => {
	const history = useHistory();
	const { t } = useTranslation();
	const activeProfile = useActiveProfile();

	const { profileIsSyncing } = useConfiguration();
	const { env } = useEnvironmentContext();

	const profileWalletsCount = activeProfile.wallets().count();
	const showTransactions = activeProfile.appearance().get("dashboardTransactionHistory");
	const exchangeCurrency = activeProfile.settings().get<string>(Contracts.ProfileSetting.ExchangeCurrency);

	const { isLoadingTransactions, latestTransactions } = useLatestTransactions({
		profile: activeProfile,
		profileIsSyncing,
	});

	const [transactionModalItem, setTransactionModalItem] = useState<DTO.ExtendedConfirmedTransactionData | undefined>(
		undefined,
	);

	return (
		<>
			<Page profile={activeProfile} isBackDisabled={true}>
				<Wallets
					title={t("COMMON.WALLETS")}
					walletsCount={profileWalletsCount}
					isLoading={profileIsSyncing}
					onCreateWallet={() => history.push(`/profiles/${activeProfile.id()}/wallets/create`)}
					onImportWallet={() => history.push(`/profiles/${activeProfile.id()}/wallets/import`)}
					onImportLedgerWallet={() =>
						history.push(`/profiles/${activeProfile.id()}/wallets/import?ledger=true`)
					}
				/>

				{showTransactions && (
					<Section className="mt-2" data-testid="dashboard__transactions-view">
						<h2 className="mb-6 text-2xl font-bold">{t("DASHBOARD.LATEST_TRANSACTIONS.TITLE")}</h2>

						<TransactionTable
							transactions={latestTransactions}
							exchangeCurrency={exchangeCurrency}
							hideHeader={!isLoadingTransactions && latestTransactions.length === 0}
							isLoading={isLoadingTransactions && latestTransactions.length === 0}
							skeletonRowsLimit={8}
							onRowClick={setTransactionModalItem}
							profile={activeProfile}
						/>

						{latestTransactions.length === 0 && !isLoadingTransactions && (
							<EmptyBlock>{t("DASHBOARD.LATEST_TRANSACTIONS.EMPTY_MESSAGE")}</EmptyBlock>
						)}
					</Section>
				)}
			</Page>

			<WelcomeModal profile={activeProfile} environment={env} />

			{transactionModalItem && (
				<TransactionDetailModal
					isOpen={!!transactionModalItem}
					transactionItem={transactionModalItem}
					profile={activeProfile}
					onClose={() => setTransactionModalItem(undefined)}
				/>
			)}
		</>
	);
};
