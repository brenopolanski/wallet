import { translations as pluginTranslations } from "domains/plugin/i18n";
import React from "react";
import { fireEvent, render, screen } from "utils/testing-library";

import { PluginManagerNavigationBar } from "./PluginManagerNavigationBar";

let menu: any[];

describe("PluginManagerNavigationBar", () => {
	beforeAll(() => {
		menu = ["latest", "gaming", "utility", "other"].map((name: string) => ({
			name,
			title: pluginTranslations.PAGE_PLUGIN_MANAGER.VIEW[name.toUpperCase()],
		}));
	});

	it("should render", () => {
		const { asFragment } = render(<PluginManagerNavigationBar menu={menu} />);

		expect(screen.getByTestId("PluginManagerNavigationBar")).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should update selected", () => {
		const Component = () => {
			const [currentView, setCurrentView] = React.useState("latest");

			return (
				<>
					<span data-testid="currentView">{currentView}</span>
					<PluginManagerNavigationBar menu={menu} selectedView={currentView} onChange={setCurrentView} />
				</>
			);
		};

		const { asFragment } = render(<Component />);

		const navIds = ["gaming", "utility", "other", "my-plugins", "latest"];

		for (const navId of navIds) {
			const navItem = screen.getByTestId(`tabs__tab-button-${navId}`);

			fireEvent.click(navItem);

			expect(screen.getByTestId("currentView")).toHaveTextContent(navId);
			expect(screen.getByTestId(`tabs__tab-button-${navId}`)).toHaveAttribute("aria-selected", "true");
		}

		expect(asFragment()).toMatchSnapshot();
	});

	it("should show installed plugins count", () => {
		render(<PluginManagerNavigationBar menu={menu} selectedView="" installedPluginsCount={8} />);

		expect(screen.getByTestId("tabs__tab-button-my-plugins-count")).toHaveTextContent("8");
	});
});
