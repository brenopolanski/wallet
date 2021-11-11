import { Contracts } from "@payvo/profiles";
import { Address } from "app/components/Address";
import { Amount } from "app/components/Amount";
import { Avatar } from "app/components/Avatar";
import React from "react";
import tw, { styled } from "twin.macro";
import { assertReadOnlyWallet } from "utils/assertions";

interface VoteListProperties {
	votes: Contracts.VoteRegistryItem[] | Contracts.IReadOnlyWallet[];
	currency: string;
	isNegativeAmount?: boolean;
}

interface VoteItemProperties {
	wallet: Contracts.IReadOnlyWallet;
	amount?: number;
	currency: string;
	isNegativeAmount?: boolean;
}

const ListWrapper = styled.div`
	${tw`flex-1 -my-2`}
`;

const VoteItem = ({ wallet, amount = 0, currency, isNegativeAmount }: VoteItemProperties) => (
	<div className="flex items-center py-4 border-b border-dashed last:border-b-0 border-theme-secondary-300 dark:border-theme-secondary-800">
		<Avatar size="sm" address={wallet.address()} />

		<div className="flex-1 ml-4 w-28">
			<Address address={wallet.address()} walletName={wallet.username()} />
		</div>

		{amount > 0 && (
			<div className="flex-grow pl-3 text-right">
				<Amount ticker={currency} value={amount} isNegative={isNegativeAmount} showSign />
			</div>
		)}
	</div>
);

export const VoteList = ({ votes, currency, isNegativeAmount = false }: VoteListProperties) => {
	if (votes.length === 0) {
		return null;
	}

	if ((votes[0] as Contracts.VoteRegistryItem).amount === undefined) {
		return (
			<ListWrapper>
				{(votes as Contracts.IReadOnlyWallet[]).map((vote: Contracts.IReadOnlyWallet, index: number) => (
					<VoteItem currency={currency} key={index} wallet={vote} />
				))}
			</ListWrapper>
		);
	}

	const renderVoteItem = (vote: Contracts.VoteRegistryItem, index: number) => {
		assertReadOnlyWallet(vote.wallet);

		return (
			<VoteItem
				key={index}
				wallet={vote.wallet}
				amount={vote.amount}
				currency={currency}
				isNegativeAmount={isNegativeAmount}
			/>
		);
	};

	return (
		<ListWrapper>
			{(votes as Contracts.VoteRegistryItem[]).map((vote: Contracts.VoteRegistryItem, index: number) =>
				renderVoteItem(vote, index),
			)}
		</ListWrapper>
	);
};
