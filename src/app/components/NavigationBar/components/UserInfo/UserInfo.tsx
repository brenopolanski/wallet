import { Avatar } from "app/components/Avatar";
import { Dropdown, DropdownOption } from "app/components/Dropdown";
import { NavigationBarMenuItem, UserInfoProperties } from "app/components/NavigationBar";
import { getUserInfoActions } from "app/constants/navigation";
import React, { FC, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

export const UserInfo: FC<UserInfoProperties> = ({ onUserAction, avatarImage, userInitials }) => {
	const { t } = useTranslation();

	const userInfoActions = useMemo<(DropdownOption & NavigationBarMenuItem)[]>(() => getUserInfoActions(t), [t]);

	const renderAvatar = useCallback(
		(isOpen: boolean) => (
			<div
				className="relative justify-center items-center align-middle rounded-full cursor-pointer"
				data-testid="navbar__useractions"
			>
				<Avatar size="lg" highlight={isOpen}>
					{avatarImage.endsWith("</svg>") ? (
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
		),
		[avatarImage, userInitials],
	);

	return (
		<Dropdown onSelect={onUserAction} options={userInfoActions} dropdownClass="mt-8" toggleContent={renderAvatar} />
	);
};
