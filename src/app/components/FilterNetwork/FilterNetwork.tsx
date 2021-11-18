import { Checkbox } from "app/components/Checkbox";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { FilterNetworksProperties, FilterOption } from "./models";
import { NetworkOptions } from "./NetworkOptions";
import { ToggleAllOption } from "./ToggleAllOption";

export const FilterNetwork = ({
	options = [],
	className,
	onChange,
	onViewAll,
	hideViewAll = true,
	title,
}: FilterNetworksProperties) => {
	const [networkList, setNetworkList] = useState(options);
	const [showAll, setShowAll] = useState(false);
	const { t } = useTranslation();

	useEffect(() => setNetworkList(options), [options]);

	const handleClick = (option: FilterOption, index: number) => {
		const list = networkList?.concat();

		option.isSelected = !option.isSelected;
		list.splice(index, 1, option);
		setNetworkList(list);

		onChange?.(option, list);
	};

	const handleToggleAll = () => {
		setShowAll(!showAll);

		const allNetworksSelected = options.map((option) => ({ ...option, isSelected: true }));

		if (!showAll) {
			onViewAll?.();
			onChange?.(allNetworksSelected[0], allNetworksSelected);
		}
	};

	const handleSelectAll = (checked: any) => {
		const shouldSelectAll = checked && !networkList.every((n) => n.isSelected);
		const allSelected = [...networkList].map((n) => ({ ...n, isSelected: shouldSelectAll }));
		onChange?.(allSelected[0], allSelected);
	};

	return (
		<div className={className} data-testid="FilterNetwork">
			{title && <div className="mb-3 text-sm font-bold text-theme-secondary-400">{title}</div>}

			<ToggleAllOption isSelected={showAll} isHidden={hideViewAll} onClick={handleToggleAll} />

			<NetworkOptions networks={networkList} onClick={handleClick} />

			{showAll && networkList.length > 1 && (
				<label className="inline-flex items-center mt-4 space-x-3 cursor-pointer text-theme-secondary-text">
					<Checkbox
						data-testid="FilterNetwork__select-all-checkbox"
						checked={networkList.every((option) => option.isSelected)}
						onChange={handleSelectAll}
					/>
					<span>{t("COMMON.SELECT_ALL")}</span>
				</label>
			)}
		</div>
	);
};

export const FilterNetworks = ({ options = [], ...properties }: FilterNetworksProperties) => {
	const { t } = useTranslation();

	const { liveNetworks, testNetworks } = useMemo(() => {
		const initial: { liveNetworks: FilterOption[]; testNetworks: FilterOption[] } = {
			liveNetworks: [],
			testNetworks: [],
		};

		return options.reduce((options, option) => {
			if (option.network.isLive()) {
				options.liveNetworks.push(option);
			} else {
				options.testNetworks.push(option);
			}

			return options;
		}, initial);
	}, [options]);

	return (
		<div className="space-y-4">
			{liveNetworks.length > 0 && (
				<FilterNetwork
					{...properties}
					title={t("COMMON.PUBLIC_NETWORKS")}
					options={liveNetworks}
					onChange={(_, updated) => properties.onChange?.(_, [...updated, ...testNetworks])}
				/>
			)}
			{properties.useTestNetworks && testNetworks.length > 0 && (
				<FilterNetwork
					{...properties}
					title={t("COMMON.DEVELOPMENT_NETWORKS")}
					options={testNetworks}
					onChange={(_, updated) => properties.onChange?.(_, [...updated, ...liveNetworks])}
				/>
			)}
		</div>
	);
};
