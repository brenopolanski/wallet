/* eslint-disable @typescript-eslint/require-await */
import { Contracts } from "@payvo/sdk-profiles";
import { renderHook } from "@testing-library/react-hooks";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { env, getDefaultProfileId, MNEMONICS, render } from "utils/testing-library";

import { ConfirmPassphraseStep } from "./ConfirmPassphraseStep";

let profile: Contracts.IProfile;

describe("ConfirmPassphraseStep", () => {
	beforeEach(() => {
		profile = env.profiles().findById(getDefaultProfileId());

		for (const wallet of profile.wallets().values()) {
			profile.wallets().forget(wallet.id());
		}
	});

	it("should render 3rd step", () => {
		const { result: form } = renderHook(() =>
			useForm({
				defaultValues: {
					mnemonic: MNEMONICS[0],
				},
			}),
		);
		const { getByTestId, getAllByTestId } = render(
			<FormProvider {...form.current}>
				<ConfirmPassphraseStep />
			</FormProvider>,
		);

		expect(getByTestId("CreateWallet__ConfirmPassphraseStep")).toBeInTheDocument();
		expect(getAllByTestId("MnemonicVerificationOptions__button")).toHaveLength(6);

		expect(form.current.getValues()).toStrictEqual({ verification: undefined });
	});
});
