import { Selector } from "testcafe";

import { buildTranslations } from "../../../app/i18n/helpers";
import { createFixture, cucumber, getLocation, visitWelcomeScreen } from "../../../utils/e2e-utils";

const translations = buildTranslations();

createFixture("Welcome Screen routing");

const preSteps = {
	"Given Alice is on the welcome screen": async (t: TestController) => {
		await visitWelcomeScreen(t);
		await t.expect(Selector("span").withText(translations.COMMON.PAYVO_WALLET).exists).ok();
	},
	"And she clicks create": async (t: TestController) => {
		await t
			.expect(Selector('[data-testid="Card"]').withExactText(translations.PROFILE.CREATE_PROFILE).exists)
			.ok({ timeout: 60_000 });
		await t.click(Selector('[data-testid="Card"]').withExactText(translations.PROFILE.CREATE_PROFILE));
		await t.expect(getLocation()).contains("/profiles/create");
	},
};
cucumber("@createProfile-noPassword", {
	...preSteps,
	"When she fills out the form": async (t: TestController) => {
		await t.typeText(Selector("input[name=name]"), "Anne Doe");
		await t.click('[data-testid="SelectDropdown__input"]');
		await t.click('[data-testid="SelectDropdown__option--0"]');
		await t.click(Selector("input[name=isDarkMode]").parent());
	},
	"And she submits the form": async (t: TestController) => {
		await t.click(Selector("button").withExactText(translations.COMMON.CREATE));
	},
	"Then she will see the welcome screen": async (t: TestController) => {
		await t.expect(getLocation()).notContains("/profiles/create");
		await t.expect(Selector("button").withText("John Doe").exists).ok();
		await t.expect(Selector("button").withText("Anne Doe").exists).ok();
	},
});
cucumber("@createProfile-withPassword", {
	...preSteps,
	"When she fills out the form with a password": async (t: TestController) => {
		await t.typeText(Selector("input[name=name]"), "Anne Doe");
		await t.typeText(Selector("input[name=password]"), "S3cUrePa$sword");
		await t.typeText(Selector("input[name=confirmPassword]"), "S3cUrePa$sword");
		await t.click('[data-testid="SelectDropdown__input"]');
		await t.click('[data-testid="SelectDropdown__option--0"]');
		await t.click(Selector("input[name=isDarkMode]").parent());
	},
	"And she submits the form": async (t: TestController) => {
		await t.click(Selector("button").withExactText(translations.COMMON.CREATE));
	},
	"Then she will see the welcome screen": async (t: TestController) => {
		await t.expect(getLocation()).notContains("/profiles/create");
		await t.expect(Selector("button").withText("John Doe").exists).ok();
		await t.expect(Selector("button").withText("Anne Doe").exists).ok();
	},
});
cucumber("@createProfile-disabledSaveButton", {
	...preSteps,
	"Then the create button should be disabled by default": async (t: TestController) => {
		await t.expect(Selector('[data-testid="CreateProfile__submit-button"]').hasAttribute("disabled")).ok();
	},
});
cucumber("@createProfile-invalidPassword", {
	...preSteps,
	"When she fills out the form": async (t: TestController) => {
		await t.typeText(Selector("input[name=name]"), "Anne Doe");
		await t.click('[data-testid="SelectDropdown__input"]');
		await t.click('[data-testid="SelectDropdown__option--0"]');
		await t.click(Selector("input[name=isDarkMode]").parent());
	},
	"But enters an invalid password": async (t: TestController) => {
		await t.typeText(Selector("input[name=password]"), "password");
	},
	"Then an error is displayed on the password field": async (t: TestController) => {
		await t.expect(Selector('[data-testid="Input__error"]').exists).ok();
	},
	"And the create button is disabled": async (t: TestController) => {
		await t.expect(Selector('[data-testid="CreateProfile__submit-button"]').hasAttribute("disabled")).ok();
	},
});
cucumber("@createProfile-breachedPassword", {
	...preSteps,
	"When she fills out the form": async (t: TestController) => {
		await t.typeText(Selector("input[name=name]"), "Anne Doe");
		await t.click('[data-testid="SelectDropdown__input"]');
		await t.click('[data-testid="SelectDropdown__option--0"]');
		await t.click(Selector("input[name=isDarkMode]").parent());
	},
	"But enters a breached password": async (t: TestController) => {
		await t.typeText(Selector("input[name=password]"), "Password!123");
	},
	"Then an error is displayed on the password field": async (t: TestController) => {
		await t.expect(Selector('[data-testid="Input__error"]').exists).ok();
	},
	"And the create button is disabled": async (t: TestController) => {
		await t.expect(Selector('[data-testid="CreateProfile__submit-button"]').hasAttribute("disabled")).ok();
	},
});
cucumber("@createProfile-passwordConfirmFail", {
	...preSteps,
	"When she fills out the form with a valid password": async (t: TestController) => {
		await t.typeText(Selector("input[name=name]"), "Anne Doe");
		await t.click('[data-testid="SelectDropdown__input"]');
		await t.click('[data-testid="SelectDropdown__option--0"]');
		await t.typeText(Selector("input[name=password]"), "S3cUrePa$sword");
		await t.click(Selector("input[name=isDarkMode]").parent());
	},
	"But enters a different password in the confirm password field": async (t: TestController) => {
		await t.typeText(Selector("input[name=confirmPassword]"), "RubbishPassword!123");
	},
	"Then an error is displayed on the confirm password field": async (t: TestController) => {
		await t.expect(Selector('[data-testid="Input__error"]').exists).ok();
	},
	"And the create button is disabled": async (t: TestController) => {
		await t.expect(Selector('[data-testid="CreateProfile__submit-button"]').hasAttribute("disabled")).ok();
	},
});
cucumber("@createProfile-invalidNameLength", {
	...preSteps,
	"When she fills out the form excluding name": async (t: TestController) => {
		await t.click('[data-testid="SelectDropdown__input"]');
		await t.click('[data-testid="SelectDropdown__option--0"]');
		await t.click(Selector("input[name=isDarkMode]").parent());
	},
	"But enters a profile name that exceeds 42 characters": async (t: TestController) => {
		await t.typeText(Selector("input[name=name]"), "1234567890123456789012345678901234567890123");
	},
	"Then an error is displayed on the name field": async (t: TestController) => {
		await t.expect(Selector('[data-testid="Input__error"]').exists).ok();
	},
	"And the create button is disabled": async (t: TestController) => {
		await t.expect(Selector('[data-testid="CreateProfile__submit-button"]').hasAttribute("disabled")).ok();
	},
});
