import { Contracts } from "@payvo/profiles";
import { AmountCrypto } from "app/components/Amount";
import { Circle } from "app/components/Circle";
import { Icon } from "app/components/Icon";
import { Link } from "app/components/Link";
import { Tooltip } from "app/components/Tooltip";
import React from "react";
import { useTranslation } from "react-i18next";

const votesHelpLink = "https://ark.dev/docs/desktop-wallet/user-guides/how-to-vote-unvote";

interface EmptyVotesProperties {
	wallet: Contracts.IReadWriteWallet;
}

interface VotesProperties {
	wallet: Contracts.IReadWriteWallet;
	votes: Contracts.VoteRegistryItem[];
	activeDelegates: number;
	onButtonClick: (address?: string) => void;
}

const HintIcon = ({ tooltipContent }: { tooltipContent: string }) => (
	<Tooltip content={tooltipContent} className="mb-1">
		<span className="flex items-center justify-center w-5 h-5 rounded-full bg-theme-primary-600 dark:bg-theme-secondary-800">
			<Icon name="HintSmall" size="sm" className="text-theme-primary-200 dark:text-theme-secondary-200" />
		</span>
	</Tooltip>
);

const EmptyVotes = ({ wallet }: EmptyVotesProperties) => {
	const { t } = useTranslation();
	const maxVotes = wallet.network().maximumVotesPerWallet();

	return (
		<div className="flex flex-1 items-center space-x-4">
			<Circle
				size="lg"
				className="border-theme-secondary-500 text-theme-secondary-500 dark:border-theme-secondary-700 dark:text-theme-secondary-700"
				shadowClassName="ring-theme-background dark:ring-theme-secondary-background"
			>
				<Icon name="Vote" size="lg" />
			</Circle>

			<div className="flex flex-col justify-between">
				<span className="font-semibold">
					{t("WALLETS.PAGE_WALLET_DETAILS.VOTES.TITLE", { count: maxVotes })}
					<span className="ml-1 text-theme-secondary-500 dark:text-theme-secondary-700">0/{maxVotes}</span>
				</span>

				<span className="leading-none">
					<span className="mr-1 text-sm text-theme-secondary-500 dark:text-theme-secondary-700">
						{t("WALLETS.PAGE_WALLET_DETAILS.VOTES.EMPTY_DESCRIPTION")}
					</span>
					<Link to={votesHelpLink} isExternal>
						<span className="text-sm">{t("COMMON.LEARN_MORE")}</span>
					</Link>
				</span>
			</div>

			{wallet.network().usesLockedBalance() && (
				<div className="flex ml-4">
					<div className="flex flex-col justify-between pl-6 ml-6 font-semibold border-l border-theme-secondary-300 dark:border-theme-secondary-800">
						<span className="text-sm text-theme-secondary-500 dark:text-theme-secondary-700">
							{t("WALLETS.PAGE_WALLET_DETAILS.VOTES.LOCKED_VOTES")}
						</span>
						<AmountCrypto value={0} ticker={wallet.currency()} />
					</div>

					<div className="flex flex-col justify-between pl-6 ml-6 font-semibold border-l border-theme-secondary-300 dark:border-theme-secondary-800">
						<span className="text-sm text-theme-secondary-500 dark:text-theme-secondary-700">
							{t("WALLETS.PAGE_WALLET_DETAILS.VOTES.LOCKED_UNVOTES")}
						</span>
						<AmountCrypto value={0} ticker={wallet.currency()} />
					</div>
				</div>
			)}
		</div>
	);
};

const Votes = ({ wallet, votes, activeDelegates, onButtonClick }: VotesProperties) => {
	const { t } = useTranslation();

	const delegate = votes[0].wallet!;
	const maxVotes = wallet.network().maximumVotesPerWallet();

	// @ts-ignore
	const activeCount = votes.filter(({ wallet }) => wallet?.rank() <= activeDelegates).length;
	const resignedCount = votes.filter(({ wallet }) => wallet?.isResignedDelegate()).length;
	const standbyCount = votes.length - activeCount - resignedCount;

	const renderStatuses = () => {
		if (activeCount === votes.length) {
			if (activeCount > 1) {
				return (
					<span className="font-semibold text-theme-success-600">
						{t("WALLETS.PAGE_WALLET_DETAILS.VOTES.ACTIVE", { count: activeCount })}
					</span>
				);
			}

			return (
				<span className="font-semibold text-theme-success-600">
					{t("WALLETS.PAGE_WALLET_DETAILS.VOTES.ACTIVE", {
						count: activeCount,
					})}
				</span>
			);
		}

		if (standbyCount === votes.length) {
			if (standbyCount > 1) {
				return (
					<>
						<HintIcon
							tooltipContent={t("WALLETS.PAGE_WALLET_DETAILS.VOTES.NOT_FORGING", { count: standbyCount })}
						/>

						<span className="font-semibold text-theme-warning-500">
							{t("WALLETS.PAGE_WALLET_DETAILS.VOTES.STANDBY", { count: standbyCount })}
						</span>
					</>
				);
			}

			return (
				<>
					<HintIcon
						tooltipContent={t("WALLETS.PAGE_WALLET_DETAILS.VOTES.NOT_FORGING", { count: standbyCount })}
					/>

					<span className="font-semibold text-theme-warning-500">
						{t("WALLETS.PAGE_WALLET_DETAILS.VOTES.STANDBY", {
							count: standbyCount,
						})}
					</span>
				</>
			);
		}

		if (resignedCount === votes.length) {
			if (resignedCount > 1) {
				return (
					<>
						<HintIcon
							tooltipContent={t("WALLETS.PAGE_WALLET_DETAILS.VOTES.NOT_FORGING", {
								count: resignedCount,
							})}
						/>

						<span className="font-semibold text-theme-danger-600">
							{t("WALLETS.PAGE_WALLET_DETAILS.VOTES.RESIGNED", { count: resignedCount })}
						</span>
					</>
				);
			}

			return (
				<>
					<HintIcon
						tooltipContent={t("WALLETS.PAGE_WALLET_DETAILS.VOTES.NOT_FORGING", { count: resignedCount })}
					/>

					<span className="font-semibold text-theme-danger-600">
						{t("WALLETS.PAGE_WALLET_DETAILS.VOTES.RESIGNED", { count: resignedCount })}
					</span>
				</>
			);
		}

		if (activeCount === 0) {
			return (
				<>
					<HintIcon
						tooltipContent={t("WALLETS.PAGE_WALLET_DETAILS.VOTES.NOT_FORGING_COUNT", {
							count: standbyCount + resignedCount,
						})}
					/>

					<span className="font-semibold">
						{standbyCount > 0 && (
							<span className="text-theme-secondary-500 dark:text-theme-secondary-700">
								{t(`WALLETS.PAGE_WALLET_DETAILS.VOTES.STANDBY${standbyCount === 1 ? "_COUNT" : ""}`, {
									count: standbyCount,
								})}
							</span>
						)}

						{resignedCount > 0 && (
							<span className="text-theme-secondary-500 dark:text-theme-secondary-700">
								&nbsp;&&nbsp;
								{t("WALLETS.PAGE_WALLET_DETAILS.VOTES.RESIGNED_COUNT", { count: resignedCount })}
							</span>
						)}
					</span>
				</>
			);
		}

		return (
			<>
				<HintIcon
					tooltipContent={t("WALLETS.PAGE_WALLET_DETAILS.VOTES.NOT_FORGING_COUNT", {
						count: standbyCount + resignedCount,
					})}
				/>

				<span className="font-semibold">
					{t("WALLETS.PAGE_WALLET_DETAILS.VOTES.ACTIVE_COUNT", { count: activeCount })}

					{standbyCount > 0 && (
						<span className="text-theme-secondary-500 dark:text-theme-secondary-700">
							&nbsp;/&nbsp;
							{t(`WALLETS.PAGE_WALLET_DETAILS.VOTES.STANDBY${standbyCount === 1 ? "_COUNT" : ""}`, {
								count: standbyCount,
							})}
						</span>
					)}

					{resignedCount > 0 && (
						<span className="text-theme-secondary-500 dark:text-theme-secondary-700">
							&nbsp;{standbyCount > 0 ? "&" : "/"}&nbsp;
							{t("WALLETS.PAGE_WALLET_DETAILS.VOTES.RESIGNED_COUNT", { count: resignedCount })}
						</span>
					)}
				</span>
			</>
		);
	};

	return (
		<>
			<Circle
				size="lg"
				className="border-theme-secondary-900 text-theme-secondary-900 dark:border-theme-secondary-700 dark:text-theme-secondary-700"
				shadowClassName="ring-theme-background dark:ring-theme-secondary-background"
			>
				<Icon name="Vote" size="lg" />
			</Circle>

			<div className="flex flex-1 ml-4">
				<div className="flex flex-col justify-between font-semibold">
					<span className="text-sm text-theme-secondary-500 dark:text-theme-secondary-700">
						{t("WALLETS.PAGE_WALLET_DETAILS.VOTES.VOTING_FOR")}
					</span>

					{votes.length === 1 ? (
						<span>{delegate.username()}</span>
					) : (
						<span
							className="transition-colors duration-200 cursor-pointer text-theme-primary-600 hover:text-theme-primary-700 active:text-theme-primary-500"
							onClick={() => onButtonClick("current")}
						>
							{t("WALLETS.PAGE_WALLET_DETAILS.VOTES.MULTIVOTE")}
						</span>
					)}
				</div>

				{maxVotes === 1 && (
					<div className="flex flex-col justify-between pl-6 ml-6 font-semibold border-l border-theme-secondary-300 dark:border-theme-secondary-800">
						<span className="text-sm text-theme-secondary-500 dark:text-theme-secondary-700">
							{t("COMMON.RANK")}
						</span>
						<span>{delegate.rank() ? `#${delegate.rank()}` : t("COMMON.NOT_AVAILABLE")}</span>
					</div>
				)}

				{maxVotes > 1 && (
					<div className="flex flex-col justify-between pl-6 ml-6 font-semibold border-l border-theme-secondary-300 dark:border-theme-secondary-800">
						<span className="text-sm text-theme-secondary-500 dark:text-theme-secondary-700">
							{t("COMMON.VOTES")}
						</span>
						<span>
							{votes.length}
							<span className="text-theme-secondary-500 dark:text-theme-secondary-700">/{maxVotes}</span>
						</span>
					</div>
				)}

				{wallet.network().usesLockedBalance() && (
					<>
						<div className="flex flex-col justify-between pl-6 ml-6 font-semibold border-l border-theme-secondary-300 dark:border-theme-secondary-800">
							<span className="text-sm text-theme-secondary-500 dark:text-theme-secondary-700">
								{t("WALLETS.PAGE_WALLET_DETAILS.VOTES.LOCKED_VOTES")}
							</span>
							<AmountCrypto value={wallet.balance("lockedVotes")} ticker={wallet.currency()} />
						</div>

						<div className="flex flex-col justify-between pl-6 ml-6 font-semibold border-l border-theme-secondary-300 dark:border-theme-secondary-800">
							<span className="text-sm text-theme-secondary-500 dark:text-theme-secondary-700">
								{t("WALLETS.PAGE_WALLET_DETAILS.VOTES.LOCKED_UNVOTES")}
							</span>
							<AmountCrypto value={wallet.balance("lockedUnvotes")} ticker={wallet.currency()} />
						</div>
					</>
				)}
			</div>

			<div className="flex flex-col justify-between items-end pr-6 mr-6 font-semibold border-r border-theme-secondary-300 dark:border-theme-secondary-800">
				<span className="text-sm text-theme-secondary-500 dark:text-theme-secondary-700">
					{t("WALLETS.PAGE_WALLET_DETAILS.VOTES.DELEGATE_STATUS")}
				</span>
				<div className="flex justify-end items-center space-x-2">{renderStatuses()}</div>
			</div>
		</>
	);
};

export { EmptyVotes, Votes };
