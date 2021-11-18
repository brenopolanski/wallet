import { Selector } from "testcafe";

import { buildTranslations } from "../../../app/i18n/helpers";
import { cucumber, visitWelcomeScreen } from "../../../utils/e2e-utils";
import { goToContacts } from "../e2e/common";

const translations = buildTranslations();

const preSteps = {
	"Given Alice is on the contacts page": async (t: TestController) => {
		await visitWelcomeScreen(t);
		await goToContacts(t);
	},
};
cucumber("@deleteContact", {
	...preSteps,
	"When she attempts to delete a contact": async (t: TestController) => {
		await t.click(
			Selector('[data-testid="ContactList"] tbody > tr:first-child [data-testid="dropdown__toggle"]').child(0),
		);
		await t.click(
			Selector(
				'[data-testid="ContactList"] tbody > tr:first-child [data-testid="dropdown__options"] li',
			).withText(translations.COMMON.DELETE),
		);
		await t
			.expect(
				Selector('[data-testid="modal__inner"]').withText(translations.CONTACTS.MODAL_DELETE_CONTACT.TITLE)
					.exists,
			)
			.ok();
		await t.click(Selector('[data-testid="DeleteResource__submit-button"]'));
	},
	"Then the contact is removed from her contact list": async (t: TestController) => {
		await t
			.expect(
				Selector('[data-testid="modal__inner"]').withText(translations.CONTACTS.MODAL_DELETE_CONTACT.TITLE)
					.exists,
			)
			.notOk();
		await t
			.expect(
				Selector(
					'[data-testid="ContactList"] tbody > tr:first-child [data-testid="ContactListItem__name"]',
				).withText("Brian").exists,
			)
			.notOk();
	},
});
cucumber("@deleteContact-openAndCancelModal", {
	...preSteps,
	"When she opens the delete contact modal": async (t: TestController) => {
		await t.click(
			Selector('[data-testid="ContactList"] tbody > tr:first-child [data-testid="dropdown__toggle"]').child(0),
		);
		await t.click(
			Selector(
				'[data-testid="ContactList"] tbody > tr:first-child [data-testid="dropdown__options"] li',
			).withText(translations.COMMON.DELETE),
		);
		await t
			.expect(
				Selector('[data-testid="modal__inner"]').withText(translations.CONTACTS.MODAL_DELETE_CONTACT.TITLE)
					.exists,
			)
			.ok();
	},
	"But selects cancel on the delete contact modal": async (t: TestController) => {
		await t.click(Selector('[data-testid="DeleteResource__cancel-button"]'));
	},
	"Then the delete contact modal should no longer be displayed": async (t: TestController) => {
		await t
			.expect(
				Selector('[data-testid="modal__inner"]').withText(translations.CONTACTS.MODAL_DELETE_CONTACT.TITLE)
					.exists,
			)
			.notOk();
	},
	"And the contact should still exist": async (t: TestController) => {
		await t
			.expect(
				Selector(
					'[data-testid="ContactList"] tbody > tr:first-child [data-testid="ContactListItem__name"]',
				).withText("Brian").exists,
			)
			.ok();
	},
});
cucumber("@deleteContact-openAndCloseModal", {
	...preSteps,
	"When she opens the delete contact modal": async (t: TestController) => {
		await t.click(
			Selector('[data-testid="ContactList"] tbody > tr:first-child [data-testid="dropdown__toggle"]').child(0),
		);
		await t.click(
			Selector(
				'[data-testid="ContactList"] tbody > tr:first-child [data-testid="dropdown__options"] li',
			).withText(translations.COMMON.DELETE),
		);
		await t
			.expect(
				Selector('[data-testid="modal__inner"]').withText(translations.CONTACTS.MODAL_DELETE_CONTACT.TITLE)
					.exists,
			)
			.ok();
	},
	"And closes the delete contact modal": async (t: TestController) => {
		await t.click(Selector('[data-testid="modal__close-btn"]'));
	},
	"Then the delete contact modal should no longer be displayed": async (t: TestController) => {
		await t
			.expect(
				Selector('[data-testid="modal__inner"]').withText(translations.CONTACTS.MODAL_DELETE_CONTACT.TITLE)
					.exists,
			)
			.notOk();
	},
	"And the contact should still exist": async (t: TestController) => {
		await t
			.expect(
				Selector(
					'[data-testid="ContactList"] tbody > tr:first-child [data-testid="ContactListItem__name"]',
				).withText("Brian").exists,
			)
			.ok();
	},
});
