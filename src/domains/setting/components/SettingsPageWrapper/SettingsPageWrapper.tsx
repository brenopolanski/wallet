import { Contracts } from "@payvo/sdk-profiles";
import { Page, Section } from "app/components/Layout";
import { SideBar } from "app/components/SideBar";
import { useSettingsMenu } from "domains/setting/hooks/use-settings-menu";
import React from "react";
import { useHistory } from "react-router-dom";

type ActiveSettings = "general" | "export" | "password" | "appearance";

export const SettingsWrapper = ({
	children,
	profile,
	activeSettings,
}: {
	profile: Contracts.IProfile;
	children: React.ReactNode;
	activeSettings: ActiveSettings;
}) => {
	const { menuItems } = useSettingsMenu();
	const history = useHistory();

	return (
		<Page
			sidebar={
				<SideBar
					items={menuItems}
					activeItem={activeSettings}
					handleActiveItem={(activeSetting: string) => {
						history.push(`/profiles/${profile.id()}/settings/${activeSetting}`);
					}}
				/>
			}
		>
			<Section innerClassName="px-12">{children}</Section>
		</Page>
	);
};
