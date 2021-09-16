import { Contracts } from "@payvo/profiles";
import { Alert } from "app/components/Alert";
import { Page, Section } from "app/components/Layout";
import { useEnvironmentContext } from "app/contexts";
import { useActiveProfile, useActiveWallet, useProfileJobs, useProfileUtils } from "app/hooks";
import { DelegateTable } from "domains/vote/components/DelegateTable";
import { VotesEmpty } from "domains/vote/components/VotesEmpty";
import { VotesHeader } from "domains/vote/components/VotesHeader";
import { VotingWallets } from "domains/vote/components/VotingWallets/VotingWallets";
import { useDelegates } from "domains/vote/hooks/use-delegates";
import { useVoteActions } from "domains/vote/hooks/use-vote-actions";
import { useVoteFilters } from "domains/vote/hooks/use-vote-filters";
import { useVoteQueryParameters } from "domains/vote/hooks/use-vote-query-parameters";
import React, { useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useHistory, useParams } from "react-router-dom";

export const Votes = () => {
	const { t } = useTranslation();
	const history = useHistory();
	const { walletId: hasWalletId } = useParams();
	const { env } = useEnvironmentContext();

	const activeProfile = useActiveProfile();
	const activeWallet = useActiveWallet();
	const [selectedWallet, setSelectedWallet] = useState<Contracts.IReadWriteWallet>(activeWallet);

	const { filter, voteDelegates, unvoteDelegates } = useVoteQueryParameters();
	const { syncProfileWallets } = useProfileJobs(activeProfile);

	const {
		filterProperties,
		isFilterChanged,
		filteredWalletsByCoin,
		hasEmptyResults,
		hasWallets,
		voteFilter,
		setVoteFilter,
		selectedAddress,
		setSelectedAddress,
		searchQuery,
		setSearchQuery,
		maxVotes,
		setMaxVotes,
	} = useVoteFilters({
		filter,
		hasWalletId,
		profile: activeProfile,
		wallet: activeWallet,
	});

	const {
		isLoadingDelegates,
		fetchDelegates,
		currentVotes,
		filteredDelegates,
		fetchVotes,
		votes,
		hasResignedDelegateVotes,
	} = useDelegates({
		env,
		profile: activeProfile,
		searchQuery,
		voteFilter,
	});

	const { navigateToSendVote } = useVoteActions({
		hasWalletId,
		profile: activeProfile,
		selectedAddress,
		wallet: activeWallet,
	});

	useEffect(() => {
		if (selectedAddress) {
			fetchVotes(selectedAddress);
		}
	}, [fetchVotes, selectedAddress]);

	useEffect(() => {
		if (hasWalletId) {
			fetchDelegates(activeWallet);
		}
	}, [activeWallet, fetchDelegates, hasWalletId]);

	useEffect(() => {
		if (votes?.length === 0) {
			setVoteFilter("all");
		}
	}, [votes, setVoteFilter]);

	useEffect(() => {
		syncProfileWallets({ reset: true });
	}, []);

	const handleSelectAddress = (address: string) => {
		const wallet = activeProfile.wallets().findByAddress(address);

		setSearchQuery("");
		setSelectedAddress(address);
		setSelectedWallet(wallet!);
		setMaxVotes(wallet?.network().maximumVotesPerWallet());

		fetchDelegates(wallet);
	};

	const hasSelectedAddress = !!selectedAddress;

	const useCompactTables = !activeProfile.appearance().get("useExpandedTables");

	return (
		<Page profile={activeProfile}>
			<Section border>
				<VotesHeader
					profile={activeProfile}
					setSearchQuery={setSearchQuery}
					selectedAddress={selectedAddress}
					isFilterChanged={isFilterChanged}
					filterProperties={filterProperties}
					totalCurrentVotes={currentVotes?.length || 0}
					selectedFilter={voteFilter}
					setSelectedFilter={setVoteFilter}
				/>
			</Section>

			{!hasWallets && (
				<Section>
					<VotesEmpty
						onCreateWallet={() => history.push(`/profiles/${activeProfile.id()}/wallets/create`)}
						onImportWallet={() => history.push(`/profiles/${activeProfile.id()}/wallets/import`)}
					/>
				</Section>
			)}

			{hasWallets && !hasSelectedAddress && (
				<VotingWallets
					showEmptyResults={hasEmptyResults}
					walletsByCoin={filteredWalletsByCoin}
					onSelectAddress={handleSelectAddress}
					isCompact={useCompactTables}
				/>
			)}

			{hasSelectedAddress && (
				<Section innerClassName="mb-27">
					<DelegateTable
						delegates={filteredDelegates}
						emptyText={t("VOTE.DELEGATE_TABLE.DELEGATES_NOT_FOUND")}
						isLoading={isLoadingDelegates}
						maxVotes={maxVotes!}
						votes={votes}
						unvoteDelegates={unvoteDelegates}
						voteDelegates={voteDelegates}
						selectedWallet={selectedWallet}
						onContinue={navigateToSendVote}
						isPaginationDisabled={searchQuery.length > 0}
						subtitle={
							hasResignedDelegateVotes ? (
								<Alert className="mb-6">
									<div data-testid="Votes__resigned-vote">
										<Trans
											i18nKey="VOTE.VOTES_PAGE.RESIGNED_VOTE"
											values={{
												name: currentVotes
													?.find(({ wallet }) => wallet!.isResignedDelegate())
													?.wallet!.username(),
											}}
											components={{ bold: <strong /> }}
										/>
									</div>
								</Alert>
							) : null
						}
					/>
				</Section>
			)}
		</Page>
	);
};
