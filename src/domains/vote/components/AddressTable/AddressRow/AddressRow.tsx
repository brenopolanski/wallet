import { Contracts } from "@payvo/profiles";
import { Address } from "app/components/Address";
import { AmountCrypto } from "app/components/Amount";
import { Avatar } from "app/components/Avatar";
import { Button } from "app/components/Button";
import { Circle } from "app/components/Circle";
import { Icon } from "app/components/Icon";
import { TableCell, TableRow } from "app/components/Table";
import { Tooltip } from "app/components/Tooltip";
import { WalletIcons } from "app/components/WalletIcons";
import { useEnvironmentContext } from "app/contexts";
import { useActiveProfile, useWalletAlias } from "app/hooks";
import cn from "classnames";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { assertReadOnlyWallet } from "utils/assertions";

interface AddressRowProperties {
	index: number;
	maxVotes: number;
	wallet: Contracts.IReadWriteWallet;
	onSelect?: (walletAddress: string, walletNetwork: string) => void;
	isCompact?: boolean;
}

const StatusIcon = ({ label, icon, color }: { label: string; icon: string; color: string }) => (
	<Tooltip content={label}>
		<span>
			<Icon name={icon} className={color} size="lg" data-testid="StatusIcon__icon" />
		</span>
	</Tooltip>
);

export const AddressRow = ({ index, maxVotes, wallet, onSelect, isCompact = false }: AddressRowProperties) => {
	const { t } = useTranslation();
	const { env } = useEnvironmentContext();
	const activeProfile = useActiveProfile();

	const { getWalletAlias } = useWalletAlias();
	const { alias } = useMemo(
		() =>
			getWalletAlias({
				address: wallet.address(),
				network: wallet.network(),
				profile: activeProfile,
			}),
		[activeProfile, getWalletAlias, wallet],
	);

	const [votes, setVotes] = useState<Contracts.VoteRegistryItem[]>([]);

	useEffect(() => {
		const loadVotes = () => {
			let votes: Contracts.VoteRegistryItem[];

			try {
				votes = wallet.voting().current();
			} catch {
				votes = [];
			}

			setVotes(votes);
		};

		loadVotes();
	}, [env, wallet]);

	const hasVotes = votes.length > 0;
	const [first, second, third, ...rest] = votes;

	const renderAvatar = (address?: string, username?: string) => (
		<Tooltip content={username}>
			<span className="flex">
				<Avatar
					className={cn({ "ring-2 ring-theme-background": isCompact })}
					size={isCompact ? "xs" : "lg"}
					address={address}
					noShadow={isCompact}
				/>
			</span>
		</Tooltip>
	);

	const renderRestOfVotes = (restOfVotes: number) => {
		const rest = (
			<span className="text-sm font-semibold text-theme-secondary-900 dark:text-theme-secondary-600">
				+{restOfVotes}
			</span>
		);

		if (isCompact) {
			return <div className="pl-3">{rest}</div>;
		}

		return (
			<Circle
				size="lg"
				className="relative bg-theme-background border-theme-secondary-900 dark:border-theme-secondary-600"
			>
				{rest}
			</Circle>
		);
	};

	const renderRank = (wallet?: Contracts.IReadOnlyWallet) => {
		if (!wallet) {
			return;
		}

		assertReadOnlyWallet(wallet);

		if (wallet.rank()) {
			return <span>#{wallet.rank()}</span>;
		}

		return <span className="text-theme-secondary-400">{t("COMMON.NOT_AVAILABLE")}</span>;
	};

	const renderDelegateStatus = (wallet: Contracts.IReadOnlyWallet | undefined, activeDelegates: number) => {
		if (!wallet) {
			return <></>;
		}

		assertReadOnlyWallet(wallet);

		if (wallet.isResignedDelegate()) {
			return <StatusIcon label={t("WALLETS.STATUS.RESIGNED")} icon="CircleCross" color="text-theme-danger-400" />;
		}

		if (Number(wallet.rank()) > activeDelegates) {
			return <StatusIcon label={t("WALLETS.STATUS.STANDBY")} icon="Clock" color="text-theme-warning-300" />;
		}

		return <StatusIcon label={t("WALLETS.STATUS.ACTIVE")} icon="CircleCheckMark" color="text-theme-success-600" />;
	};

	return (
		<TableRow>
			<TableCell
				variant="start"
				innerClassName={cn("font-bold", { "space-x-3": isCompact }, { "space-x-4": !isCompact })}
				isCompact={isCompact}
			>
				<Avatar className="flex-shrink-0" size={isCompact ? "xs" : "lg"} address={wallet.address()} noShadow />
				<div className="w-40 flex-1">
					<Address address={wallet.address()} walletName={alias} />
				</div>
			</TableCell>

			<TableCell innerClassName="justify-center space-x-2" isCompact={isCompact}>
				<WalletIcons wallet={wallet} exclude={["isKnown", "isSecondSignature", "isTestNetwork"]} />
			</TableCell>

			<TableCell
				innerClassName="justify-end font-bold text-theme-secondary-text whitespace-nowrap"
				isCompact={isCompact}
			>
				<AmountCrypto value={wallet.balance()} ticker={wallet.network().ticker()} />
			</TableCell>

			<TableCell
				innerClassName={cn("font-bold", { "space-x-3": isCompact }, { "space-x-4": !isCompact })}
				isCompact={isCompact}
			>
				{hasVotes ? (
					maxVotes === 1 ? (
						<>
							<Avatar size={isCompact ? "xs" : "lg"} address={votes[0].wallet?.address()} noShadow />
							<span>{votes[0].wallet?.username()}</span>
						</>
					) : (
						<div
							className={cn(
								"flex items-center",
								{ "-space-x-1": isCompact },
								{ "-space-x-2": !isCompact },
							)}
						>
							{renderAvatar(first.wallet?.address(), first.wallet?.username())}

							{second && renderAvatar(second.wallet?.address(), second.wallet?.username())}

							{third && renderAvatar(third.wallet?.address(), third.wallet?.username())}

							{rest &&
								rest.length === 1 &&
								renderAvatar(rest[0].wallet?.address(), rest[0].wallet?.username())}

							{rest && rest.length > 1 && renderRestOfVotes(rest.length)}
						</div>
					)
				) : (
					<>
						<Circle
							size={isCompact ? "xs" : "lg"}
							className="border-theme-secondary-300 dark:border-theme-secondary-800"
							noShadow
						/>
						<span className="text-theme-secondary-400">{t("COMMON.NOT_AVAILABLE")}</span>
					</>
				)}
			</TableCell>

			{maxVotes === 1 ? (
				<>
					<TableCell
						innerClassName="justify-center font-bold text-theme-secondary-text"
						isCompact={isCompact}
					>
						{renderRank(votes[0]?.wallet)}
					</TableCell>

					<TableCell innerClassName="justify-center" isCompact={isCompact}>
						{renderDelegateStatus(votes[0]?.wallet, wallet.network().delegateCount())}
					</TableCell>
				</>
			) : (
				<TableCell innerClassName="justify-center" isCompact={isCompact}>
					<div className="font-bold text-theme-secondary-400">
						<span className="text-theme-secondary-text">{hasVotes ? votes.length : "0"}</span>
						<span>/{maxVotes}</span>
					</div>
				</TableCell>
			)}

			<TableCell variant="end" innerClassName="justify-end" isCompact={isCompact}>
				<Button
					size={isCompact ? "icon" : undefined}
					disabled={!wallet.hasBeenFullyRestored() || !wallet.hasSyncedWithNetwork()}
					variant={isCompact ? "transparent" : "secondary"}
					className={cn({ "text-theme-primary-600 hover:text-theme-primary-700 -mr-3": isCompact })}
					onClick={() => onSelect?.(wallet.address(), wallet.networkId())}
					data-testid={`AddressRow__select-${index}`}
				>
					{t("COMMON.VOTE")}
				</Button>
			</TableCell>
		</TableRow>
	);
};
