import { Contracts } from "@payvo/profiles";
import { images } from "app/assets/images";
import { Avatar } from "app/components/Avatar";
import { Button } from "app/components/Button";
import { Dropdown } from "app/components/Dropdown";
import { Icon } from "app/components/Icon";
import { NotificationsDropdown } from "app/components/Notifications";
import { Action } from "app/components/Notifications/contracts";
import { Tooltip } from "app/components/Tooltip";
import { useConfiguration } from "app/contexts";
import { useScroll, useTheme } from "app/hooks";
import cn from "classnames";
import { ReceiveFunds } from "domains/wallet/components/ReceiveFunds";
import { SearchWallet } from "domains/wallet/components/SearchWallet";
import { SelectedWallet } from "domains/wallet/components/SearchWallet/SearchWallet.models";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, useHistory } from "react-router-dom";
import tw, { css, styled } from "twin.macro";
import { NavbarVariant } from "types";
import { openExternal } from "utils/electron-utils";

import { BackButton } from "./components/BackButton";
import { Balance } from "./components/Balance";
import { defaultStyle } from "./NavigationBar.styles";

const { PayvoLogo } = images.common;

interface MenuItem {
	title: string;
	mountPath: any;
}

interface NavigationBarProperties {
	title?: string;
	isBackDisabled?: boolean;
	profile?: Contracts.IProfile;
	variant?: NavbarVariant;
	menu: MenuItem[];
	userActions?: Action[];
	avatarImage?: string;
	onUserAction?: any;
	noBorder?: boolean;
	noShadow?: boolean;
}

const NavWrapper = styled.nav<{ noBorder?: boolean; noShadow?: boolean; scroll?: number }>`
	${defaultStyle}

	${tw`sticky inset-x-0 top-0 transition-all duration-200 border-b border-theme-background bg-theme-background`}

	${({ noBorder, scroll }) => {
		if (!noBorder && !scroll) {
			return tw`border-theme-secondary-300 dark:border-theme-secondary-800`;
		}
	}}

	${({ noShadow, scroll }) => {
		if (!noShadow && scroll) {
			return tw`shadow-header-smooth dark:shadow-header-smooth-dark`;
		}
	}};
`;

interface UserInfoProperties {
	avatarImage?: string;
	onUserAction?: any;
	userActions?: Action[];
	userInitials?: string;
}

const UserInfo = ({ onUserAction, avatarImage, userActions, userInitials }: UserInfoProperties) => (
	<Dropdown
		onSelect={onUserAction}
		options={userActions}
		dropdownClass="mt-8"
		toggleContent={(isOpen: boolean) => (
			<div
				className="relative justify-center items-center align-middle rounded-full cursor-pointer"
				data-testid="navbar__useractions"
			>
				<Avatar size="lg" highlight={isOpen}>
					{avatarImage?.endsWith("</svg>") ? (
						<>
							<img alt="Profile Avatar" src={`data:image/svg+xml;utf8,${avatarImage}`} />
							<span className="absolute text-sm font-semibold text-theme-background dark:text-theme-text">
								{userInitials}
							</span>
						</>
					) : (
						<img
							alt="Profile Avatar"
							className="object-cover w-11 h-11 bg-center bg-no-repeat bg-cover rounded-full"
							src={avatarImage}
						/>
					)}
				</Avatar>
			</div>
		)}
	/>
);

const LogoContainer = styled.div`
	${tw`flex items-center justify-center my-auto mr-4 pl-0.5 text-white rounded-xl w-11 h-11 bg-theme-success-600`};
`;

const NavigationButtonWrapper = styled.div`
	${css`
		button {
			${tw`w-11 h-11 overflow-hidden rounded text-theme-secondary-700 dark:text-theme-secondary-600 not-disabled:(hover:text-theme-primary-600 hover:bg-theme-primary-100 dark:hover:bg-theme-secondary-800 dark:hover:text-theme-secondary-100)`};
		}
	`};
`;

const NavigationBar = ({
	title,
	isBackDisabled,
	profile,
	variant,
	menu,
	userActions,
	noBorder,
	noShadow,
}: NavigationBarProperties) => {
	const history = useHistory();
	const { t } = useTranslation();
	const { setTheme } = useTheme();

	const [searchWalletIsOpen, setSearchWalletIsOpen] = useState(false);

	const [selectedWallet, setSelectedWallet] = useState<SelectedWallet | undefined>();

	const handleSelectWallet = (wallet: SelectedWallet) => {
		setSearchWalletIsOpen(false);
		setSelectedWallet(wallet);
	};

	const { profileIsSyncingExchangeRates } = useConfiguration();

	const renderMenu = () => {
		if (!profile?.id()) {
			return null;
		}

		return menu.map((menuItem: any, index: number) => (
			<li key={index} className="flex">
				<NavLink
					to={menuItem.mountPath(profile.id())}
					title={menuItem.title}
					className="flex relative items-center font-semibold transition-colors duration-200 focus:outline-none text-md text-theme-secondary-text ring-focus"
					data-ring-focus-margin="-mx-2"
				>
					{menuItem.title}
				</NavLink>
			</li>
		));
	};

	const getUserInitials = () => {
		const name = profile?.settings().get(Contracts.ProfileSetting.Name);
		return name ? (name as string).slice(0, 2).toUpperCase() : undefined;
	};

	const profileWalletsCount = profile?.wallets().count();
	const wallets = useMemo(() => {
		if (!profile) {
			return [];
		}

		if (profile?.settings().get(Contracts.ProfileSetting.UseTestNetworks)) {
			return profile?.wallets().values();
		}

		return profile
			?.wallets()
			.values()
			.filter((wallet) => wallet.network().isLive());
	}, [profile, profileWalletsCount]); // eslint-disable-line react-hooks/exhaustive-deps

	const scroll = useScroll();

	const isVariantFull = variant === "full";

	return (
		<NavWrapper
			aria-labelledby="main menu"
			noBorder={noBorder === undefined ? !isVariantFull : noBorder}
			noShadow={noShadow}
			scroll={scroll}
		>
			<div className="flex relative h-21">
				{isVariantFull && <BackButton className="flex w-12" disabled={isBackDisabled} />}

				<div className={cn("flex flex-1 px-8", { "ml-12": !isVariantFull })}>
					<div className="flex items-center my-auto">
						<LogoContainer>
							<PayvoLogo height={28} />
						</LogoContainer>

						{title && <span className="text-2xl font-bold">{title}</span>}
					</div>

					{isVariantFull && (
						<>
							<ul className="flex mr-auto ml-4 space-x-8 h-21">{renderMenu()}</ul>

							<div className="flex items-center my-auto space-x-4">
								{profile && <NotificationsDropdown profile={profile} />}

								<div className="h-8 border-r border-theme-secondary-300 dark:border-theme-secondary-800" />

								<div className="flex items-center">
									<Tooltip content={wallets.length > 0 ? undefined : t("COMMON.NOTICE_NO_WALLETS")}>
										<NavigationButtonWrapper>
											<Button
												data-testid="navbar__buttons--send"
												disabled={wallets.length === 0}
												size="icon"
												variant="transparent"
												onClick={() => {
													const sendTransferPath = `/profiles/${profile?.id()}/send-transfer`;

													// add query param reset = 1 if already on send transfer page
													/* istanbul ignore next: tested in e2e */
													const reset =
														history.location.pathname === sendTransferPath ? 1 : 0;
													history.push(`${sendTransferPath}?reset=${reset}`);
												}}
											>
												<Icon name="DoubleArrowRight" size="lg" className="p-1" />
											</Button>
										</NavigationButtonWrapper>
									</Tooltip>
								</div>

								<div className="h-8 border-r border-theme-secondary-300 dark:border-theme-secondary-800" />

								<div className="flex items-center">
									<Tooltip content={wallets.length > 0 ? undefined : t("COMMON.NOTICE_NO_WALLETS")}>
										<NavigationButtonWrapper>
											<Button
												data-testid="navbar__buttons--receive"
												disabled={wallets.length === 0}
												size="icon"
												variant="transparent"
												onClick={() => setSearchWalletIsOpen(true)}
											>
												<Icon name="QrCode" size="lg" className="p-1" />
											</Button>
										</NavigationButtonWrapper>
									</Tooltip>
								</div>

								<div className="h-8 border-r border-theme-secondary-300 dark:border-theme-secondary-800" />
							</div>

							<div className="flex items-center my-auto ml-8 space-x-4">
								<Balance profile={profile} isLoading={profileIsSyncingExchangeRates} />

								<UserInfo
									userInitials={getUserInitials()}
									avatarImage={profile?.avatar()}
									userActions={userActions}
									onUserAction={(action: any) => {
										if (action?.isExternal) {
											return openExternal(action.mountPath());
										}

										if (action?.value === "sign-out") {
											profile?.status().reset();

											setTheme("system");
										}

										return history.push(action.mountPath(profile?.id()));
									}}
								/>
							</div>
						</>
					)}
				</div>
			</div>

			{profile && (
				<>
					<SearchWallet
						profile={profile}
						isOpen={searchWalletIsOpen}
						title={t("WALLETS.MODAL_SELECT_ACCOUNT.TITLE")}
						description={t("WALLETS.MODAL_SELECT_ACCOUNT.DESCRIPTION")}
						searchPlaceholder={t("WALLETS.MODAL_SELECT_ACCOUNT.SEARCH_PLACEHOLDER")}
						wallets={wallets}
						onSelectWallet={handleSelectWallet}
						onClose={() => setSearchWalletIsOpen(false)}
					/>

					{selectedWallet && (
						<ReceiveFunds
							isOpen={true}
							address={selectedWallet.address}
							name={selectedWallet.name}
							network={selectedWallet.network}
							onClose={() => setSelectedWallet(undefined)}
						/>
					)}
				</>
			)}
		</NavWrapper>
	);
};

NavigationBar.defaultProps = {
	menu: [],
	userActions: [],
	variant: "full",
};

export { NavigationBar, NavigationButtonWrapper };
