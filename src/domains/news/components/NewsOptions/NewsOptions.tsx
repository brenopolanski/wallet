import { Networks } from "@payvo/sdk";
import { Divider } from "app/components/Divider";
import { FilterNetwork, FilterOption } from "app/components/FilterNetwork";
import { useEnvironmentContext } from "app/contexts";
import { AVAILABLE_CATEGORIES } from "domains/news/news.constants";
import { AvailableNewsCategories } from "domains/news/news.contracts";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { SelectCategory } from "./components/SelectCategory";

interface Option {
	name: AvailableNewsCategories;
	isSelected: boolean;
}

interface NewsOptionsProperties {
	selectedCategories: AvailableNewsCategories[];
	selectedCoins: string[];
	onSubmit?: (data: object) => void;
}

// region for scrollable sidebar on small screen
const HEADER_HEIGHT = 84;
const VERTICAL_PADDING = 20 + 32;
// endregion

export const NewsOptions = ({ selectedCategories, selectedCoins, onSubmit }: NewsOptionsProperties) => {
	const { env } = useEnvironmentContext();

	const { t } = useTranslation();

	const [categories, setCategories] = useState<Option[]>(
		AVAILABLE_CATEGORIES.map((name) => ({
			isSelected: selectedCategories.length === 0 || selectedCategories.includes(name),
			name,
		})),
	);

	const [coinOptions, setCoinOptions] = useState(() => {
		const coins: Record<string, { network: Networks.Network; isSelected: boolean }> = {};

		for (const network of env.availableNetworks()) {
			const coin = network.coin();

			if (!coins[coin]) {
				coins[coin] = {
					isSelected: selectedCoins.includes(coin),
					network,
				};
			}
		}

		return Object.values(coins);
	});

	const showSelectAllCategories = useMemo(() => categories.some((option: Option) => !option.isSelected), [
		categories,
	]);

	const handleSelectCategory = (name: string) => {
		const selected = categories.filter((category: Option) => category.isSelected);

		if (selected.length === 1 && selected[0].name === name) {
			return;
		}

		setCategories(
			categories.map((category: Option) =>
				category.name === name
					? {
							...category,
							isSelected: !category.isSelected,
					  }
					: category,
			),
		);
	};

	const handleSelectAllCategories = () => {
		setCategories(
			categories.map((category: Option) => ({
				...category,
				isSelected: true,
			})),
		);
	};

	const handleQueryUpdate = useCallback(() => {
		const categoryNames = categories.reduce<AvailableNewsCategories[]>(
			(accumulator, category) =>
				category.name !== "All" && category.isSelected ? accumulator.concat(category.name) : accumulator,
			[],
		);

		const coinNames = coinOptions.reduce(
			(accumulator: string[], option: FilterOption) =>
				option.isSelected ? accumulator.concat(option.network.coin()) : accumulator,
			[],
		);

		onSubmit?.({
			categories: categoryNames,
			coins: coinNames,
		});
	}, [onSubmit, categories, coinOptions]);

	useEffect(() => {
		handleQueryUpdate();
	}, [handleQueryUpdate]);

	return (
		<div
			data-testid="NewsOptions"
			className="sticky top-26"
			style={{ height: `calc(100vh - (${HEADER_HEIGHT}px + ${VERTICAL_PADDING}px))` }}
		>
			<div className="overflow-y-auto p-10 pb-4 max-h-full rounded-lg border-2 bg-theme-background border-theme-primary-100 dark:border-theme-secondary-800">
				<div className="flex flex-col space-y-8">
					<div className="flex flex-col space-y-3">
						<div className="flex justify-between items-center">
							<h5 className="font-semibold">{t("COMMON.CATEGORY")}</h5>
							{showSelectAllCategories && (
								<button
									onClick={handleSelectAllCategories}
									className="text-xs font-semibold focus:outline-none text-theme-secondary-800"
								>
									{t("COMMON.SELECT_ALL")}
								</button>
							)}
						</div>

						<p className="text-sm text-theme-secondary-500">
							{t("NEWS.NEWS_OPTIONS.SELECT_YOUR_CATEGORIES")}
						</p>

						<div className="flex flex-wrap -mx-1">
							{categories.map((category, index) => (
								<SelectCategory
									data-testid={`NewsOptions__category-${category.name}`}
									key={index}
									className="p-1"
									checked={category.isSelected}
									onChange={() => handleSelectCategory(category.name)}
								>
									#{t(`NEWS.CATEGORIES.${category.name.toUpperCase()}`)}
								</SelectCategory>
							))}
						</div>
					</div>

					<Divider dashed />

					<div className="flex flex-col space-y-3">
						<h5 className="font-semibold">{t("NEWS.NEWS_OPTIONS.FILTER_ASSETS")}</h5>
						<p className="text-sm text-theme-secondary-500">
							{t("NEWS.NEWS_OPTIONS.YOUR_CURRENT_SELECTIONS")}:
						</p>

						<FilterNetwork
							className="pb-2.5"
							options={coinOptions}
							hideViewAll
							onChange={(_, networks) => setCoinOptions(networks)}
						/>
					</div>
				</div>
			</div>
		</div>
	);
};
