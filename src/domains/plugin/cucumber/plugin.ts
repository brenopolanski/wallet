import { Selector } from "testcafe";

import { buildTranslations } from "../../../app/i18n/helpers";
import { cucumber, getLocation, scrollToTop, visitWelcomeScreen } from "../../../utils/e2e-utils";
import { goToPlugins } from "../e2e/common";

const translations = buildTranslations();

const preSteps = {
	"Given Alice is on the plugins page": async (t: TestController) => {
		await visitWelcomeScreen(t);
		await goToPlugins(t);
	},
};
cucumber("@plugins-filterGame", {
	...preSteps,
	"When she filters plugins by game category": async (t: TestController) => {
		await t.click(Selector("button").withText(translations.PLUGINS.PAGE_PLUGIN_MANAGER.VIEW.GAMING));
	},
	"Then only game plugins are displayed": async (t: TestController) => {
		await t.expect(Selector("h2").withExactText(translations.PLUGINS.PAGE_PLUGIN_MANAGER.VIEW.GAMING).exists).ok();
	},
});
cucumber("@plugins-filterUtility", {
	...preSteps,
	"When she filters plugins by utility category": async (t: TestController) => {
		await t.click(Selector("button").withText(translations.PLUGINS.PAGE_PLUGIN_MANAGER.VIEW.UTILITY));
	},
	"Then only utility plugins are displayed": async (t: TestController) => {
		await t.expect(Selector("h2").withExactText(translations.PLUGINS.PAGE_PLUGIN_MANAGER.VIEW.UTILITY).exists).ok();
	},
});
cucumber("@plugins-filterOther", {
	...preSteps,
	"When she filters plugins by other category": async (t: TestController) => {
		await t.click(Selector("button").withText(translations.PLUGINS.PAGE_PLUGIN_MANAGER.VIEW.OTHER));
	},
	"Then only other plugins are displayed": async (t: TestController) => {
		await t.expect(Selector("h2").withExactText(translations.PLUGINS.PAGE_PLUGIN_MANAGER.VIEW.OTHER).exists).ok();
	},
});
cucumber("@plugins-filterMyPlugins", {
	...preSteps,
	"When she filters plugins by selecting my plugins": async (t: TestController) => {
		await t.click(Selector("button").withText(translations.PLUGINS.PAGE_PLUGIN_MANAGER.VIEW.MY_PLUGINS));
	},
	"Then only installed plugins are displayed": async (t: TestController) => {
		await t
			.expect(Selector("h2").withExactText(translations.PLUGINS.PAGE_PLUGIN_MANAGER.VIEW.MY_PLUGINS).exists)
			.ok();
	},
});
cucumber("@plugins-navigateToPluginDetails", {
	...preSteps,
	"When she clicks on a plugin": async (t: TestController) => {
		await t.click(Selector('[data-testid="PluginGrid"] > div > div').withText("ARK Delegate Calculator"));
	},
	"Then she is navigated to the plugin details page": async (t: TestController) => {
		await t.expect(Selector("span").withExactText("ARK Delegate Calculator").exists).ok();
		await t.expect(getLocation()).contains("/plugins/details?pluginId=@dated/delegate-calculator-wallet-plugin");
	},
	"When she selects plugins from the navbar": async (t: TestController) => {
		await scrollToTop();
		await t.click(Selector("a").withExactText(translations.COMMON.PLUGINS));
	},
	"Then she is navigated back to the plugin page": async (t: TestController) => {
		await t.expect(getLocation()).contains("/plugins");
		await t.expect(getLocation()).notContains("/plugins/details");
	},
});
