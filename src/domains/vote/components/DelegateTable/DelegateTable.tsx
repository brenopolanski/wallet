import { Contracts } from "@payvo/sdk-profiles";
import { EmptyResults } from "app/components/EmptyResults";
import { Pagination } from "app/components/Pagination";
import { Table } from "app/components/Table";
import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { DelegateFooter } from "./DelegateFooter";
import { DelegateRow } from "./DelegateRow";
import { delegateExistsInVotes, useDelegateTableColumns } from "./DelegateTable.helpers";
import { DelegateTableProperties, VoteDelegateProperties } from "./DelegateTable.models";

const ITEMS_PER_PAGE = 51;

export const DelegateTable: FC<DelegateTableProperties> = ({
	delegates,
	isLoading = false,
	maxVotes,
	unvoteDelegates,
	voteDelegates,
	selectedWallet,
	votes,
	resignedDelegateVotes,
	onContinue,
	isCompact,
	subtitle,
}) => {
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

	useEffect(() => {
		if (!resignedDelegateVotes?.length) {
			return;
		}

		for (const { wallet } of resignedDelegateVotes) {
			if (delegateExistsInVotes(selectedUnvotes, wallet!.address())) {
				continue;
			}

			toggleUnvotesSelected(wallet!.address());
		}
	}, [resignedDelegateVotes, selectedUnvotes]); // eslint-disable-line react-hooks/exhaustive-deps

	const toggleUnvotesSelected = useCallback(
		(address: string, voteAmount?: number) => {
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
		},
		[selectedUnvotes, votes, setSelectedUnvotes, setSelectedVotes, maxVotes, selectedVotes.length],
	);

	const toggleVotesSelected = useCallback(
		(address: string, voteAmount?: number) => {
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
		},
		[selectedVotes, hasVotes, setSelectedUnvotes, maxVotes, votes],
	);

	const handleSelectPage = useCallback(
		(page: number) => {
			setCurrentPage(page);
		},
		[setCurrentPage],
	);

	const showSkeleton = useMemo(() => totalDelegates === 0 && isLoading, [totalDelegates, isLoading]);
	const tableData = useMemo<Contracts.IReadOnlyWallet[]>(() => {
		const paginator = () => {
			if (isPaginationDisabled) {
				return delegates;
			}

			const offset = (currentPage - 1) * ITEMS_PER_PAGE;
			return delegates.slice(offset).slice(0, ITEMS_PER_PAGE);
		};
		const skeletonList = Array.from<Contracts.IReadOnlyWallet>({ length: 8 }).fill({} as Contracts.IReadOnlyWallet);

		return showSkeleton ? skeletonList : paginator();
	}, [isPaginationDisabled, currentPage, delegates, showSkeleton]);

	const renderTableRow = useCallback(
		(delegate: Contracts.IReadOnlyWallet, index: number) => {
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
		},
		[
			votes,
			selectedUnvotes,
			selectedVotes,
			selectedWallet,
			availableBalance,
			setAvailableBalance,
			isVoteDisabled,
			showSkeleton,
			isCompact,
			toggleUnvotesSelected,
			toggleVotesSelected,
			hasVotes,
		],
	);

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

			<Table columns={columns} data={tableData}>
				{renderTableRow}
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
