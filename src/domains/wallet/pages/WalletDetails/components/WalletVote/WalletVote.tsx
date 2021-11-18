import { Contracts, Environment } from "@payvo/sdk-profiles";
import { Button } from "app/components/Button";
import { Icon } from "app/components/Icon";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { EmptyVotes, Votes } from "./WalletVote.blocks";
import { WalletVoteSkeleton } from "./WalletVoteSkeleton";

interface WalletVoteProperties {
	wallet: Contracts.IReadWriteWallet;
	onButtonClick: (address?: string) => void;
	env: Environment;
	profile: Contracts.IProfile;
}

export const WalletVote = ({ wallet, onButtonClick, env, profile }: WalletVoteProperties) => {
	const { t } = useTranslation();
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const syncVotes = async () => {
			try {
				await env.delegates().sync(profile, wallet?.coinId(), wallet?.networkId());
				await wallet.synchroniser().votes();
			} catch {
				// TODO: Retry sync if error code is greater than 499. Needs status code number from sdk.
			}

			setIsLoading(false);
		};

		syncVotes();
	}, [wallet, env, profile]);

	if (isLoading) {
		return <WalletVoteSkeleton />;
	}

	const activeDelegates = wallet.network().delegateCount();

	let votes: Contracts.VoteRegistryItem[];

	try {
		votes = wallet.voting().current();
	} catch {
		votes = [];
	}

	const renderVotes = () => {
		if (votes.length === 0) {
			return <EmptyVotes wallet={wallet} />;
		}

		return <Votes wallet={wallet} votes={votes} activeDelegates={activeDelegates} onButtonClick={onButtonClick} />;
	};

	return (
		<div data-testid="WalletVote" className="flex items-center w-full">
			{renderVotes()}

			<Button
				data-testid="WalletVote__button"
				disabled={
					isLoading ||
					wallet.balance() === 0 ||
					(wallet.network().usesLockedBalance() &&
						wallet.balance("available") < wallet.network().votesAmountStep()) ||
					!wallet.hasBeenFullyRestored() ||
					!wallet.hasSyncedWithNetwork()
				}
				variant="secondary"
				className="space-x-2"
				isLoading={isLoading}
				onClick={() => onButtonClick()}
			>
				<Icon name="Vote" />
				<span>{t("COMMON.VOTE")}</span>
			</Button>
		</div>
	);
};
