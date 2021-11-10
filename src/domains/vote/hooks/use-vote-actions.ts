import { Contracts } from "@payvo/profiles";
import { VoteDelegateProperties } from "domains/vote/components/DelegateTable/DelegateTable.models";
import { appendParameters } from "domains/vote/utils/url-parameters";
import { useHistory } from "react-router-dom";

interface VoteActionsProperties {
	profile: Contracts.IProfile;
	wallet: Contracts.IReadWriteWallet;
	selectedAddress: string;
	selectedNetwork: string;
	hasWalletId: boolean;
}

export const useVoteActions = ({
	profile,
	wallet,
	selectedAddress,
	selectedNetwork,
	hasWalletId,
}: VoteActionsProperties) => {
	const history = useHistory();

	const navigateToSendVote = (unvotes: VoteDelegateProperties[], votes: VoteDelegateProperties[]) => {
		const walletId = hasWalletId
			? wallet.id()
			: profile.wallets().findByAddressWithNetwork(selectedAddress, selectedNetwork)?.id();

		const parameters = new URLSearchParams();

		appendParameters(parameters, "unvote", unvotes);

		appendParameters(parameters, "vote", votes);

		history.push({
			pathname: `/profiles/${profile.id()}/wallets/${walletId}/send-vote`,
			search: `?${parameters}`,
		});
	};

	return { navigateToSendVote };
};
