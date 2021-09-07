/* eslint-disable @typescript-eslint/await-thenable */
/* eslint-disable @typescript-eslint/require-await */
import Transport from "@ledgerhq/hw-transport";
import { createTransportReplayer, RecordStore } from "@ledgerhq/hw-transport-mocker";
import { Contracts } from "@payvo/profiles";
import { act, renderHook } from "@testing-library/react-hooks";
import userEvent from "@testing-library/user-event";
import { EnvironmentProvider, LedgerProvider } from "app/contexts";
import { translations as commonTranslations } from "app/i18n/common/i18n";
import { NetworkStep } from "domains/wallet/components/NetworkStep";
import { OptionsValue } from "domains/wallet/hooks/use-import-options";
import { translations as walletTranslations } from "domains/wallet/i18n";
import { createMemoryHistory } from "history";
import nock from "nock";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Route } from "react-router-dom";
import { assertNetwork } from "utils/assertions";
import {
	act as utilsAct,
	env,
	fireEvent,
	getDefaultProfileId,
	MNEMONICS,
	render,
	renderWithRouter,
	screen,
	waitFor,
} from "utils/testing-library";

import { ImportWallet } from "./ImportWallet";
import { SecondStep } from "./Step2";
import { ThirdStep } from "./Step3";

let profile: Contracts.IProfile;
const fixtureProfileId = getDefaultProfileId();

const identityAddress = "DC8ghUdhS8w8d11K8cFQ37YsLBFhL3Dq2P";
const mnemonic = "buddy year cost vendor honey tonight viable nut female alarm duck symptom";
const randomAddress = "D61mfSggzbvQgTUe6JhYKH2doHaqJ3Dyib";
const randomPublicKey = "034151a3ec46b5670a682b0a63394f863587d1bc97483b1b6c70eb58e7f0aed192";
const randomPublicKeyInvalid = "a34151a3ec46b5670a682b0a63394f863587d1bc97483b1b6c70eb58e7f0aed192";

const route = `/profiles/${fixtureProfileId}/wallets/import`;
const history = createMemoryHistory();

jest.setTimeout(30_000);

describe("ImportWallet", () => {
	beforeAll(() => {
		nock.disableNetConnect();

		nock("https://ark-test.payvo.com")
			.get("/api/wallets/DC8ghUdhS8w8d11K8cFQ37YsLBFhL3Dq2P")
			.reply(200, require("tests/fixtures/coins/ark/devnet/wallets/DC8ghUdhS8w8d11K8cFQ37YsLBFhL3Dq2P.json"))
			.persist();
	});

	beforeEach(async () => {
		profile = env.profiles().findById(fixtureProfileId);

		await env.profiles().restore(profile);

		const walletId = profile.wallets().findByAddress(randomAddress)?.id();

		if (walletId) {
			profile.wallets().forget(walletId);
		}
	});

	it("should render network step", async () => {
		const { result: form } = renderHook(() => useForm());
		const { getByTestId, asFragment } = render(
			<FormProvider {...form.current}>
				<NetworkStep profile={profile} title="title" subtitle="subtitle" />
			</FormProvider>,
		);

		expect(getByTestId("NetworkStep")).toBeTruthy();
		expect(asFragment()).toMatchSnapshot();

		const selectNetworkInput = getByTestId("SelectNetworkInput__input");

		expect(selectNetworkInput).toBeTruthy();

		await act(async () => {
			fireEvent.change(selectNetworkInput, { target: { value: "ARK D" } });
		});

		await act(async () => {
			fireEvent.keyDown(selectNetworkInput, { code: 13, key: "Enter" });
		});

		expect(selectNetworkInput).toHaveValue("ARK Devnet");
	});

	it("should render network step without test networks", async () => {
		profile.settings().set(Contracts.ProfileSetting.UseTestNetworks, false);

		const { result: form } = renderHook(() => useForm());
		const { getByTestId, asFragment, queryByTestId } = render(
			<FormProvider {...form.current}>
				<NetworkStep profile={profile} title="title" subtitle="subtitle" />
			</FormProvider>,
		);

		expect(getByTestId("NetworkStep")).toBeTruthy();

		const selectNetworkInput = getByTestId("SelectNetworkInput__input");

		expect(selectNetworkInput).toBeTruthy();

		act(() => {
			fireEvent.focus(selectNetworkInput);
		});

		expect(queryByTestId("NetworkIcon-ARK-ark.mainnet")).toBeInTheDocument();
		expect(queryByTestId("NetworkIcon-ARK-ark.devnet")).toBeNull();

		expect(asFragment()).toMatchSnapshot();

		profile.settings().set(Contracts.ProfileSetting.UseTestNetworks, true);
	});

	it("should render 2nd step", async () => {
		let form: ReturnType<typeof useForm>;

		const Component = () => {
			const network = env.availableNetworks().find((net) => net.coin() === "ARK" && net.id() === "ark.devnet");
			assertNetwork(network);

			network.importMethods = () => ({
				bip39: {
					default: false,
					permissions: [],
				},
			});

			form = useForm({
				defaultValues: { network },
			});

			form.register("type");
			form.register("network");

			return (
				<EnvironmentProvider env={env}>
					<FormProvider {...form}>
						<SecondStep profile={profile} />
					</FormProvider>
				</EnvironmentProvider>
			);
		};

		history.push(`/profiles/${profile.id()}`);
		const { container } = renderWithRouter(
			<Route path="/profiles/:profileId">
				<Component />
			</Route>,
			{ history, withProviders: false },
		);

		expect(screen.getByTestId("ImportWallet__second-step")).toBeTruthy();

		await waitFor(() => expect(screen.getByTestId("ImportWallet__mnemonic-input")));

		const passphraseInput = screen.getByTestId("ImportWallet__mnemonic-input");

		expect(passphraseInput).toBeTruthy();

		fireEvent.change(passphraseInput, { target: { value: mnemonic } });

		await waitFor(() => {
			expect(form.getValues()).toMatchObject({ type: OptionsValue.BIP39, value: mnemonic });
		});

		expect(container).toMatchSnapshot();
	});

	it("should render 3rd step", async () => {
		let form: ReturnType<typeof useForm>;
		const onClickEditAlias = jest.fn();
		const importedWallet = profile.wallets().first();

		const Component = () => {
			form = useForm({
				defaultValues: {
					network: importedWallet.network(),
				},
			});

			return (
				<FormProvider {...form}>
					<ThirdStep importedWallet={importedWallet} onClickEditAlias={onClickEditAlias} />
				</FormProvider>
			);
		};

		const { getByTestId, getByText, asFragment } = render(<Component />);

		expect(getByTestId("ImportWallet__third-step")).toBeTruthy();
		expect(asFragment()).toMatchSnapshot();

		expect(getByText("ARK Devnet")).toBeTruthy();
		expect(getByText(importedWallet.address())).toBeTruthy();

		await act(async () => {
			fireEvent.click(getByTestId("ImportWallet__edit-alias"));
		});

		expect(onClickEditAlias).toHaveBeenCalled();
	});

	it("should go back to portfolio", async () => {
		const history = createMemoryHistory();
		history.push(route);

		const historySpy = jest.spyOn(history, "push").mockImplementationOnce();

		const { getByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/wallets/import">
				<ImportWallet />
			</Route>,
			{
				history,
				routes: [route],
			},
		);

		await waitFor(() => expect(getByTestId("NetworkStep")).toBeTruthy());

		await waitFor(() => expect(getByTestId("ImportWallet__back-button")).not.toBeDisabled());
		fireEvent.click(getByTestId("ImportWallet__back-button"));

		expect(historySpy).toHaveBeenCalledWith(`/profiles/${fixtureProfileId}/dashboard`);

		historySpy.mockRestore();
	});

	it("should go to previous step", async () => {
		const history = createMemoryHistory();
		history.push(route);

		const { getByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/wallets/import">
				<ImportWallet />
			</Route>,
			{
				history,
				routes: [route],
			},
		);

		await waitFor(() => expect(getByTestId("NetworkStep")).toBeTruthy());

		const selectNetworkInput = getByTestId("SelectNetworkInput__input");

		fireEvent.change(selectNetworkInput, { target: { value: "ARK D" } });
		fireEvent.keyDown(selectNetworkInput, { code: 13, key: "Enter" });

		expect(selectNetworkInput).toHaveValue("ARK Devnet");

		await waitFor(() => expect(getByTestId("ImportWallet__continue-button")).not.toBeDisabled());
		fireEvent.click(getByTestId("ImportWallet__continue-button"));

		await waitFor(() => {
			expect(getByTestId("ImportWallet__second-step")).toBeTruthy();
		});

		await waitFor(() => expect(getByTestId("ImportWallet__back-button")).not.toBeDisabled());
		fireEvent.click(getByTestId("ImportWallet__back-button"));

		await waitFor(() => {
			expect(getByTestId("NetworkStep")).toBeTruthy();
		});
	});

	it("should import by mnemonic", async () => {
		const history = createMemoryHistory();
		history.push(route);

		const { getByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/wallets/import">
				<ImportWallet />
			</Route>,
			{
				history,
				routes: [route],
			},
		);

		await waitFor(() => expect(getByTestId("NetworkStep")).toBeTruthy());

		const selectNetworkInput = getByTestId("SelectNetworkInput__input");

		fireEvent.change(selectNetworkInput, { target: { value: "ARK D" } });
		fireEvent.keyDown(selectNetworkInput, { code: 13, key: "Enter" });

		expect(selectNetworkInput).toHaveValue("ARK Devnet");

		await waitFor(() => expect(getByTestId("ImportWallet__continue-button")).not.toBeDisabled());
		userEvent.keyboard("{enter}");

		const passphraseInput = getByTestId("ImportWallet__mnemonic-input");

		expect(passphraseInput).toBeTruthy();

		fireEvent.input(passphraseInput, { target: { value: mnemonic } });

		await waitFor(() => expect(getByTestId("ImportWallet__continue-button")).not.toBeDisabled());
		userEvent.keyboard("{enter}");

		await waitFor(() => {
			expect(getByTestId("EncryptPassword")).toBeTruthy();
		});

		fireEvent.click(getByTestId("ImportWallet__skip-button"));

		await waitFor(() => {
			expect(getByTestId("ImportWallet__third-step")).toBeTruthy();
		});

		act(() => {
			fireEvent.click(getByTestId("ImportWallet__edit-alias"));
		});

		await waitFor(() => expect(getByTestId("modal__inner")).toBeTruthy());

		act(() => {
			fireEvent.input(getByTestId("UpdateWalletName__input"), { target: { value: "test alias" } });
		});

		await waitFor(() => expect(getByTestId("UpdateWalletName__submit")).not.toBeDisabled());

		userEvent.keyboard("{enter}");
		userEvent.click(getByTestId("UpdateWalletName__submit"));

		await waitFor(() => expect(() => getByTestId("modal__inner")).toThrow());

		fireEvent.click(getByTestId("ImportWallet__finish-button"));

		await waitFor(() => {
			expect(profile.wallets().findByAddress(identityAddress)).toBeTruthy();
		});
	});

	it("should import by mnemonic with second signature", async () => {
		const history = createMemoryHistory();
		history.push(route);

		const { getByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/wallets/import">
				<ImportWallet />
			</Route>,
			{
				history,
				routes: [route],
			},
		);

		await waitFor(() => expect(getByTestId("NetworkStep")).toBeTruthy());

		const selectNetworkInput = getByTestId("SelectNetworkInput__input");

		fireEvent.change(selectNetworkInput, { target: { value: "ARK D" } });
		fireEvent.keyDown(selectNetworkInput, { code: 13, key: "Enter" });

		expect(selectNetworkInput).toHaveValue("ARK Devnet");

		await waitFor(() => expect(getByTestId("ImportWallet__continue-button")).not.toBeDisabled());
		fireEvent.click(getByTestId("ImportWallet__continue-button"));

		const passphraseInput = getByTestId("ImportWallet__mnemonic-input");
		const secondPassphraseInput = getByTestId("ImportWallet__secondMnemonic-input");

		expect(passphraseInput).toBeTruthy();
		expect(secondPassphraseInput).toBeDisabled();

		fireEvent.input(passphraseInput, { target: { value: MNEMONICS[1] } });

		await waitFor(() => expect(getByTestId("ImportWallet__secondMnemonic-input")).not.toBeDisabled());

		fireEvent.input(secondPassphraseInput, { target: { value: MNEMONICS[2] } });

		await waitFor(() => expect(getByTestId("ImportWallet__continue-button")).not.toBeDisabled());

		fireEvent.click(getByTestId("ImportWallet__continue-button"));

		await waitFor(() => {
			expect(getByTestId("EncryptPassword")).toBeTruthy();
		});

		fireEvent.click(getByTestId("ImportWallet__skip-button"));

		await waitFor(() => {
			expect(getByTestId("ImportWallet__third-step")).toBeTruthy();
		});

		act(() => {
			fireEvent.click(getByTestId("ImportWallet__edit-alias"));
		});

		await waitFor(() => expect(getByTestId("modal__inner")).toBeTruthy());

		act(() => {
			fireEvent.input(getByTestId("UpdateWalletName__input"), { target: { value: "Test" } });
		});

		await waitFor(() => expect(getByTestId("UpdateWalletName__submit")).toBeDisabled());

		act(() => {
			fireEvent.click(getByTestId("UpdateWalletName__cancel"));
		});

		await waitFor(() => expect(() => getByTestId("modal__inner")).toThrow());

		fireEvent.click(getByTestId("ImportWallet__finish-button"));

		await waitFor(() => {
			expect(profile.wallets().findByAddress(identityAddress)).toBeTruthy();
		});
	});

	it("should import by mnemonic and use encryption password", async () => {
		const history = createMemoryHistory();
		history.push(route);

		const { getByTestId, getAllByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/wallets/import">
				<ImportWallet />
			</Route>,
			{
				history,
				routes: [route],
			},
		);

		await waitFor(() => expect(getByTestId("NetworkStep")).toBeTruthy());

		const selectNetworkInput = getByTestId("SelectNetworkInput__input");

		fireEvent.change(selectNetworkInput, { target: { value: "ARK D" } });
		fireEvent.keyDown(selectNetworkInput, { code: 13, key: "Enter" });

		expect(selectNetworkInput).toHaveValue("ARK Devnet");

		await waitFor(() => expect(getByTestId("ImportWallet__continue-button")).not.toBeDisabled());
		fireEvent.click(getByTestId("ImportWallet__continue-button"));

		expect(getByTestId("ImportWallet__second-step")).toBeTruthy();

		const passphraseInput = getByTestId("ImportWallet__mnemonic-input");

		expect(passphraseInput).toBeTruthy();

		fireEvent.input(passphraseInput, { target: { value: MNEMONICS[3] } });

		await waitFor(() => expect(getByTestId("ImportWallet__continue-button")).not.toBeDisabled());
		fireEvent.click(getByTestId("ImportWallet__continue-button"));

		await waitFor(() => {
			expect(getByTestId("EncryptPassword")).toBeTruthy();
		});

		await utilsAct(async () => {
			fireEvent.input(getAllByTestId("InputPassword")[0], { target: { value: "S3cUrePa$sword" } });
		});

		await utilsAct(async () => {
			fireEvent.input(getAllByTestId("InputPassword")[1], { target: { value: "S3cUrePa$sword" } });
		});

		await waitFor(() => expect(getByTestId("ImportWallet__continue-button")).not.toBeDisabled());
		fireEvent.click(getByTestId("ImportWallet__continue-button"));

		await waitFor(
			() => {
				expect(getByTestId("ImportWallet__third-step")).toBeTruthy();
			},
			{ timeout: 15_000 },
		);
	});

	it("should import by mnemonic with second signature and use password to encrypt both", async () => {
		const history = createMemoryHistory();
		history.push(route);

		const { getByTestId, getAllByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/wallets/import">
				<ImportWallet />
			</Route>,
			{
				history,
				routes: [route],
			},
		);

		await waitFor(() => expect(getByTestId("NetworkStep")).toBeTruthy());

		const selectNetworkInput = getByTestId("SelectNetworkInput__input");

		fireEvent.change(selectNetworkInput, { target: { value: "ARK D" } });
		fireEvent.keyDown(selectNetworkInput, { code: 13, key: "Enter" });

		expect(selectNetworkInput).toHaveValue("ARK Devnet");

		await waitFor(() => expect(getByTestId("ImportWallet__continue-button")).not.toBeDisabled());
		fireEvent.click(getByTestId("ImportWallet__continue-button"));

		expect(getByTestId("ImportWallet__second-step")).toBeTruthy();

		const passphraseInput = getByTestId("ImportWallet__mnemonic-input");
		const secondPassphraseInput = getByTestId("ImportWallet__secondMnemonic-input");

		expect(passphraseInput).toBeTruthy();
		expect(secondPassphraseInput).toBeTruthy();

		fireEvent.input(passphraseInput, { target: { value: MNEMONICS[4] } });

		await waitFor(() => expect(getByTestId("ImportWallet__secondMnemonic-input")).not.toBeDisabled());

		fireEvent.input(secondPassphraseInput, { target: { value: MNEMONICS[5] } });

		await waitFor(() => expect(getByTestId("ImportWallet__continue-button")).not.toBeDisabled());
		fireEvent.click(getByTestId("ImportWallet__continue-button"));

		await waitFor(() => {
			expect(getByTestId("EncryptPassword")).toBeTruthy();
		});

		await utilsAct(async () => {
			fireEvent.input(getAllByTestId("InputPassword")[0], { target: { value: "S3cUrePa$sword" } });
		});

		await utilsAct(async () => {
			fireEvent.input(getAllByTestId("InputPassword")[1], { target: { value: "S3cUrePa$sword" } });
		});

		await waitFor(() => expect(getByTestId("ImportWallet__continue-button")).not.toBeDisabled());
		fireEvent.click(getByTestId("ImportWallet__continue-button"));

		await waitFor(
			() => {
				expect(getByTestId("ImportWallet__third-step")).toBeTruthy();
			},
			{ timeout: 15_000 },
		);
	});

	it("should import by address", async () => {
		const history = createMemoryHistory();
		history.push(route);

		const { getByTestId, getByText } = renderWithRouter(
			<Route path="/profiles/:profileId/wallets/import">
				<ImportWallet />
			</Route>,
			{
				history,
				routes: [route],
			},
		);

		await waitFor(() => expect(getByTestId("NetworkStep")).toBeTruthy());

		const selectNetworkInput = getByTestId("SelectNetworkInput__input");

		fireEvent.change(selectNetworkInput, { target: { value: "ARK D" } });
		fireEvent.keyDown(selectNetworkInput, { code: 13, key: "Enter" });

		expect(selectNetworkInput).toHaveValue("ARK Devnet");

		await waitFor(() => expect(getByTestId("ImportWallet__continue-button")).not.toBeDisabled());
		fireEvent.click(getByTestId("ImportWallet__continue-button"));

		expect(getByTestId("ImportWallet__second-step")).toBeTruthy();

		fireEvent.focus(getByTestId("SelectDropdown__input"));

		await waitFor(() => expect(getByText(commonTranslations.ADDRESS)).toBeInTheDocument());
		fireEvent.mouseDown(getByText(commonTranslations.ADDRESS));

		await waitFor(() => expect(getByTestId("ImportWallet__address-input")).toBeTruthy());
		fireEvent.input(getByTestId("ImportWallet__address-input"), { target: { value: randomAddress } });

		await waitFor(() => expect(getByTestId("ImportWallet__continue-button")).not.toBeDisabled());
		fireEvent.click(getByTestId("ImportWallet__continue-button"));

		await waitFor(() => {
			expect(getByTestId("ImportWallet__third-step")).toBeTruthy();
		});

		fireEvent.click(getByTestId("ImportWallet__finish-button"));

		await waitFor(() => {
			expect(profile.wallets().findByAddress(randomAddress)).toBeTruthy();
		});
	});

	it("should import by publicKey", async () => {
		const history = createMemoryHistory();
		history.push(route);

		const { getByTestId, getByText } = renderWithRouter(
			<Route path="/profiles/:profileId/wallets/import">
				<ImportWallet />
			</Route>,
			{
				history,
				routes: [route],
			},
		);

		await waitFor(() => expect(getByTestId("NetworkStep")).toBeTruthy());

		const selectNetworkInput = getByTestId("SelectNetworkInput__input");

		fireEvent.change(selectNetworkInput, { target: { value: "ARK D" } });
		fireEvent.keyDown(selectNetworkInput, { code: 13, key: "Enter" });

		expect(selectNetworkInput).toHaveValue("ARK Devnet");

		await waitFor(() => expect(getByTestId("ImportWallet__continue-button")).not.toBeDisabled());
		fireEvent.click(getByTestId("ImportWallet__continue-button"));

		expect(getByTestId("ImportWallet__second-step")).toBeTruthy();

		fireEvent.focus(getByTestId("SelectDropdown__input"));

		await waitFor(() => expect(getByText(commonTranslations.PUBLIC_KEY)).toBeInTheDocument());
		fireEvent.mouseDown(getByText(commonTranslations.PUBLIC_KEY));

		await waitFor(() => expect(getByTestId("ImportWallet__publicKey-input")).toBeTruthy());
		fireEvent.input(getByTestId("ImportWallet__publicKey-input"), { target: { value: randomPublicKey } });

		await waitFor(() => expect(getByTestId("ImportWallet__continue-button")).not.toBeDisabled());
		fireEvent.click(getByTestId("ImportWallet__continue-button"));

		await waitFor(() => {
			expect(getByTestId("ImportWallet__third-step")).toBeTruthy();
		});

		fireEvent.click(getByTestId("ImportWallet__finish-button"));

		await waitFor(() => {
			expect(profile.wallets().findByAddress(randomAddress)).toBeTruthy();
		});
	});

	it("should not allow importing from an invalid publicKey", async () => {
		const history = createMemoryHistory();
		history.push(route);

		const { getByTestId, getByText } = renderWithRouter(
			<Route path="/profiles/:profileId/wallets/import">
				<ImportWallet />
			</Route>,
			{
				history,
				routes: [route],
			},
		);

		await waitFor(() => expect(getByTestId("NetworkStep")).toBeTruthy());

		const selectNetworkInput = getByTestId("SelectNetworkInput__input");

		fireEvent.change(selectNetworkInput, { target: { value: "ARK D" } });
		fireEvent.keyDown(selectNetworkInput, { code: 13, key: "Enter" });

		expect(selectNetworkInput).toHaveValue("ARK Devnet");

		await waitFor(() => expect(getByTestId("ImportWallet__continue-button")).not.toBeDisabled());
		fireEvent.click(getByTestId("ImportWallet__continue-button"));

		expect(getByTestId("ImportWallet__second-step")).toBeTruthy();

		fireEvent.focus(getByTestId("SelectDropdown__input"));

		await waitFor(() => expect(getByText(commonTranslations.PUBLIC_KEY)).toBeInTheDocument());
		fireEvent.mouseDown(getByText(commonTranslations.PUBLIC_KEY));

		await waitFor(() => expect(getByTestId("ImportWallet__publicKey-input")).toBeTruthy());
		fireEvent.input(getByTestId("ImportWallet__publicKey-input"), { target: { value: randomPublicKeyInvalid } });

		await waitFor(() => expect(getByTestId("ImportWallet__continue-button")).toBeDisabled());
	});

	it("should import by secret", async () => {
		const history = createMemoryHistory();
		history.push(route);

		const { getByTestId, getByText } = renderWithRouter(
			<Route path="/profiles/:profileId/wallets/import">
				<ImportWallet />
			</Route>,
			{
				history,
				routes: [route],
			},
		);

		const countBefore = profile.wallets().count();

		await waitFor(() => expect(getByTestId("NetworkStep")).toBeTruthy());

		const selectNetworkInput = getByTestId("SelectNetworkInput__input");

		fireEvent.change(selectNetworkInput, { target: { value: "ARK D" } });
		fireEvent.keyDown(selectNetworkInput, { code: 13, key: "Enter" });

		expect(selectNetworkInput).toHaveValue("ARK Devnet");

		await waitFor(() => expect(getByTestId("ImportWallet__continue-button")).not.toBeDisabled());
		fireEvent.click(getByTestId("ImportWallet__continue-button"));

		expect(getByTestId("ImportWallet__second-step")).toBeTruthy();

		fireEvent.focus(getByTestId("SelectDropdown__input"));

		await waitFor(() => expect(getByText(commonTranslations.SECRET)).toBeInTheDocument());
		fireEvent.mouseDown(getByText(commonTranslations.SECRET));

		await waitFor(() => expect(getByTestId("ImportWallet__secret-input")).toBeTruthy());
		fireEvent.input(getByTestId("ImportWallet__secret-input"), { target: { value: "secret.111" } });

		await waitFor(() => expect(getByTestId("ImportWallet__continue-button")).not.toBeDisabled());
		fireEvent.click(getByTestId("ImportWallet__continue-button"));

		await waitFor(() => {
			expect(getByTestId("EncryptPassword")).toBeTruthy();
		});

		fireEvent.click(getByTestId("ImportWallet__skip-button"));

		await waitFor(() => {
			expect(getByTestId("ImportWallet__third-step")).toBeTruthy();
		});

		fireEvent.click(getByTestId("ImportWallet__finish-button"));

		await waitFor(() => expect(profile.wallets().count()).toBe(countBefore + 1));
	});

	it("should import by secret with encryption", async () => {
		const history = createMemoryHistory();
		history.push(route);

		const { getByTestId, getByText, getAllByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/wallets/import">
				<ImportWallet />
			</Route>,
			{
				history,
				routes: [route],
			},
		);

		await waitFor(() => expect(getByTestId("NetworkStep")).toBeTruthy());

		const selectNetworkInput = getByTestId("SelectNetworkInput__input");

		fireEvent.change(selectNetworkInput, { target: { value: "ARK D" } });
		fireEvent.keyDown(selectNetworkInput, { code: 13, key: "Enter" });

		expect(selectNetworkInput).toHaveValue("ARK Devnet");

		await waitFor(() => expect(getByTestId("ImportWallet__continue-button")).not.toBeDisabled());
		fireEvent.click(getByTestId("ImportWallet__continue-button"));

		expect(getByTestId("ImportWallet__second-step")).toBeTruthy();

		fireEvent.focus(getByTestId("SelectDropdown__input"));

		await waitFor(() => expect(getByText(commonTranslations.SECRET)).toBeInTheDocument());
		fireEvent.mouseDown(getByText(commonTranslations.SECRET));

		await waitFor(() => expect(getByTestId("ImportWallet__secret-input")).toBeTruthy());
		fireEvent.input(getByTestId("ImportWallet__secret-input"), { target: { value: "secret.222" } });

		await waitFor(() => expect(getByTestId("ImportWallet__continue-button")).not.toBeDisabled());
		fireEvent.click(getByTestId("ImportWallet__continue-button"));

		await waitFor(() => {
			expect(getByTestId("EncryptPassword")).toBeTruthy();
		});

		await utilsAct(async () => {
			fireEvent.input(getAllByTestId("InputPassword")[0], { target: { value: "S3cUrePa$sword" } });
		});

		await utilsAct(async () => {
			fireEvent.input(getAllByTestId("InputPassword")[1], { target: { value: "S3cUrePa$sword" } });
		});

		await waitFor(() => expect(getByTestId("ImportWallet__continue-button")).not.toBeDisabled());
		fireEvent.click(getByTestId("ImportWallet__continue-button"));

		await waitFor(
			() => {
				expect(getByTestId("ImportWallet__third-step")).toBeTruthy();
			},
			{ timeout: 15_000 },
		);
	});

	it("should get options depend on the network", async () => {
		const history = createMemoryHistory();
		history.push(route);

		const { getByTestId, getByText, queryByText, queryAllByText } = renderWithRouter(
			<Route path="/profiles/:profileId/wallets/import">
				<ImportWallet />
			</Route>,
			{
				history,
				routes: [route],
			},
		);

		await waitFor(() => expect(getByTestId("NetworkStep")).toBeTruthy());

		const selectNetworkInput = getByTestId("SelectNetworkInput__input");

		fireEvent.change(selectNetworkInput, { target: { value: "ARK D" } });
		fireEvent.keyDown(selectNetworkInput, { code: 13, key: "Enter" });

		expect(selectNetworkInput).toHaveValue("ARK Devnet");

		await waitFor(() => expect(getByTestId("ImportWallet__continue-button")).not.toBeDisabled());
		fireEvent.click(getByTestId("ImportWallet__continue-button"));

		expect(getByTestId("ImportWallet__second-step")).toBeTruthy();

		fireEvent.focus(getByTestId("SelectDropdown__input"));

		await waitFor(() => expect(queryAllByText(commonTranslations.MNEMONIC_TYPE.BIP39)).toBeTruthy());
		await waitFor(() => expect(getByText(commonTranslations.ADDRESS)).toBeTruthy());
		await waitFor(() => expect(queryByText(commonTranslations.MNEMONIC_TYPE.BIP49)).toBeFalsy());
		await waitFor(() => expect(queryByText(commonTranslations.PRIVATE_KEY)).toBeFalsy());
		await waitFor(() => expect(queryByText(commonTranslations.WIF)).toBeFalsy());
		await waitFor(() => expect(queryByText(commonTranslations.ENCRYPTED_WIF)).toBeFalsy());
	});

	it("should show an error message for duplicate address when importing by mnemonic", async () => {
		const generated = await profile.walletFactory().generate({
			coin: "ARK",
			network: "ark.devnet",
		});

		profile.wallets().push(generated.wallet);

		const history = createMemoryHistory();
		history.push(route);

		const { getByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/wallets/import">
				<ImportWallet />
			</Route>,
			{
				history,
				routes: [route],
			},
		);

		await waitFor(() => expect(getByTestId("NetworkStep")).toBeTruthy());

		const selectNetworkInput = getByTestId("SelectNetworkInput__input");

		fireEvent.change(selectNetworkInput, { target: { value: "ARK D" } });
		fireEvent.keyDown(selectNetworkInput, { code: 13, key: "Enter" });

		expect(selectNetworkInput).toHaveValue("ARK Devnet");

		await waitFor(() => expect(getByTestId("ImportWallet__continue-button")).not.toBeDisabled());
		fireEvent.click(getByTestId("ImportWallet__continue-button"));

		expect(getByTestId("ImportWallet__second-step")).toBeTruthy();

		const passphraseInput = getByTestId("ImportWallet__mnemonic-input");

		expect(passphraseInput).toBeTruthy();

		fireEvent.input(passphraseInput, { target: { value: generated.mnemonic } });

		await waitFor(() => {
			expect(getByTestId("Input__error")).toHaveAttribute(
				"data-errortext",
				commonTranslations.INPUT_ADDRESS.VALIDATION.ADDRESS_ALREADY_EXISTS.replace(
					"{{address}}",
					generated.wallet.address(),
				),
			);
		});

		expect(getByTestId("ImportWallet__continue-button")).toBeDisabled();
	});

	it("should show an error message for duplicate address when importing by address", async () => {
		const history = createMemoryHistory();
		history.push(route);

		const { getByTestId, getByText } = renderWithRouter(
			<Route path="/profiles/:profileId/wallets/import">
				<ImportWallet />
			</Route>,
			{
				history,
				routes: [route],
			},
		);

		await waitFor(() => expect(getByTestId("NetworkStep")).toBeTruthy());

		const selectNetworkInput = getByTestId("SelectNetworkInput__input");

		fireEvent.change(selectNetworkInput, { target: { value: "ARK D" } });
		fireEvent.keyDown(selectNetworkInput, { code: 13, key: "Enter" });

		expect(selectNetworkInput).toHaveValue("ARK Devnet");

		await waitFor(() => expect(getByTestId("ImportWallet__continue-button")).not.toBeDisabled());
		fireEvent.click(getByTestId("ImportWallet__continue-button"));

		expect(getByTestId("ImportWallet__second-step")).toBeTruthy();

		fireEvent.focus(getByTestId("SelectDropdown__input"));

		await waitFor(() => expect(getByText(commonTranslations.ADDRESS)).toBeTruthy());
		fireEvent.mouseDown(getByText(commonTranslations.ADDRESS));

		await waitFor(() => expect(getByTestId("ImportWallet__address-input")).toBeTruthy());
		fireEvent.input(getByTestId("ImportWallet__address-input"), {
			target: { value: profile.wallets().first().address() },
		});

		await waitFor(() => {
			expect(getByTestId("Input__error")).toHaveAttribute(
				"data-errortext",
				commonTranslations.INPUT_ADDRESS.VALIDATION.ADDRESS_ALREADY_EXISTS.replace(
					"{{address}}",
					profile.wallets().first().address(),
				),
			);
		});

		expect(getByTestId("ImportWallet__continue-button")).toBeDisabled();
	});

	it("should show an error message for invalid address", async () => {
		const history = createMemoryHistory();
		history.push(route);

		const { getByTestId, getByText } = renderWithRouter(
			<Route path="/profiles/:profileId/wallets/import">
				<ImportWallet />
			</Route>,
			{
				history,
				routes: [route],
			},
		);

		await waitFor(() => expect(getByTestId("NetworkStep")).toBeTruthy());

		const selectNetworkInput = getByTestId("SelectNetworkInput__input");

		fireEvent.change(selectNetworkInput, { target: { value: "ARK D" } });
		fireEvent.keyDown(selectNetworkInput, { code: 13, key: "Enter" });

		expect(selectNetworkInput).toHaveValue("ARK Devnet");

		await waitFor(() => expect(getByTestId("ImportWallet__continue-button")).not.toBeDisabled());
		fireEvent.click(getByTestId("ImportWallet__continue-button"));

		expect(getByTestId("ImportWallet__second-step")).toBeTruthy();

		fireEvent.focus(getByTestId("SelectDropdown__input"));

		await waitFor(() => expect(getByText(commonTranslations.ADDRESS)).toBeTruthy());
		fireEvent.mouseDown(getByText(commonTranslations.ADDRESS));

		await waitFor(() => expect(getByTestId("ImportWallet__address-input")).toBeTruthy());
		fireEvent.input(getByTestId("ImportWallet__address-input"), { target: { value: "123" } });

		await waitFor(() => {
			expect(getByTestId("Input__error")).toHaveAttribute(
				"data-errortext",
				commonTranslations.INPUT_ADDRESS.VALIDATION.NOT_VALID,
			);
		});

		expect(getByTestId("ImportWallet__continue-button")).toBeDisabled();
	});

	it("should render as ledger import", async () => {
		const transport: typeof Transport = createTransportReplayer(RecordStore.fromString(""));
		jest.spyOn(transport, "listen").mockImplementationOnce(() => ({ unsubscribe: jest.fn() }));

		const history = createMemoryHistory();

		history.push({
			pathname: route,
			search: `?ledger=true`,
		});

		const { getByTestId, container } = renderWithRouter(
			<Route path="/profiles/:profileId/wallets/import">
				<LedgerProvider transport={transport}>
					<ImportWallet />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [route],
			},
		);

		expect(container).toMatchSnapshot();

		await waitFor(() => expect(getByTestId("LedgerTabs")).toBeInTheDocument());
	});

	it("should import by address and name", async () => {
		const emptyProfile = env.profiles().create("empty profile");
		const emptyProfileRoute = `/profiles/${emptyProfile.id()}/wallets/import`;

		await env.profiles().restore(emptyProfile);
		await emptyProfile.sync();

		const history = createMemoryHistory();
		history.push(route);
		const randomNewAddress = "DHnF7Ycv16QxQQNGDUdGzWGh5n3ym424UW";

		const { getByTestId, getByText } = renderWithRouter(
			<Route path="/profiles/:profileId/wallets/import">
				<ImportWallet />
			</Route>,
			{
				history,
				routes: [emptyProfileRoute],
			},
		);

		const historySpy = jest.spyOn(history, "push").mockImplementation();

		await waitFor(() => expect(getByTestId("NetworkStep")).toBeTruthy());

		const selectNetworkInput = getByTestId("SelectNetworkInput__input");

		fireEvent.change(selectNetworkInput, { target: { value: "ARK D" } });
		fireEvent.keyDown(selectNetworkInput, { code: 13, key: "Enter" });

		expect(selectNetworkInput).toHaveValue("ARK Devnet");

		await waitFor(() => expect(getByTestId("ImportWallet__continue-button")).not.toBeDisabled());
		fireEvent.click(getByTestId("ImportWallet__continue-button"));

		expect(getByTestId("ImportWallet__second-step")).toBeTruthy();

		fireEvent.focus(getByTestId("SelectDropdown__input"));

		await waitFor(() => expect(getByText(commonTranslations.ADDRESS)).toBeTruthy());
		fireEvent.mouseDown(getByText(commonTranslations.ADDRESS));

		await waitFor(() => expect(getByTestId("ImportWallet__address-input")).toBeTruthy());
		fireEvent.input(getByTestId("ImportWallet__address-input"), { target: { value: randomNewAddress } });

		await waitFor(() => expect(getByTestId("ImportWallet__continue-button")).not.toBeDisabled(), { timeout: 4000 });
		fireEvent.click(getByTestId("ImportWallet__continue-button"));

		await waitFor(() => {
			expect(getByTestId("ImportWallet__third-step")).toBeTruthy();
		});

		fireEvent.click(getByTestId("ImportWallet__finish-button"));

		await waitFor(() => {
			expect(historySpy).toHaveBeenCalled();
		});

		historySpy.mockRestore();
	});

	it("should show an error message for duplicate name", async () => {
		const emptyProfile = env.profiles().create("duplicate wallet name profile");
		const emptyProfileRoute = `/profiles/${emptyProfile.id()}/wallets/import`;

		await env.profiles().restore(emptyProfile);
		await emptyProfile.sync();

		const history = createMemoryHistory();
		history.push(route);
		const randomNewAddress = "D6pPxYLwwCptuhVRvLQQYXEQiQMB5x6iY3";

		const wallet = await emptyProfile.walletFactory().fromMnemonicWithBIP39({
			coin: "ARK",
			mnemonic: MNEMONICS[0],
			network: "ark.devnet",
		});

		wallet.settings().set(Contracts.WalletSetting.Alias, "My wallet");

		profile.wallets().push(wallet);

		const { getByTestId, getByText } = renderWithRouter(
			<Route path="/profiles/:profileId/wallets/import">
				<ImportWallet />
			</Route>,
			{
				history,
				routes: [emptyProfileRoute],
			},
		);

		await waitFor(() => expect(getByTestId("NetworkStep")).toBeTruthy());

		const selectNetworkInput = getByTestId("SelectNetworkInput__input");

		fireEvent.change(selectNetworkInput, { target: { value: "ARK D" } });
		fireEvent.keyDown(selectNetworkInput, { code: 13, key: "Enter" });

		expect(selectNetworkInput).toHaveValue("ARK Devnet");

		await waitFor(() => expect(getByTestId("ImportWallet__continue-button")).not.toBeDisabled());
		fireEvent.click(getByTestId("ImportWallet__continue-button"));

		expect(getByTestId("ImportWallet__second-step")).toBeTruthy();

		fireEvent.focus(getByTestId("SelectDropdown__input"));

		await waitFor(() => expect(getByText(commonTranslations.ADDRESS)).toBeTruthy());
		fireEvent.mouseDown(getByText(commonTranslations.ADDRESS));

		await waitFor(() => expect(getByTestId("ImportWallet__address-input")).toBeTruthy());
		fireEvent.input(getByTestId("ImportWallet__address-input"), { target: { value: randomNewAddress } });

		await waitFor(() => expect(getByTestId("ImportWallet__continue-button")).not.toBeDisabled(), { timeout: 4000 });
		fireEvent.click(getByTestId("ImportWallet__continue-button"));

		await waitFor(() => {
			expect(getByTestId("ImportWallet__third-step")).toBeTruthy();
		});

		const alias = "My Wallet";

		fireEvent.click(getByTestId("ImportWallet__edit-alias"));

		await waitFor(() => expect(getByTestId("UpdateWalletName__input")).toBeInTheDocument());

		fireEvent.input(getByTestId("UpdateWalletName__input"), { target: { value: alias } });

		await waitFor(() => {
			expect(getByTestId("Input__error")).toHaveAttribute(
				"data-errortext",
				walletTranslations.VALIDATION.ALIAS_ASSIGNED.replace("{{alias}}", alias),
			);
		});

		expect(getByTestId("UpdateWalletName__submit")).toBeDisabled();
	});
});
