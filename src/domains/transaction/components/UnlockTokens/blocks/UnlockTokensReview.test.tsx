import { Contracts } from "@payvo/profiles";
import { screen } from "@testing-library/react";
import { renderHook } from "@testing-library/react-hooks";
import userEvent from "@testing-library/user-event";
import { buildTranslations } from "app/i18n/helpers";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Route } from "react-router-dom";
import { env, getDefaultProfileId, render } from "utils/testing-library";

import { UnlockTokensFormState } from "../UnlockTokens.contracts";
import { UnlockTokensReview } from "./UnlockTokensReview";

const translations = buildTranslations();

describe("UnlockTokensReview", () => {
	let profile: Contracts.IProfile;
	let wallet: Contracts.IReadWriteWallet;

	beforeAll(() => {
		profile = env.profiles().findById(getDefaultProfileId());
		wallet = profile.wallets().first();

		jest.spyOn(wallet, "currency").mockReturnValue("LSK");
		jest.spyOn(wallet, "alias").mockReturnValue("LSK Wallet 1");
	});

	it("should render", () => {
		const onBack = jest.fn();
		const onConfirm = jest.fn();

		const { result } = renderHook(() =>
			useForm<UnlockTokensFormState>({
				defaultValues: {
					amount: 10,
					fee: 5,
					selectedObjects: [],
				},
				mode: "onChange",
			}),
		);

		result.current.register("amount");
		result.current.register("fee");

		const { asFragment } = render(
			<Route path="/profiles/:profileId">
				<FormProvider {...result.current}>
					<UnlockTokensReview onBack={onBack} onConfirm={onConfirm} wallet={wallet} />
				</FormProvider>
			</Route>,
			{
				routes: [`/profiles/${profile.id()}`],
			},
		);

		expect(screen.getByText(translations.TRANSACTION.UNLOCK_TOKENS.REVIEW.TITLE)).toBeInTheDocument();

		expect(screen.getAllByTestId("Amount")[0]).toHaveTextContent("+ 10 LSK");
		expect(screen.getAllByTestId("Amount")[1]).toHaveTextContent("5 LSK");

		userEvent.click(screen.getByText(translations.COMMON.BACK));

		expect(onBack).toHaveBeenCalledWith(expect.objectContaining({ nativeEvent: expect.any(MouseEvent) }));

		userEvent.click(screen.getByText(translations.COMMON.CONFIRM));

		expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ nativeEvent: expect.any(MouseEvent) }));

		expect(asFragment()).toMatchSnapshot();
	});
});
