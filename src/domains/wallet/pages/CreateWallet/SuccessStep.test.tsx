/* eslint-disable @typescript-eslint/require-await */
import { Contracts } from "@payvo/sdk-profiles";
import { renderHook } from "@testing-library/react-hooks";
import userEvent from "@testing-library/user-event";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { env, getDefaultProfileId, render } from "utils/testing-library";

import { SuccessStep } from "./SuccessStep";

describe("SuccessStep", () => {
	let profile: Contracts.IProfile;
	let wallet: Contracts.IReadWriteWallet;

	beforeEach(() => {
		profile = env.profiles().findById(getDefaultProfileId());

		wallet = profile.wallets().first();
	});

	it("should render 4th step", async () => {
		const { result: form } = renderHook(() =>
			useForm({
				defaultValues: {
					network: wallet.network(),
					wallet,
				},
			}),
		);

		const onClickEditAlias = jest.fn();

		const { asFragment, getByTestId, getByText } = render(
			<FormProvider {...form.current}>
				<SuccessStep onClickEditAlias={onClickEditAlias} />
			</FormProvider>,
		);

		expect(getByTestId("CreateWallet__SuccessStep")).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();

		expect(getByText("ARK Devnet")).toBeInTheDocument();
		expect(getByText(wallet.address())).toBeInTheDocument();

		userEvent.click(getByTestId("CreateWallet__edit-alias"));

		expect(onClickEditAlias).toHaveBeenCalledTimes(1);
	});
});
