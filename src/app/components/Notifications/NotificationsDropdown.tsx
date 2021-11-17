import { Contracts, DTO } from "@payvo/sdk-profiles";
import { Button } from "app/components/Button";
import { Dropdown } from "app/components/Dropdown";
import { Icon } from "app/components/Icon";
import { NavigationButtonWrapper } from "app/components/NavigationBar/NavigationBar.blocks";
import { Notifications, useNotifications } from "app/components/Notifications";
import { TransactionDetailModal } from "domains/transaction/components/TransactionDetailModal";
import { WalletUpdate } from "domains/wallet/components/WalletUpdate";
import React, { useState } from "react";

export const NotificationsDropdown = ({ profile }: { profile: Contracts.IProfile }) => {
	const [transactionModalItem, setTransactionModalItem] = useState<DTO.ExtendedConfirmedTransactionData | undefined>(
		undefined,
	);
	const [isWalletUpdateOpen, setIsWalletUpdateOpen] = useState<boolean>();
	const [walletUpdateVersion, setWalletUpdateVersion] = useState<string>();

	const { hasUnread } = useNotifications({ profile });

	const handleNotificationAction = (id: string) => {
		const notification = profile.notifications().get(id);
		const action = `${notification.type}.${notification.action}`;

		// TODO: need to implement plugin notifications https://cryptoarkproject.slack.com/archives/CJFKZSV61/p1636975388100900
		/* istanbul ignore else */
		if (action === "release.update") {
			setWalletUpdateVersion(notification.meta.version);
			setIsWalletUpdateOpen(true);
		}
	};

	return (
		<div>
			<Dropdown
				dropdownClass="mt-8"
				toggleContent={
					<NavigationButtonWrapper className="group">
						<Button variant="transparent" size="icon" data-testid="navbar__buttons--notifications">
							<Icon name="Bell" size="lg" className="p-1" />
							{hasUnread && (
								<div className="flex absolute top-1 right-1 justify-center items-center p-1 rounded-full transition-all duration-100 ease-linear bg-theme-background dark:group-hover:bg-theme-secondary-800 group-hover:bg-theme-primary-100">
									<div className="w-2 h-2 rounded-full bg-theme-danger-500" />
								</div>
							)}
						</Button>
					</NavigationButtonWrapper>
				}
			>
				<div className="mt-2">
					<Notifications
						profile={profile}
						onTransactionClick={setTransactionModalItem}
						onNotificationAction={handleNotificationAction}
					/>
				</div>
			</Dropdown>

			{transactionModalItem && (
				<TransactionDetailModal
					isOpen={!!transactionModalItem}
					transactionItem={transactionModalItem}
					profile={profile}
					onClose={() => setTransactionModalItem(undefined)}
				/>
			)}

			<WalletUpdate
				version={walletUpdateVersion}
				isOpen={isWalletUpdateOpen}
				onClose={() => setIsWalletUpdateOpen(false)}
				onCancel={() => setIsWalletUpdateOpen(false)}
			/>
		</div>
	);
};
