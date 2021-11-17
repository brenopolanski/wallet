import { Contracts } from "@payvo/profiles";
import { Badge } from "app/components/Badge";
import { Card } from "app/components/Card";
import { DropdownOption } from "app/components/Dropdown";
import cn from "classnames";
import { ProfileAvatar } from "domains/profile/components/ProfileAvatar";
import React from "react";

interface ProfileCardProperties {
	actions?: DropdownOption[];
	className?: string;
	profile: Contracts.IProfile;
	showSettings?: boolean;
	onClick?: (profile: Contracts.IProfile) => void;
	onSelect?: (option: DropdownOption) => void;
}

export const ProfileCard = ({
	actions,
	className,
	profile,
	showSettings = true,
	onClick,
	onSelect,
}: ProfileCardProperties) => (
	<Card
		className={cn("w-40 h-40 leading-tight", className)}
		onClick={onClick}
		actions={showSettings ? actions : undefined}
		onSelect={onSelect}
	>
		<div className="flex flex-col justify-center items-center mx-auto h-full">
			<div className="relative">
				<ProfileAvatar profile={profile} size="xl" />
				{profile.usesPassword() && (
					<Badge
						className="mr-2 mb-2 bg-theme-background border-theme-background text-theme-secondary-900 dark:text-theme-secondary-600"
						icon="Lock"
						iconSize="lg"
						size="lg"
						position="bottom-right"
					/>
				)}
			</div>

			<span className="mt-3 font-semibold text-theme-primary-text max-w-32 truncate">{profile.name()}</span>
		</div>
	</Card>
);
