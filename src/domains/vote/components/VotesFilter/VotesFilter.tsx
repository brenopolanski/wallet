import { Checkbox } from "app/components/Checkbox";
import { ControlButton } from "app/components/ControlButton";
import { Dropdown } from "app/components/Dropdown";
import { Icon } from "app/components/Icon";
import { Tooltip } from "app/components/Tooltip";
import cn from "classnames";
import React from "react";
import { useTranslation } from "react-i18next";

import { FilterProperties } from "./models";

export const VotesFilter = ({ onChange, selectedOption = "all", totalCurrentVotes }: FilterProperties) => {
	const { t } = useTranslation();

	return (
		<div data-testid="VotesFilter">
			<Dropdown
				variant="votesFilter"
				dropdownClass="shadow-votes-filter"
				position="right"
				toggleContent={
					<ControlButton isChanged={selectedOption !== "all"}>
						<div className="flex justify-center items-center w-5 h-5">
							<Icon name="SlidersVertical" size="lg" />
						</div>
					</ControlButton>
				}
			>
				<div className="flex flex-col items-start py-7 px-10 space-y-5 w-56 text-theme-secondary-700 dark:text-theme-secondary-200">
					<label
						className="flex items-center space-x-3 h-5 rounded-md cursor-pointer"
						data-testid="VotesFilter__option--all"
					>
						<Checkbox name="all" checked={selectedOption === "all"} onChange={() => onChange?.("all")} />
						<span className="text-base font-medium">{t("VOTE.FILTERS.ALL")}</span>
					</label>

					<Tooltip
						placement="bottom-start"
						content={totalCurrentVotes === 0 && "You have not yet voted for delegates"}
					>
						<label
							className={cn("h-5 flex items-center space-x-3 rounded-md", {
								"cursor-pointer": totalCurrentVotes,
								"text-theme-secondary-500 dark:text-theme-secondary-700": !totalCurrentVotes,
							})}
							data-testid="VotesFilter__option--current"
						>
							<Checkbox
								disabled={totalCurrentVotes === 0}
								name="current"
								checked={selectedOption === "current"}
								onChange={() => onChange?.("current")}
							/>
							<span className="text-base font-medium">{t("VOTE.FILTERS.CURRENT_VOTES")}</span>
						</label>
					</Tooltip>
				</div>
			</Dropdown>
		</div>
	);
};
