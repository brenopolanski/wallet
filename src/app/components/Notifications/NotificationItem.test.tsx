import { Contracts } from "@payvo/sdk-profiles";
import nock from "nock";
import React from "react";
import { env, fireEvent, getDefaultProfileId, render, waitFor } from "utils/testing-library";

import { NotificationItem } from "./NotificationItem";

const TransactionsFixture = require("tests/fixtures/coins/ark/devnet/transactions.json");

let profile: Contracts.IProfile;
let notification: any;

describe("Notifications", () => {
	beforeAll(() => {
		nock("https://ark-test.payvo.com").get("/api/transactions").query(true).reply(200, {
			data: TransactionsFixture.data,
			meta: TransactionsFixture.meta,
		});

		profile = env.profiles().findById(getDefaultProfileId());
		notification = profile.notifications().get("29fdd62d-1c28-4d2c-b46f-667868c5afe1");
	});

	it("should render notification item", () => {
		const { container } = render(
			<table>
				<tbody>
					<NotificationItem {...notification} />
				</tbody>
			</table>,
		);

		expect(container).toMatchSnapshot();
	});

	it("should emit onAction event", async () => {
		const onAction = jest.fn();
		const { getByTestId } = render(
			<table>
				<tbody>
					<NotificationItem {...notification} onAction={onAction} />
				</tbody>
			</table>,
		);

		fireEvent.click(getByTestId("NotificationItem__action"));

		await waitFor(() => expect(onAction).toHaveBeenCalledWith("29fdd62d-1c28-4d2c-b46f-667868c5afe1"));
	});

	it("should emit onVisibilityChange event", async () => {
		const onVisibilityChange = jest.fn();
		render(
			<table>
				<tbody>
					<NotificationItem {...notification} onVisibilityChange={onVisibilityChange} />
				</tbody>
			</table>,
		);

		await waitFor(() => expect(onVisibilityChange).toHaveBeenCalledWith(false));
	});

	it("should render with custom action name", () => {
		const onVisibilityChange = jest.fn();

		profile.notifications().releases().push({
			action: "custom action name",
			body: "test",
			icon: "ArkLogo",
			name: "Update",
		});

		const releaseNotification = profile.notifications().releases().recent()[0];

		const { container, getByTestId } = render(
			<table>
				<tbody>
					<NotificationItem {...releaseNotification} onVisibilityChange={onVisibilityChange} />
				</tbody>
			</table>,
		);

		expect(getByTestId("NotificationItem__action")).toHaveTextContent("Update");
		expect(container).toMatchSnapshot();
	});
});
