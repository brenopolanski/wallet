import { Selector } from "testcafe";

import { cucumber, mockRequest, visitWelcomeScreen } from "../../../utils/e2e-utils";
import { goToProfile } from "../e2e/common";

const preSteps = {
	"Given Alice is signed into her profile": async (t: TestController) => {
		await visitWelcomeScreen(t);
		await goToProfile(t);
	},
};
cucumber(
	"@notifications-openNotifications",
	{
		...preSteps,
		"When she opens her notifications": async (t: TestController) => {
			await t.expect(Selector("[data-testid=navbar__buttons--notifications]").exists).ok();
			await t.click(Selector("[data-testid=navbar__buttons--notifications]"));
		},
		"Then the notification list is displayed": async (t: TestController) => {
			await t.expect(Selector("[data-testid=NotificationsWrapper]").exists).ok();
			await t.expect(Selector("[data-testid=NotificationItem]").count).eql(1);
			await t.expect(Selector("[data-testid=TransactionTable]").exists).ok();
			await t.hover(Selector("[data-testid=TransactionTable]"));
			await t.expect(Selector("[data-testid=NotificationsWrapper] [data-testid=TableRow]").count).gt(0);
		},
	},
	[
		mockRequest(
			"https://ark-test.payvo.com/api/transactions?page=1&limit=12&address=D8rr7B1d6TL6pf14LgMz4sKp1VBMs6YUYD",
			"coins/ark/devnet/transactions/byAddress/D8rr7B1d6TL6pf14LgMz4sKp1VBMs6YUYD-1-10",
		),
		mockRequest(
			"https://ark-test.payvo.com/api/transactions?page=1&limit=12&address=D5sRKWckH4rE1hQ9eeMeHAepgyC3cvJtwb",
			"coins/ark/devnet/transactions/byAddress/D5sRKWckH4rE1hQ9eeMeHAepgyC3cvJtwb-1-10",
		),
	],
);
cucumber(
	"@notifications-transactionDetail",
	{
		...preSteps,
		"When she opens her notifications": async (t: TestController) => {
			await t.expect(Selector("[data-testid=navbar__buttons--notifications]").exists).ok();
			await t.click(Selector("[data-testid=navbar__buttons--notifications]"));
		},
		"And selects a transaction": async (t: TestController) => {
			await t.expect(Selector("[data-testid=TransactionTable]").exists).ok();
			await t.hover(Selector("[data-testid=TransactionTable]"));
			await t.expect(Selector("[data-testid=NotificationsWrapper] [data-testid=TableRow]").count).gt(0);
			await t.click(Selector("[data-testid=NotificationsWrapper] [data-testid=TableRow]:first-child"));
		},
		"Then the transaction details modal is displayed": async (t: TestController) => {
			await t.expect(Selector("[data-testid=modal__inner]").exists).ok();
		},
		"When she selects close on the transaction details modal": async (t: TestController) => {
			await t.click(Selector("[data-testid=modal__close-btn]"));
		},
		"Then the modal is no longer displayed": async (t: TestController) => {
			await t.expect(Selector("[data-testid=modal__inner]").exists).notOk();
		},
	},
	[
		mockRequest(
			"https://ark-test.payvo.com/api/transactions?page=1&limit=12&address=D8rr7B1d6TL6pf14LgMz4sKp1VBMs6YUYD",
			"coins/ark/devnet/transactions/byAddress/D8rr7B1d6TL6pf14LgMz4sKp1VBMs6YUYD-1-10",
		),
		mockRequest(
			"https://ark-test.payvo.com/api/transactions?page=1&limit=12&address=D5sRKWckH4rE1hQ9eeMeHAepgyC3cvJtwb",
			"coins/ark/devnet/transactions/byAddress/D5sRKWckH4rE1hQ9eeMeHAepgyC3cvJtwb-1-10",
		),
	],
);
cucumber(
	"@notifications-redDotUnread",
	{
		"Given Alice signs into a profile with unread notifications": async (t: TestController) => {
			await visitWelcomeScreen(t);
			await goToProfile(t);
		},
		"Then a red dot should be present on the notifications icon": async (t: TestController) => {
			await t.expect(Selector("[data-testid=navbar__buttons--notifications] .rounded-full").exists).ok();
		},
	},
	[
		mockRequest(
			"https://ark-test.payvo.com/api/transactions?page=1&limit=12&address=D8rr7B1d6TL6pf14LgMz4sKp1VBMs6YUYD",
			"coins/ark/devnet/transactions/byAddress/D8rr7B1d6TL6pf14LgMz4sKp1VBMs6YUYD-1-10",
		),
		mockRequest(
			"https://ark-test.payvo.com/api/transactions?page=1&limit=12&address=D5sRKWckH4rE1hQ9eeMeHAepgyC3cvJtwb",
			"coins/ark/devnet/transactions/byAddress/D5sRKWckH4rE1hQ9eeMeHAepgyC3cvJtwb-1-10",
		),
	],
);

cucumber(
	"@notifications-markAsRead",
	{
		"Given Alice signs into a profile with unread notifications": async (t: TestController) => {
			await visitWelcomeScreen(t);
			await goToProfile(t);
		},
		"Then a red dot should be present on the notifications icon": async (t: TestController) => {
			await t.expect(Selector("[data-testid=navbar__buttons--notifications] .rounded-full").exists).ok();
		},
		"When she opens her notifications": async (t: TestController) => {
			await t.expect(Selector("[data-testid=navbar__buttons--notifications]").exists).ok();
			await t.click(Selector("[data-testid=navbar__buttons--notifications]"));
		},
		"Then the notifications are marked as read": async (t: TestController) => {
			await t.expect(Selector("[data-testid=NotificationsWrapper] [data-testid=TableRow]").count).eql(3);
		},
		"And the red dot is hidden": async (t: TestController) => {
			await t.hover(Selector("[data-testid=NotificationItem]"));
			await t.expect(Selector("[data-testid=navbar__buttons--notifications] .rounded-full").exists).notOk();
		},
	},
	[
		mockRequest(
			"https://ark-test.payvo.com/api/transactions?page=1&limit=12&address=D8rr7B1d6TL6pf14LgMz4sKp1VBMs6YUYD",
			"coins/ark/devnet/transactions/byAddress/D8rr7B1d6TL6pf14LgMz4sKp1VBMs6YUYD-1-10",
		),
		mockRequest(
			"https://ark-test.payvo.com/api/transactions?page=1&limit=12&address=D5sRKWckH4rE1hQ9eeMeHAepgyC3cvJtwb",
			"coins/ark/devnet/transactions/byAddress/D5sRKWckH4rE1hQ9eeMeHAepgyC3cvJtwb-1-10",
		),
	],
);
