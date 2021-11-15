import { Contracts } from "@payvo/profiles";
import { translations } from "domains/transaction/i18n";
import React from "react";
import { Route } from "react-router-dom";
import { TransactionFixture } from "tests/fixtures/transactions";
import { env, getDefaultProfileId, render, screen, waitFor } from "utils/testing-library";

import { MultiSignatureRegistrationDetail } from "./MultiSignatureRegistrationDetail";

describe("MultiSignatureRegistrationDetail", () => {
	let profile: Contracts.IProfile;
	let wallet: Contracts.IReadWriteWallet;

	beforeEach(async () => {
		profile = env.profiles().findById(getDefaultProfileId());
		wallet = profile.wallets().first();

		await env.profiles().restore(profile);
		await profile.sync();
	});

	it("should render", async () => {
		const { container } = render(
			<Route path="/profiles/:profileId">
				<MultiSignatureRegistrationDetail
					transaction={{
						...TransactionFixture,
						min: () => 2,
						publicKeys: () => [wallet.publicKey()!, profile.wallets().last().publicKey()!],
						wallet: () => wallet,
					}}
					isOpen
				/>
			</Route>,
			{
				routes: [`/profiles/${profile.id()}`],
			},
		);

		await screen.findByText(translations.MODAL_MULTISIGNATURE_DETAIL.STEP_1.TITLE);

		expect(container).toMatchSnapshot();
	});

	it("should render sender's address as generated address when musig address derivation is not supported", async () => {
		jest.spyOn(wallet.network(), "allows").mockReturnValue(false);

		const { container } = render(
			<Route path="/profiles/:profileId">
				<MultiSignatureRegistrationDetail
					transaction={{
						...TransactionFixture,
						min: () => 2,
						publicKeys: () => [wallet.publicKey()!, profile.wallets().last().publicKey()!],
						wallet: () => wallet,
					}}
					isOpen
				/>
			</Route>,
			{
				routes: [`/profiles/${profile.id()}`],
			},
		);

		await screen.findByText(translations.MODAL_MULTISIGNATURE_DETAIL.STEP_1.TITLE);

		await waitFor(() => expect(screen.getAllByText(wallet.address())).toHaveLength(3));

		expect(container).toMatchSnapshot();

		jest.restoreAllMocks();
	});
});
