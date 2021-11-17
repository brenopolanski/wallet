/* eslint-disable @typescript-eslint/require-await */
import { Contracts } from "@payvo/profiles";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { translations as commonTranslations } from "app/i18n/common/i18n";
import { translations } from "domains/wallet/i18n";
import React from "react";
import { env, getDefaultProfileId, render } from "utils/testing-library";

import { UpdateWalletName } from "./UpdateWalletName";

describe("UpdateWalletName", () => {
	let profile: Contracts.IProfile;
	let wallet: Contracts.IReadWriteWallet;

	beforeAll(() => {
		profile = env.profiles().findById(getDefaultProfileId());
		wallet = profile.wallets().findById("ac38fe6d-4b67-4ef1-85be-17c5f6841129");
	});

	it("should render", () => {
		const { asFragment } = render(
			<UpdateWalletName profile={profile} wallet={wallet} onAfterSave={jest.fn()} onCancel={jest.fn()} />,
		);

		expect(screen.getByTestId("modal__inner")).toBeInTheDocument();
		expect(screen.getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_NAME_WALLET.TITLE);
		expect(screen.getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_NAME_WALLET.DESCRIPTION);
		expect(screen.getByTestId("modal__inner")).toHaveTextContent(commonTranslations.NAME);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should rename wallet", async () => {
		const aliasSpy = jest.spyOn(wallet.mutator(), "alias");
		const onAfterSave = jest.fn();

		render(<UpdateWalletName profile={profile} wallet={wallet} onAfterSave={onAfterSave} onCancel={jest.fn()} />);

		expect(screen.getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_NAME_WALLET.TITLE);
		expect(screen.getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_NAME_WALLET.DESCRIPTION);
		expect(screen.getByTestId("modal__inner")).toHaveTextContent(commonTranslations.NAME);

		const name = "Sample label";

		fireEvent.input(screen.getByTestId("UpdateWalletName__input"), { target: { value: name } });

		await waitFor(() => {
			expect(screen.getByTestId("UpdateWalletName__input")).toHaveValue(name);
		});

		expect(screen.getByTestId("UpdateWalletName__submit")).not.toBeDisabled();

		userEvent.click(screen.getByTestId("UpdateWalletName__submit"));

		await waitFor(() => expect(onAfterSave).toHaveBeenCalledWith());

		expect(aliasSpy).toHaveBeenCalledWith(name);
		expect(wallet.settings().get(Contracts.WalletSetting.Alias)).toStrictEqual(name);
	});

	it("should show an error message for duplicate name", async () => {
		const { asFragment } = render(
			<UpdateWalletName profile={profile} wallet={wallet} onAfterSave={jest.fn()} onCancel={jest.fn()} />,
		);

		const nameVariations = ["ARK Wallet 2", "ark wallet 2", " ARK Wallet 2", "ARK Wallet 2 "];

		for (const name of nameVariations) {
			fireEvent.input(screen.getByTestId("UpdateWalletName__input"), { target: { value: name } });

			await waitFor(() => {
				expect(screen.getByTestId("Input__error")).toBeVisible();
			});

			expect(screen.getByTestId("UpdateWalletName__submit")).toBeDisabled();
			expect(asFragment()).toMatchSnapshot();
		}
	});

	it("should show error message when name consists only of whitespace", async () => {
		const { asFragment } = render(
			<UpdateWalletName profile={profile} wallet={wallet} onAfterSave={jest.fn()} onCancel={jest.fn()} />,
		);

		fireEvent.input(screen.getByTestId("UpdateWalletName__input"), { target: { value: "      " } });

		// wait for formState.isValid to be updated
		await screen.findByTestId("UpdateWalletName__submit");

		expect(screen.getByTestId("UpdateWalletName__submit")).toBeDisabled();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should show error message when name exceeds 42 characters", async () => {
		const { asFragment } = render(
			<UpdateWalletName profile={profile} wallet={wallet} onAfterSave={jest.fn()} onCancel={jest.fn()} />,
		);

		fireEvent.input(screen.getByTestId("UpdateWalletName__input"), {
			target: { value: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Eveniet fugit distinctio" },
		});

		// wait for formState.isValid to be updated
		await screen.findByTestId("UpdateWalletName__submit");

		expect(screen.getByTestId("UpdateWalletName__submit")).toBeDisabled();
		expect(asFragment()).toMatchSnapshot();
	});
});
