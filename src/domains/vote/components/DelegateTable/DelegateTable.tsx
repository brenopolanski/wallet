import { Contracts } from "@payvo/profiles";
import { EmptyResults } from "app/components/EmptyResults";
import { Pagination } from "app/components/Pagination";
import { Table } from "app/components/Table";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { DelegateFooter } from "./DelegateFooter";
import { DelegateRow } from "./DelegateRow";
import { delegateExistsInVotes, useDelegateTableColumns } from "./DelegateTable.helpers";
import { DelegateTableProperties, VoteDelegateProperties } from "./DelegateTable.models";

const ITEMS_PER_PAGE = 51;

export const DelegateTable = ({
	delegates,
	isLoading = false,
	maxVotes,
	unvoteDelegates,
	voteDelegates,
	selectedWallet,
	votes,
	onContinue,
	isCompact,
	subtitle,
}: DelegateTableProperties) => {
	const { t } = useTranslation();
	const [currentPage, setCurrentPage] = useState(1);
	const [selectedUnvotes, setSelectedUnvotes] = useState<VoteDelegateProperties[]>(unvoteDelegates);
	const [selectedVotes, setSelectedVotes] = useState<VoteDelegateProperties[]>(voteDelegates);
	const [isVoteDisabled, setIsVoteDisabled] = useState(false);
	const [availableBalance, setAvailableBalance] = useState(selectedWallet.balance());

	const columns = useDelegateTableColumns({ isLoading, network: selectedWallet.network() });

	const totalDelegates = delegates.length;
	const isPaginationDisabled = totalDelegates <= ITEMS_PER_PAGE;
	const hasVotes = votes.length > 0;

	useEffect(() => {
		if (voteDelegates.length === 0) {
			return;
		}

		const totalVotesAmount = voteDelegates.reduce((accumulator, { amount }) => accumulator + amount, 0);

		setAvailableBalance(availableBalance - totalVotesAmount);
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		if ((hasVotes || maxVotes > 1) && selectedVotes.length === maxVotes) {
			setIsVoteDisabled(true);
		} else {
			setIsVoteDisabled(false);
		}
	}, [hasVotes, maxVotes, selectedVotes]);

	useEffect(() => window.scrollTo({ behavior: "smooth", top: 0 }), [currentPage]);

	const toggleUnvotesSelected = (address: string, voteAmount?: number) => {
		let unvotesInstance = selectedUnvotes;
		const delegateAlreadyExists = delegateExistsInVotes(selectedUnvotes, address);

		if (delegateAlreadyExists) {
			unvotesInstance = selectedUnvotes.filter(({ delegateAddress }) => delegateAddress !== address);
		}

		if (delegateAlreadyExists && voteAmount === undefined) {
			setSelectedUnvotes(unvotesInstance);

			if (maxVotes === 1 && selectedVotes.length > 0) {
				setSelectedVotes([]);
			}

			return;
		}

		const voteDelegate: VoteDelegateProperties = {
			amount: voteAmount ?? 0,
			delegateAddress: address,
		};

		const delegate = votes?.find(({ wallet }) => wallet?.address() === address);
		if (delegate?.amount && voteAmount === undefined) {
			voteDelegate.amount = delegate.amount;
		}

		if (maxVotes === 1) {
			setSelectedUnvotes([voteDelegate]);
		} else {
			setSelectedUnvotes([...unvotesInstance, voteDelegate]);
		}
	};

	const toggleVotesSelected = (address: string, voteAmount?: number) => {
		let votesInstance = selectedVotes;
		const delegateAlreadyExists = delegateExistsInVotes(selectedVotes, address);

		if (delegateAlreadyExists) {
			votesInstance = selectedVotes.filter(({ delegateAddress }) => delegateAddress !== address);
		}

		if (delegateAlreadyExists && voteAmount === undefined) {
			setSelectedVotes(votesInstance);

			if (maxVotes === 1 && hasVotes) {
				setSelectedUnvotes([]);
			}

			return;
		}

		const voteDelegate: VoteDelegateProperties = {
			amount: voteAmount ?? 0,
			delegateAddress: address,
		};

		if (maxVotes === 1) {
			setSelectedVotes([voteDelegate]);

			if (hasVotes) {
				setSelectedUnvotes(
					votes.map((vote) => ({
						amount: vote.amount,
						delegateAddress: vote.wallet!.address(),
					})),
				);
			}
		} else {
			setSelectedVotes([...votesInstance, voteDelegate]);
		}
	};

	const handleSelectPage = (page: number) => {
		setCurrentPage(page);
	};

	const paginator = (items: Contracts.IReadOnlyWallet[], currentPage: number) => {
		if (isPaginationDisabled) {
			return items;
		}

		const offset = (currentPage - 1) * ITEMS_PER_PAGE;
		return items.slice(offset).slice(0, ITEMS_PER_PAGE);
	};

	const showSkeleton = useMemo(() => totalDelegates === 0 && isLoading, [totalDelegates, isLoading]);
	const skeletonList = Array.from({ length: 8 }).fill({});
	const data = showSkeleton ? skeletonList : paginator(delegates, currentPage);

	if (!isLoading && totalDelegates === 0) {
		return (
			<EmptyResults
				className="mt-16"
				title={t("COMMON.EMPTY_RESULTS.TITLE")}
				subtitle={t("VOTE.VOTES_PAGE.NO_RESULTS")}
			/>
		);
	}

	return (
		<div data-testid="DelegateTable">
			<h2 className="mb-6 text-2xl font-bold">{t("VOTE.DELEGATE_TABLE.TITLE")}</h2>

			{subtitle && subtitle}

			<Table columns={columns} data={data}>
				{(delegate: Contracts.IReadOnlyWallet, index: number) => {
					let voted: Contracts.VoteRegistryItem | undefined;

					if (hasVotes) {
						voted = votes?.find(({ wallet }) => wallet?.address() === delegate?.address?.());
					}

					return (
						<DelegateRow
							index={index}
							delegate={delegate}
							selectedUnvotes={selectedUnvotes}
							selectedVotes={selectedVotes}
							selectedWallet={selectedWallet}
							availableBalance={availableBalance}
							setAvailableBalance={setAvailableBalance}
							voted={voted}
							isVoteDisabled={isVoteDisabled}
							isLoading={showSkeleton}
							isCompact={isCompact}
							toggleUnvotesSelected={toggleUnvotesSelected}
							toggleVotesSelected={toggleVotesSelected}
						/>
					);
				}}
			</Table>

			<div className="flex justify-center mt-8 w-full">
				{totalDelegates > ITEMS_PER_PAGE && !isPaginationDisabled && (
					<Pagination
						totalCount={totalDelegates}
						itemsPerPage={ITEMS_PER_PAGE}
						currentPage={currentPage}
						onSelectPage={handleSelectPage}
					/>
				)}
			</div>

			<DelegateFooter
				selectedWallet={selectedWallet}
				availableBalance={availableBalance}
				selectedVotes={selectedVotes}
				selectedUnvotes={selectedUnvotes}
				maxVotes={maxVotes}
				onContinue={onContinue}
			/>
		</div>
	);
};
