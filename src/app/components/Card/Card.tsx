import { Contracts } from "@payvo/sdk-profiles";
import { Dropdown, DropdownOption } from "app/components/Dropdown";
import { Icon } from "app/components/Icon";
import React from "react";

import { CardButton } from "./Card.styles";

interface CardProperties {
	as?: React.ElementType;
	children: React.ReactNode;
	addonIcons?: React.ReactNode;
	actions?: DropdownOption[];
	onClick?: (profile: Contracts.IProfile) => void;
	onSelect?: (option: DropdownOption) => void;
	isSelected?: boolean;
	className?: string;
}

export const Card = ({ children, addonIcons, actions, onClick, onSelect, isSelected, className }: CardProperties) => (
	<div className={className}>
		<CardButton
			type="button"
			isSelected={isSelected}
			onClick={onClick}
			data-testid="Card"
			tabIndex={onClick ? undefined : -1}
		>
			{children}
			<div className="flex absolute -top-1 -right-1 items-center m-4 space-x-1">
				{addonIcons}
				{actions && actions.length > 0 && (
					<Dropdown
						dropdownClass="top-0"
						options={actions}
						onSelect={onSelect}
						toggleContent={
							<div className="flex overflow-hidden justify-center w-4">
								<Icon
									name="EllipsisVertical"
									className="p-1 transition-colors duration-200 cursor-pointer text-theme-primary-300 dark:text-theme-secondary-600 hover:text-theme-danger-400"
									size="lg"
								/>
							</div>
						}
					/>
				)}
			</div>
		</CardButton>
	</div>
);
