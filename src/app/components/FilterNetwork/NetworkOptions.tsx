import { Badge } from "app/components/Badge";
import { Circle } from "app/components/Circle";
import { Icon } from "app/components/Icon";
import { Tooltip } from "app/components/Tooltip";
import React from "react";

import { FilterOption } from "./models";

export const NetworkOption = ({ network, isSelected, onClick }: FilterOption) => {
	const renderOption = () => {
		if (isSelected) {
			return (
				<Circle size="lg" className="relative border-theme-success-500 text-theme-success-500">
					<Icon name={network.ticker()} size="lg" />
					<Badge className="bg-theme-success-500 text-theme-success-100" icon="CheckmarkSmall" />
				</Circle>
			);
		}

		return (
			<Circle
				size="lg"
				className="relative border-theme-secondary-300 text-theme-secondary-300 dark:border-theme-secondary-800"
			>
				<Icon name={network.ticker()} size="lg" />
				<Badge className="border-theme-secondary-300 dark:border-theme-secondary-800" />
			</Circle>
		);
	};

	return (
		<li
			className="inline-block pr-5 pb-5 cursor-pointer"
			data-testid={`NetworkOption__${network.id()}`}
			onClick={onClick}
		>
			<Tooltip content={network.displayName()}>{renderOption()}</Tooltip>
		</li>
	);
};

export const NetworkOptions = ({
	networks,
	onClick,
}: {
	networks: FilterOption[];
	onClick: (network: FilterOption, key: number) => void;
}) => (
	<ul data-testid="NetworkOptions" className="flex flex-wrap">
		{networks.map((network: FilterOption, key: number) => (
			<NetworkOption {...network} key={key} onClick={() => onClick(network, key)} />
		))}
	</ul>
);
