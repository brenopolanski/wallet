import { Contracts } from "@payvo/sdk-profiles";
import { Avatar } from "app/components/Avatar";
import { Icon } from "app/components/Icon";
import { Link } from "app/components/Link";
import { TableCell, TableRow } from "app/components/Table";
import cn from "classnames";
import { delegateExistsInVotes } from "domains/vote/components/DelegateTable/DelegateTable.helpers";
import { VoteDelegateProperties } from "domains/vote/components/DelegateTable/DelegateTable.models";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { DelegateRowSkeleton } from "./DelegateRowSkeleton";
import { DelegateVoteAmount } from "./DelegateVoteAmount";
import { DelegateVoteButton } from "./DelegateVoteButton";

interface DelegateRowProperties {
	index: number;
	delegate: Contracts.IReadOnlyWallet;
	selectedUnvotes: VoteDelegateProperties[];
	selectedVotes: VoteDelegateProperties[];
	voted?: Contracts.VoteRegistryItem;
	isVoteDisabled?: boolean;
	isLoading?: boolean;
	isCompact?: boolean;
	selectedWallet: Contracts.IReadWriteWallet;
	availableBalance: number;
	setAvailableBalance: (balance: number) => void;
	toggleUnvotesSelected: (address: string, voteAmount?: number) => void;
	toggleVotesSelected: (address: string, voteAmount?: number) => void;
}

export const DelegateRow = ({
	index,
	voted,
	delegate,
	selectedUnvotes,
	selectedVotes,
	isVoteDisabled = false,
	isLoading = false,
	isCompact,
	selectedWallet,
	availableBalance,
	setAvailableBalance,
	toggleUnvotesSelected,
	toggleVotesSelected,
}: DelegateRowProperties) => {
	const { t } = useTranslation();
	const requiresStakeAmount = selectedWallet.network().votesAmountMinimum() > 0;

	const isSelectedUnvote = useMemo(
		() =>
			!!selectedUnvotes?.find((unvote) => {
				const isEqualToDelegate = unvote.delegateAddress === delegate?.address?.();

				if (isEqualToDelegate && requiresStakeAmount) {
					return unvote.amount === voted?.amount;
				}

				return isEqualToDelegate;
			}),
		[delegate, requiresStakeAmount, selectedUnvotes, voted],
	);

	const isSelectedVote = useMemo(
		() => !!voted || !!delegateExistsInVotes(selectedVotes, delegate?.address?.()),
		[delegate, voted, selectedVotes],
	);

	const isChanged = useMemo(() => {
		const alreadyExistsInVotes = !!delegateExistsInVotes(selectedVotes, delegate?.address?.());
		const alreadyExistsInUnvotes =
			!!delegateExistsInVotes(selectedUnvotes, delegate?.address?.()) && !isSelectedUnvote;

		return !!voted && (alreadyExistsInVotes || alreadyExistsInUnvotes);
	}, [selectedVotes, selectedUnvotes, isSelectedUnvote, voted, delegate]);

	const rowColor = useMemo(() => {
		if (isChanged) {
			return "bg-theme-warning-50 dark:bg-theme-background dark:border-theme-warning-600";
		}

		if (voted) {
			return isSelectedUnvote
				? "bg-theme-danger-50 dark:bg-theme-background dark:border-theme-danger-400"
				: "bg-theme-primary-50 dark:bg-theme-background dark:border-theme-primary-600";
		}

		if (isSelectedVote) {
			return "bg-theme-primary-reverse-50 dark:bg-theme-background dark:border-theme-primary-reverse-600";
		}
	}, [isChanged, voted, isSelectedVote, isSelectedUnvote]);

	if (isLoading) {
		return <DelegateRowSkeleton requiresStakeAmount={requiresStakeAmount} isCompact={isCompact} />;
	}

	const renderButton = () => {
		if (isChanged) {
			return (
				<DelegateVoteButton
					index={index}
					variant="warning"
					compactClassName="text-theme-warning-700 hover:text-theme-warning-800"
					isCompact={isCompact}
					onClick={() => {
						if (delegateExistsInVotes(selectedVotes, delegate?.address?.())) {
							toggleVotesSelected?.(delegate.address());
						}

						toggleUnvotesSelected?.(delegate.address(), voted!.amount);
					}}
				>
					{t("COMMON.CHANGED")}
				</DelegateVoteButton>
			);
		}

		if (voted) {
			if (isSelectedUnvote) {
				return (
					<DelegateVoteButton
						index={index}
						variant="danger"
						compactClassName="text-theme-danger-400 hover:text-theme-danger-500"
						isCompact={isCompact}
						onClick={() => toggleUnvotesSelected?.(delegate.address())}
					>
						{t("COMMON.UNSELECTED")}
					</DelegateVoteButton>
				);
			}

			return (
				<DelegateVoteButton
					index={index}
					variant="primary"
					compactClassName="text-theme-primary-600 hover:text-theme-primary-700"
					isCompact={isCompact}
					onClick={() => toggleUnvotesSelected?.(delegate.address())}
				>
					{t("COMMON.CURRENT")}
				</DelegateVoteButton>
			);
		}

		if (isVoteDisabled && !isSelectedVote) {
			return (
				<DelegateVoteButton index={index} disabled compactClassName="text-black" isCompact={isCompact}>
					{t("COMMON.SELECT")}
				</DelegateVoteButton>
			);
		}

		if (isSelectedVote) {
			return (
				<DelegateVoteButton
					index={index}
					variant="reverse"
					compactClassName="text-theme-primary-reverse-600 hover:text-theme-primary-reverse-700"
					isCompact={isCompact}
					onClick={() => toggleVotesSelected?.(delegate.address())}
				>
					{t("COMMON.SELECTED")}
				</DelegateVoteButton>
			);
		}

		return (
			<DelegateVoteButton
				index={index}
				variant="secondary"
				compactClassName="text-theme-primary-600 hover:text-theme-primary-700"
				isCompact={isCompact}
				onClick={() => toggleVotesSelected?.(delegate.address())}
			>
				{t("COMMON.SELECT")}
			</DelegateVoteButton>
		);
	};

	return (
		<TableRow key={delegate.address()}>
			<TableCell
				variant="start"
				innerClassName={cn(
					"font-bold border-2 border-r-0 border-transparent",
					{ "space-x-3": isCompact },
					{ "space-x-4": !isCompact },
					rowColor,
				)}
				isCompact={isCompact}
			>
				<Avatar size={isCompact ? "xs" : "lg"} className="-ml-0.5" address={delegate.address()} noShadow />
				<span>{delegate.username()}</span>
			</TableCell>

			<TableCell
				className="w-24"
				innerClassName={cn("justify-center border-t-2 border-b-2 border-transparent", rowColor)}
				isCompact={isCompact}
			>
				<Link
					data-testid="DelegateRow__address"
					to={delegate.explorerLink()}
					tooltip={t("COMMON.OPEN_IN_EXPLORER")}
					showExternalIcon={false}
					isExternal
				>
					<Icon name="ArrowExternal" />
				</Link>
			</TableCell>

			{requiresStakeAmount && (
				<DelegateVoteAmount
					voted={voted}
					selectedWallet={selectedWallet}
					isSelectedVote={isSelectedVote}
					isSelectedUnvote={isSelectedUnvote}
					selectedVotes={selectedVotes}
					selectedUnvotes={selectedUnvotes}
					delegateAddress={delegate.address()}
					availableBalance={availableBalance}
					setAvailableBalance={setAvailableBalance}
					toggleUnvotesSelected={toggleUnvotesSelected}
					toggleVotesSelected={toggleVotesSelected}
					isCompact={isCompact}
					rowColor={rowColor}
				/>
			)}

			<TableCell
				variant="end"
				className="w-40"
				innerClassName={cn("justify-end border-2 border-l-0 border-transparent", rowColor)}
				isCompact={isCompact}
			>
				<div className="-mr-0.5">{renderButton()}</div>
			</TableCell>
		</TableRow>
	);
};
