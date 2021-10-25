import { Contracts } from "@payvo/profiles";
import { Icon } from "app/components//Icon";
import { ControlButton } from "app/components/ControlButton";
import { Dropdown } from "app/components/Dropdown";
import { Header } from "app/components/Header";
import { HeaderSearchBar } from "app/components/Header/HeaderSearchBar";
import { FilterWallets } from "domains/dashboard/components/FilterWallets";
import { FilterOption, VotesFilter } from "domains/vote/components/VotesFilter";
import React from "react";
import { useTranslation } from "react-i18next";

interface VotesHeaderProperties {
	profile: Contracts.IProfile;
	setSearchQuery: (query: string) => void;
	selectedAddress?: string;
	isFilterChanged: boolean;
	filterProperties: any;
	totalCurrentVotes: number;
	selectedFilter?: FilterOption;
	setSelectedFilter?: (selected: FilterOption) => void;
}

export const VotesHeader = ({
	profile,
	setSearchQuery,
	selectedAddress,
	isFilterChanged,
	filterProperties,
	totalCurrentVotes,
	selectedFilter,
	setSelectedFilter,
}: VotesHeaderProperties) => {
	const { t } = useTranslation();

	const renderPlaceholder = () => {
		if (selectedAddress) {
			return t("VOTE.VOTES_PAGE.SEARCH_DELEGATE_PLACEHOLDER");
		}

		return t("VOTE.VOTES_PAGE.SEARCH_WALLET_PLACEHOLDER");
	};

	return (
		<Header
			title={t("VOTE.VOTES_PAGE.TITLE")}
			subtitle={t("VOTE.VOTES_PAGE.SUBTITLE")}
			extra={
				profile.wallets().count() ? (
					<div className="flex items-center space-x-5 text-theme-primary-200">
						<HeaderSearchBar
							placeholder={renderPlaceholder()}
							onSearch={setSearchQuery}
							onReset={() => setSearchQuery("")}
						/>

						<div className="h-10 border-l border-theme-secondary-300 dark:border-theme-secondary-800" />

						{selectedAddress && (
							<VotesFilter
								totalCurrentVotes={totalCurrentVotes}
								selectedOption={selectedFilter}
								onChange={setSelectedFilter}
							/>
						)}

						{!selectedAddress && (
							<div data-testid="Votes__FilterWallets">
								<Dropdown
									position="right"
									toggleContent={
										<ControlButton isChanged={isFilterChanged}>
											<div className="flex justify-center items-center w-5 h-5">
												<Icon name="SlidersVertical" size="lg" />
											</div>
										</ControlButton>
									}
								>
									<div className="py-7 px-10 w-128">
										<FilterWallets {...filterProperties} />
									</div>
								</Dropdown>
							</div>
						)}
					</div>
				) : null
			}
		/>
	);
};
