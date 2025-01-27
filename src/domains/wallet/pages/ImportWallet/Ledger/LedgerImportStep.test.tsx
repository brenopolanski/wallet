import Transport from "@ledgerhq/hw-transport";
import { Contracts } from "@payvo/sdk-profiles";
import userEvent from "@testing-library/user-event";
import { LedgerData } from "app/contexts";
import { LedgerProvider } from "app/contexts/Ledger/Ledger";
import { getDefaultAlias } from "domains/wallet/utils/get-default-alias";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { env, getDefaultLedgerTransport, getDefaultProfileId, render, screen, waitFor } from "utils/testing-library";

import { LedgerImportStep } from "./LedgerImportStep";

describe("LedgerImportStep", () => {
	let profile: Contracts.IProfile;
	let transport: typeof Transport;

	const derivationPath = "m/44'/1'/0'/0/3";

	const ledgerWallets: LedgerData[] = [
		{ address: "DJpFwW39QnQvQRQJF2MCfAoKvsX4DJ28jq", balance: 0, path: derivationPath },
		{ address: "DRgF3PvzeGWndQjET7dZsSmnrc6uAy23ES", isNew: true, path: derivationPath },
	];

	beforeEach(async () => {
		profile = env.profiles().findById(getDefaultProfileId());

		for (const { address, path } of ledgerWallets) {
			const wallet = await profile.walletFactory().fromAddressWithDerivationPath({
				address,
				coin: "ARK",
				network: "ark.devnet",
				path,
			});

			profile.wallets().push(wallet);

			wallet.mutator().alias(
				getDefaultAlias({
					network: wallet.network(),
					profile,
				}),
			);
		}

		transport = getDefaultLedgerTransport();
		jest.spyOn(transport, "listen").mockImplementationOnce(() => ({ unsubscribe: jest.fn() }));

		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.runOnlyPendingTimers();
		jest.useRealTimers();

		for (const { address } of ledgerWallets) {
			const wallet = profile.wallets().findByAddressWithNetwork(address, "ark.devnet");

			if (wallet) {
				profile.wallets().forget(wallet.id());
			}
		}
	});

	const renderComponent = (wallets: LedgerData[] = ledgerWallets) => {
		const onClickEditWalletName = jest.fn();

		const network = profile.wallets().findByAddressWithNetwork(wallets[0].address, "ark.devnet")?.network();

		const Component = () => {
			const form = useForm<any>({
				defaultValues: { network },
			});

			return (
				<FormProvider {...form}>
					<LedgerProvider transport={transport}>
						<LedgerImportStep
							onClickEditWalletName={onClickEditWalletName}
							wallets={wallets}
							profile={profile}
						/>
					</LedgerProvider>
				</FormProvider>
			);
		};

		return {
			...render(<Component />),
			onClickEditWalletName,
		};
	};

	it("should render with single import", () => {
		const { container, onClickEditWalletName } = renderComponent(ledgerWallets.slice(1));

		userEvent.click(screen.getByTestId("LedgerImportStep__edit-alias"));

		expect(onClickEditWalletName).toHaveBeenCalledTimes(1);
		expect(container).toMatchSnapshot();
	});

	it("should render with multiple import", async () => {
		const { container, onClickEditWalletName } = renderComponent();

		await waitFor(() => expect(screen.getAllByTestId("LedgerImportStep__edit-alias")).toHaveLength(2));

		userEvent.click(screen.getAllByTestId("LedgerImportStep__edit-alias")[0]);

		expect(onClickEditWalletName).toHaveBeenCalledTimes(1);
		expect(container).toMatchSnapshot();
	});
});
