import { Contracts } from "@payvo/profiles";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { buildTranslations } from "app/i18n/helpers";
import React from "react";
import { env, getDefaultProfileId, renderWithForm } from "utils/testing-library";

import { UnlockTokensAuthentication } from "./UnlockTokensAuthentication";

const translations = buildTranslations();

describe("UnlockTokensAuthentication", () => {
	let wallet: Contracts.IReadWriteWallet;

	beforeAll(() => {
		const profile = env.profiles().findById(getDefaultProfileId());

		wallet = profile.wallets().first();
	});

	it("should render", async () => {
		const onBack = jest.fn();

		const { asFragment } = renderWithForm(<UnlockTokensAuthentication wallet={wallet} onBack={onBack} />, {
			withProviders: true,
		});

		await screen.findByTestId("AuthenticationStep");

		userEvent.click(screen.getByText(translations.COMMON.BACK));

		expect(onBack).toHaveBeenCalledWith(expect.objectContaining({ nativeEvent: expect.any(MouseEvent) }));
		expect(asFragment()).toMatchSnapshot();
	});
});
