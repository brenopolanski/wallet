/* eslint-disable @typescript-eslint/await-thenable */
/* eslint-disable @typescript-eslint/require-await */
import { Contracts, Wallet } from "@payvo/sdk-profiles";
import userEvent from "@testing-library/user-event";
import { EnvironmentProvider, LedgerProvider } from "app/contexts";
import { translations as commonTranslations } from "app/i18n/common/i18n";
import { toasts } from "app/services";
import { NetworkStep } from "domains/wallet/components/NetworkStep";
import { OptionsValue } from "domains/wallet/hooks/use-import-options";
import { translations as walletTranslations } from "domains/wallet/i18n";
import { createMemoryHistory } from "history";
import nock from "nock";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { assertNetwork } from "utils/assertions";
import {
	env,
	fireEvent,
	getDefaultLedgerTransport,
	getDefaultProfileId,
	MNEMONICS,
	render,
	renderWithForm,
	screen,
	waitFor,
} from "utils/testing-library";

import { ImportWallet } from "./ImportWallet";
import { MethodStep } from "./MethodStep";
import { SuccessStep } from "./SuccessStep";

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

		const walletId = profile.wallets().findByAddressWithNetwork(randomAddress, "ark.devnet")?.id();

		if (walletId) {
			profile.wallets().forget(walletId);
		}
	});

	it("should render network step", async () => {
		const { asFragment } = renderWithForm(<NetworkStep profile={profile} title="title" subtitle="subtitle" />);

		expect(screen.getByTestId("NetworkStep")).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();

		const selectNetworkInput = screen.getByTestId("SelectNetworkInput__input");

		expect(selectNetworkInput).toBeInTheDocument();

		fireEvent.change(selectNetworkInput, { target: { value: "ARK D" } });

		fireEvent.keyDown(selectNetworkInput, { code: 13, key: "Enter" });

		expect(selectNetworkInput).toHaveValue("ARK Devnet");
	});

	it("should render network step without test networks", async () => {
		profile.settings().set(Contracts.ProfileSetting.UseTestNetworks, false);

		const { asFragment } = renderWithForm(<NetworkStep profile={profile} title="title" subtitle="subtitle" />);

		expect(screen.getByTestId("NetworkStep")).toBeInTheDocument();

		const selectNetworkInput = screen.getByTestId("SelectNetworkInput__input");

		expect(selectNetworkInput).toBeInTheDocument();

		fireEvent.focus(selectNetworkInput);

		expect(screen.queryByTestId("NetworkIcon-ARK-ark.mainnet")).toBeInTheDocument();
		expect(screen.queryByTestId("NetworkIcon-ARK-ark.devnet")).toBeNull();

		expect(asFragment()).toMatchSnapshot();

		profile.settings().set(Contracts.ProfileSetting.UseTestNetworks, true);
	});

	it("should render method step", async () => {
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

			form.register("importOption");
			form.register("network");

			return (
				<EnvironmentProvider env={env}>
					<FormProvider {...form}>
						<MethodStep profile={profile} />
					</FormProvider>
				</EnvironmentProvider>
			);
		};

		history.push(`/profiles/${profile.id()}`);
		const { container } = render(
			<Route path="/profiles/:profileId">
				<Component />
			</Route>,
			{ history, withProviders: false },
		);

		expect(screen.getByTestId("ImportWallet__method-step")).toBeInTheDocument();

		await waitFor(() => expect(screen.getByTestId("ImportWallet__mnemonic-input")));

		const passphraseInput = screen.getByTestId("ImportWallet__mnemonic-input");

		expect(passphraseInput).toBeInTheDocument();

		fireEvent.change(passphraseInput, { target: { value: mnemonic } });

		await waitFor(() => {
			expect(form.getValues()).toMatchObject({
				importOption: {
					canBeEncrypted: false,
					label: "Mnemonic",
					value: OptionsValue.BIP39,
				},
				value: mnemonic,
			});
		});

		expect(container).toMatchSnapshot();
	});

	it("should be possible to change import type in method step", async () => {
		let form: ReturnType<typeof useForm>;

		const Component = () => {
			const network = env.availableNetworks().find((net) => net.coin() === "ARK" && net.id() === "ark.devnet");
			assertNetwork(network);

			network.importMethods = () => ({
				address: {
					default: false,
					permissions: [],
				},
				bip39: {
					default: true,
					permissions: [],
				},
			});

			form = useForm({
				defaultValues: { network },
			});

			form.register("importOption");
			form.register("network");

			return (
				<EnvironmentProvider env={env}>
					<FormProvider {...form}>
						<MethodStep profile={profile} />
					</FormProvider>
				</EnvironmentProvider>
			);
		};

		history.push(`/profiles/${profile.id()}`);
		render(
			<Route path="/profiles/:profileId">
				<Component />
			</Route>,
			{ history, withProviders: false },
		);

		expect(screen.getByTestId("ImportWallet__method-step")).toBeInTheDocument();

		await screen.findByTestId("ImportWallet__mnemonic-input");

		const selectDropdown = screen.getByTestId("SelectDropdown__input");

		fireEvent.change(selectDropdown, { target: { value: "test" } });

		await waitFor(() => expect(screen.queryByTestId("SelectDropdown__option--0")).not.toBeInTheDocument());

		fireEvent.change(selectDropdown, { target: { value: "addr" } });

		await screen.findByTestId("SelectDropdown__option--0");

		fireEvent.mouseDown(screen.getByTestId("SelectDropdown__option--0"));

		expect(screen.getByTestId("select-list__input")).toHaveValue("address");

		await screen.findByTestId("ImportWallet__address-input");
	});

	it("should render success step", async () => {
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
					<SuccessStep importedWallet={importedWallet} onClickEditAlias={onClickEditAlias} />
				</FormProvider>
			);
		};

		const { asFragment } = render(<Component />);

		expect(screen.getByTestId("ImportWallet__success-step")).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();

		expect(screen.getByText("ARK Devnet")).toBeInTheDocument();
		expect(screen.getByText(importedWallet.address())).toBeInTheDocument();

		fireEvent.click(screen.getByTestId("ImportWallet__edit-alias"));

		expect(onClickEditAlias).toHaveBeenCalledWith(expect.objectContaining({ nativeEvent: expect.any(MouseEvent) }));
	});

	it("should go back to portfolio", async () => {
		const history = createMemoryHistory();
		history.push(route);

		const historySpy = jest.spyOn(history, "push").mockImplementation();

		render(
			<Route path="/profiles/:profileId/wallets/import">
				<ImportWallet />
			</Route>,
			{
				history,
				routes: [route],
			},
		);

		await screen.findByTestId("NetworkStep");

		await waitFor(() => expect(screen.getByTestId("ImportWallet__back-button")).toBeEnabled());
		fireEvent.click(screen.getByTestId("ImportWallet__back-button"));

		expect(historySpy).toHaveBeenCalledWith(`/profiles/${fixtureProfileId}/dashboard`);

		historySpy.mockRestore();
	});

	it("should go to previous step", async () => {
		const history = createMemoryHistory();
		history.push(route);

		render(
			<Route path="/profiles/:profileId/wallets/import">
				<ImportWallet />
			</Route>,
			{
				history,
				routes: [route],
			},
		);

		await screen.findByTestId("NetworkStep");

		const selectNetworkInput = screen.getByTestId("SelectNetworkInput__input");

		fireEvent.change(selectNetworkInput, { target: { value: "ARK D" } });
		fireEvent.keyDown(selectNetworkInput, { code: 13, key: "Enter" });

		expect(selectNetworkInput).toHaveValue("ARK Devnet");

		await waitFor(() => expect(screen.getByTestId("ImportWallet__continue-button")).toBeEnabled());
		fireEvent.click(screen.getByTestId("ImportWallet__continue-button"));

		await waitFor(() => {
			expect(screen.getByTestId("ImportWallet__method-step")).toBeInTheDocument();
		});

		await waitFor(() => expect(screen.getByTestId("ImportWallet__back-button")).toBeEnabled());
		fireEvent.click(screen.getByTestId("ImportWallet__back-button"));

		await waitFor(() => {
			expect(screen.getByTestId("NetworkStep")).toBeInTheDocument();
		});
	});

	it("should import by mnemonic", async () => {
		const history = createMemoryHistory();
		history.push(route);

		render(
			<Route path="/profiles/:profileId/wallets/import">
				<ImportWallet />
			</Route>,
			{
				history,
				routes: [route],
			},
		);

		await screen.findByTestId("NetworkStep");

		const selectNetworkInput = screen.getByTestId("SelectNetworkInput__input");

		fireEvent.change(selectNetworkInput, { target: { value: "ARK D" } });
		fireEvent.keyDown(selectNetworkInput, { code: 13, key: "Enter" });

		expect(selectNetworkInput).toHaveValue("ARK Devnet");

		await waitFor(() => expect(screen.getByTestId("ImportWallet__continue-button")).toBeEnabled());
		userEvent.keyboard("{enter}");

		await waitFor(() => expect(() => screen.getByTestId("ImportWallet__mnemonic-input")).not.toThrow());
		const passphraseInput = screen.getByTestId("ImportWallet__mnemonic-input");

		expect(passphraseInput).toBeInTheDocument();

		fireEvent.input(passphraseInput, { target: { value: mnemonic } });

		await waitFor(() => expect(screen.getByTestId("ImportWallet__continue-button")).toBeEnabled());
		userEvent.keyboard("{enter}");

		await waitFor(() => {
			expect(screen.getByTestId("ImportWallet__success-step")).toBeInTheDocument();
		});

		fireEvent.click(screen.getByTestId("ImportWallet__edit-alias"));

		await screen.findByTestId("modal__inner");

		fireEvent.input(screen.getByTestId("UpdateWalletName__input"), { target: { value: "test alias" } });

		await waitFor(() => expect(screen.getByTestId("UpdateWalletName__submit")).toBeEnabled());

		userEvent.keyboard("{enter}");
		userEvent.click(screen.getByTestId("UpdateWalletName__submit"));

		await waitFor(() => expect(() => screen.getByTestId("modal__inner")).toThrow(/Unable to find an element by/));

		fireEvent.click(screen.getByTestId("ImportWallet__finish-button"));

		await waitFor(() => {
			expect(profile.wallets().findByAddressWithNetwork(identityAddress, "ark.devnet")).toBeInstanceOf(Wallet);
		});
	});

	it("should import by mnemonic and use encryption password", async () => {
		const history = createMemoryHistory();
		history.push(route);

		render(
			<Route path="/profiles/:profileId/wallets/import">
				<ImportWallet />
			</Route>,
			{
				history,
				routes: [route],
			},
		);

		await screen.findByTestId("NetworkStep");

		const selectNetworkInput = screen.getByTestId("SelectNetworkInput__input");

		fireEvent.change(selectNetworkInput, { target: { value: "ARK D" } });
		fireEvent.keyDown(selectNetworkInput, { code: 13, key: "Enter" });

		expect(selectNetworkInput).toHaveValue("ARK Devnet");

		await waitFor(() => expect(screen.getByTestId("ImportWallet__continue-button")).toBeEnabled());
		fireEvent.click(screen.getByTestId("ImportWallet__continue-button"));

		await waitFor(() => expect(() => screen.getByTestId("ImportWallet__method-step")).not.toThrow());

		expect(screen.getByTestId("ImportWallet__method-step")).toBeInTheDocument();

		const passphraseInput = screen.getByTestId("ImportWallet__mnemonic-input");

		expect(passphraseInput).toBeInTheDocument();

		fireEvent.input(passphraseInput, { target: { value: MNEMONICS[3] } });

		await waitFor(() => expect(screen.getByTestId("ImportWallet__continue-button")).toBeEnabled());

		fireEvent.click(screen.getByTestId("ImportWallet__encryption-toggle"));

		fireEvent.click(screen.getByTestId("ImportWallet__continue-button"));

		await waitFor(() => {
			expect(screen.getByTestId("EncryptPassword")).toBeInTheDocument();
		});

		fireEvent.input(screen.getAllByTestId("InputPassword")[0], { target: { value: "S3cUrePa$sword" } });

		fireEvent.input(screen.getAllByTestId("InputPassword")[1], { target: { value: "S3cUrePa$sword" } });

		await waitFor(() => expect(screen.getByTestId("ImportWallet__continue-button")).toBeEnabled());
		fireEvent.click(screen.getByTestId("ImportWallet__continue-button"));

		await waitFor(
			() => {
				expect(screen.getByTestId("ImportWallet__success-step")).toBeInTheDocument();
			},
			{ timeout: 15_000 },
		);
	});

	it("should import by mnemonic with second signature and use password to encrypt both", async () => {
		const history = createMemoryHistory();
		history.push(route);

		render(
			<Route path="/profiles/:profileId/wallets/import">
				<ImportWallet />
			</Route>,
			{
				history,
				routes: [route],
			},
		);

		await screen.findByTestId("NetworkStep");

		const selectNetworkInput = screen.getByTestId("SelectNetworkInput__input");

		fireEvent.change(selectNetworkInput, { target: { value: "ARK D" } });
		fireEvent.keyDown(selectNetworkInput, { code: 13, key: "Enter" });

		expect(selectNetworkInput).toHaveValue("ARK Devnet");

		await waitFor(() => expect(screen.getByTestId("ImportWallet__continue-button")).toBeEnabled());
		fireEvent.click(screen.getByTestId("ImportWallet__continue-button"));

		await waitFor(() => expect(() => screen.getByTestId("ImportWallet__method-step")).not.toThrow());

		expect(screen.getByTestId("ImportWallet__method-step")).toBeInTheDocument();

		const passphraseInput = screen.getByTestId("ImportWallet__mnemonic-input");

		expect(passphraseInput).toBeInTheDocument();

		fireEvent.input(passphraseInput, { target: { value: MNEMONICS[0] } });

		await waitFor(() => expect(screen.getByTestId("ImportWallet__continue-button")).toBeEnabled());

		fireEvent.click(screen.getByTestId("ImportWallet__encryption-toggle"));

		fireEvent.click(screen.getByTestId("ImportWallet__continue-button"));

		await waitFor(() => {
			expect(screen.getByTestId("EncryptPassword")).toBeInTheDocument();
		});

		fireEvent.input(screen.getByTestId("EncryptPassword__second-mnemonic"), { target: { value: MNEMONICS[5] } });

		fireEvent.input(screen.getAllByTestId("InputPassword")[0], { target: { value: "S3cUrePa$sword" } });

		fireEvent.input(screen.getAllByTestId("InputPassword")[1], { target: { value: "S3cUrePa$sword" } });

		await waitFor(() => expect(screen.getByTestId("ImportWallet__continue-button")).toBeEnabled());
		fireEvent.click(screen.getByTestId("ImportWallet__continue-button"));

		await waitFor(
			() => {
				expect(screen.getByTestId("ImportWallet__success-step")).toBeInTheDocument();
			},
			{ timeout: 15_000 },
		);
	});

	it("should import by address", async () => {
		const history = createMemoryHistory();
		history.push(route);

		render(
			<Route path="/profiles/:profileId/wallets/import">
				<ImportWallet />
			</Route>,
			{
				history,
				routes: [route],
			},
		);

		await screen.findByTestId("NetworkStep");

		const selectNetworkInput = screen.getByTestId("SelectNetworkInput__input");

		fireEvent.change(selectNetworkInput, { target: { value: "ARK D" } });
		fireEvent.keyDown(selectNetworkInput, { code: 13, key: "Enter" });

		expect(selectNetworkInput).toHaveValue("ARK Devnet");

		await waitFor(() => expect(screen.getByTestId("ImportWallet__continue-button")).toBeEnabled());
		fireEvent.click(screen.getByTestId("ImportWallet__continue-button"));

		await waitFor(() => expect(() => screen.getByTestId("ImportWallet__method-step")).not.toThrow());

		expect(screen.getByTestId("ImportWallet__method-step")).toBeInTheDocument();

		fireEvent.focus(screen.getByTestId("SelectDropdown__input"));

		await screen.findByText(commonTranslations.ADDRESS);
		fireEvent.mouseDown(screen.getByText(commonTranslations.ADDRESS));

		await screen.findByTestId("ImportWallet__address-input");
		fireEvent.input(screen.getByTestId("ImportWallet__address-input"), { target: { value: randomAddress } });

		await waitFor(() => expect(screen.getByTestId("ImportWallet__continue-button")).toBeEnabled());
		fireEvent.click(screen.getByTestId("ImportWallet__continue-button"));

		await waitFor(() => {
			expect(screen.getByTestId("ImportWallet__success-step")).toBeInTheDocument();
		});

		fireEvent.click(screen.getByTestId("ImportWallet__finish-button"));

		await waitFor(() => {
			expect(profile.wallets().findByAddressWithNetwork(randomAddress, "ark.devnet")).toBeInstanceOf(Wallet);
		});
	});

	it("should import by public key", async () => {
		const history = createMemoryHistory();
		history.push(route);

		render(
			<Route path="/profiles/:profileId/wallets/import">
				<ImportWallet />
			</Route>,
			{
				history,
				routes: [route],
			},
		);

		await screen.findByTestId("NetworkStep");

		const selectNetworkInput = screen.getByTestId("SelectNetworkInput__input");

		fireEvent.change(selectNetworkInput, { target: { value: "ARK D" } });
		fireEvent.keyDown(selectNetworkInput, { code: 13, key: "Enter" });

		expect(selectNetworkInput).toHaveValue("ARK Devnet");

		await waitFor(() => expect(screen.getByTestId("ImportWallet__continue-button")).toBeEnabled());
		fireEvent.click(screen.getByTestId("ImportWallet__continue-button"));

		await waitFor(() => expect(() => screen.getByTestId("ImportWallet__method-step")).not.toThrow());

		expect(screen.getByTestId("ImportWallet__method-step")).toBeInTheDocument();

		fireEvent.focus(screen.getByTestId("SelectDropdown__input"));

		await screen.findByText(commonTranslations.PUBLIC_KEY);
		fireEvent.mouseDown(screen.getByText(commonTranslations.PUBLIC_KEY));

		await screen.findByTestId("ImportWallet__publicKey-input");
		fireEvent.input(screen.getByTestId("ImportWallet__publicKey-input"), { target: { value: randomPublicKey } });

		await waitFor(() => expect(screen.getByTestId("ImportWallet__continue-button")).toBeEnabled());
		fireEvent.click(screen.getByTestId("ImportWallet__continue-button"));

		await waitFor(() => {
			expect(screen.getByTestId("ImportWallet__success-step")).toBeInTheDocument();
		});

		fireEvent.click(screen.getByTestId("ImportWallet__finish-button"));

		await waitFor(() => {
			expect(profile.wallets().findByAddressWithNetwork(randomAddress, "ark.devnet")).toBeInstanceOf(Wallet);
		});
	});

	it("should not allow importing from an invalid public key", async () => {
		const history = createMemoryHistory();
		history.push(route);

		render(
			<Route path="/profiles/:profileId/wallets/import">
				<ImportWallet />
			</Route>,
			{
				history,
				routes: [route],
			},
		);

		await screen.findByTestId("NetworkStep");

		const selectNetworkInput = screen.getByTestId("SelectNetworkInput__input");

		fireEvent.change(selectNetworkInput, { target: { value: "ARK D" } });
		fireEvent.keyDown(selectNetworkInput, { code: 13, key: "Enter" });

		expect(selectNetworkInput).toHaveValue("ARK Devnet");

		await waitFor(() => expect(screen.getByTestId("ImportWallet__continue-button")).toBeEnabled());
		fireEvent.click(screen.getByTestId("ImportWallet__continue-button"));

		await waitFor(() => expect(() => screen.getByTestId("ImportWallet__method-step")).not.toThrow());

		expect(screen.getByTestId("ImportWallet__method-step")).toBeInTheDocument();

		fireEvent.focus(screen.getByTestId("SelectDropdown__input"));

		await screen.findByText(commonTranslations.PUBLIC_KEY);
		fireEvent.mouseDown(screen.getByText(commonTranslations.PUBLIC_KEY));

		await screen.findByTestId("ImportWallet__publicKey-input");
		fireEvent.input(screen.getByTestId("ImportWallet__publicKey-input"), {
			target: { value: randomPublicKeyInvalid },
		});

		await waitFor(() => expect(screen.getByTestId("ImportWallet__continue-button")).toBeDisabled());
	});

	it("should import by secret", async () => {
		const history = createMemoryHistory();
		history.push(route);

		render(
			<Route path="/profiles/:profileId/wallets/import">
				<ImportWallet />
			</Route>,
			{
				history,
				routes: [route],
			},
		);

		const countBefore = profile.wallets().count();

		await screen.findByTestId("NetworkStep");

		const selectNetworkInput = screen.getByTestId("SelectNetworkInput__input");

		fireEvent.change(selectNetworkInput, { target: { value: "ARK D" } });
		fireEvent.keyDown(selectNetworkInput, { code: 13, key: "Enter" });

		expect(selectNetworkInput).toHaveValue("ARK Devnet");

		await waitFor(() => expect(screen.getByTestId("ImportWallet__continue-button")).toBeEnabled());
		fireEvent.click(screen.getByTestId("ImportWallet__continue-button"));

		await waitFor(() => expect(() => screen.getByTestId("ImportWallet__method-step")).not.toThrow());

		expect(screen.getByTestId("ImportWallet__method-step")).toBeInTheDocument();

		fireEvent.focus(screen.getByTestId("SelectDropdown__input"));

		await screen.findByText(commonTranslations.SECRET);
		fireEvent.mouseDown(screen.getByText(commonTranslations.SECRET));

		await screen.findByTestId("ImportWallet__secret-input");
		fireEvent.input(screen.getByTestId("ImportWallet__secret-input"), { target: { value: "secret.111" } });

		await waitFor(() => expect(screen.getByTestId("ImportWallet__continue-button")).toBeEnabled());
		fireEvent.click(screen.getByTestId("ImportWallet__continue-button"));

		await waitFor(() => {
			expect(screen.getByTestId("ImportWallet__success-step")).toBeInTheDocument();
		});

		fireEvent.click(screen.getByTestId("ImportWallet__finish-button"));

		await waitFor(() => expect(profile.wallets().count()).toBe(countBefore + 1));
	});

	it("should import by secret with encryption", async () => {
		const history = createMemoryHistory();
		history.push(route);

		render(
			<Route path="/profiles/:profileId/wallets/import">
				<ImportWallet />
			</Route>,
			{
				history,
				routes: [route],
			},
		);

		await screen.findByTestId("NetworkStep");

		const selectNetworkInput = screen.getByTestId("SelectNetworkInput__input");

		fireEvent.change(selectNetworkInput, { target: { value: "ARK D" } });
		fireEvent.keyDown(selectNetworkInput, { code: 13, key: "Enter" });

		expect(selectNetworkInput).toHaveValue("ARK Devnet");

		await waitFor(() => expect(screen.getByTestId("ImportWallet__continue-button")).toBeEnabled());
		fireEvent.click(screen.getByTestId("ImportWallet__continue-button"));

		await waitFor(() => expect(() => screen.getByTestId("ImportWallet__method-step")).not.toThrow());

		expect(screen.getByTestId("ImportWallet__method-step")).toBeInTheDocument();

		fireEvent.focus(screen.getByTestId("SelectDropdown__input"));

		await screen.findByText(commonTranslations.SECRET);
		fireEvent.mouseDown(screen.getByText(commonTranslations.SECRET));

		await screen.findByTestId("ImportWallet__secret-input");
		fireEvent.input(screen.getByTestId("ImportWallet__secret-input"), { target: { value: "secret.222" } });

		await waitFor(() => expect(screen.getByTestId("ImportWallet__continue-button")).toBeEnabled());

		fireEvent.click(screen.getByTestId("ImportWallet__encryption-toggle"));

		fireEvent.click(screen.getByTestId("ImportWallet__continue-button"));

		await waitFor(() => {
			expect(screen.getByTestId("EncryptPassword")).toBeInTheDocument();
		});

		fireEvent.input(screen.getAllByTestId("InputPassword")[0], { target: { value: "S3cUrePa$sword" } });

		fireEvent.input(screen.getAllByTestId("InputPassword")[1], { target: { value: "S3cUrePa$sword" } });

		await waitFor(() => expect(screen.getByTestId("ImportWallet__continue-button")).toBeEnabled());
		fireEvent.click(screen.getByTestId("ImportWallet__continue-button"));

		await waitFor(
			() => {
				expect(screen.getByTestId("ImportWallet__success-step")).toBeInTheDocument();
			},
			{ timeout: 15_000 },
		);
	});

	it("should import by secret with second signature and use password to encrypt both", async () => {
		const history = createMemoryHistory();
		history.push(route);

		render(
			<Route path="/profiles/:profileId/wallets/import">
				<ImportWallet />
			</Route>,
			{
				history,
				routes: [route],
			},
		);

		await screen.findByTestId("NetworkStep");

		const selectNetworkInput = screen.getByTestId("SelectNetworkInput__input");

		fireEvent.change(selectNetworkInput, { target: { value: "ARK D" } });
		fireEvent.keyDown(selectNetworkInput, { code: 13, key: "Enter" });

		expect(selectNetworkInput).toHaveValue("ARK Devnet");

		await waitFor(() => expect(screen.getByTestId("ImportWallet__continue-button")).toBeEnabled());
		fireEvent.click(screen.getByTestId("ImportWallet__continue-button"));

		await waitFor(() => expect(() => screen.getByTestId("ImportWallet__method-step")).not.toThrow());

		fireEvent.focus(screen.getByTestId("SelectDropdown__input"));

		await screen.findByText(commonTranslations.SECRET);
		fireEvent.mouseDown(screen.getByText(commonTranslations.SECRET));

		expect(screen.getByTestId("ImportWallet__method-step")).toBeInTheDocument();

		const passphraseInput = screen.getByTestId("ImportWallet__secret-input");

		expect(passphraseInput).toBeInTheDocument();

		fireEvent.input(passphraseInput, { target: { value: "abc" } });

		await waitFor(() => expect(screen.getByTestId("ImportWallet__continue-button")).toBeEnabled());

		fireEvent.click(screen.getByTestId("ImportWallet__encryption-toggle"));

		fireEvent.click(screen.getByTestId("ImportWallet__continue-button"));

		await waitFor(() => {
			expect(screen.getByTestId("EncryptPassword")).toBeInTheDocument();
		});

		fireEvent.input(screen.getByTestId("EncryptPassword__second-secret"), { target: { value: "abc" } });

		fireEvent.input(screen.getAllByTestId("InputPassword")[0], { target: { value: "S3cUrePa$sword" } });

		fireEvent.input(screen.getAllByTestId("InputPassword")[1], { target: { value: "S3cUrePa$sword" } });

		await waitFor(() => expect(screen.getByTestId("ImportWallet__continue-button")).toBeEnabled());
		fireEvent.click(screen.getByTestId("ImportWallet__continue-button"));

		await waitFor(
			() => {
				expect(screen.getByTestId("ImportWallet__success-step")).toBeInTheDocument();
			},
			{ timeout: 15_000 },
		);
	});

	it("should get options depend on the network", async () => {
		const history = createMemoryHistory();
		history.push(route);

		render(
			<Route path="/profiles/:profileId/wallets/import">
				<ImportWallet />
			</Route>,
			{
				history,
				routes: [route],
			},
		);

		await screen.findByTestId("NetworkStep");

		const selectNetworkInput = screen.getByTestId("SelectNetworkInput__input");

		fireEvent.change(selectNetworkInput, { target: { value: "ARK D" } });
		fireEvent.keyDown(selectNetworkInput, { code: 13, key: "Enter" });

		expect(selectNetworkInput).toHaveValue("ARK Devnet");

		await waitFor(() => expect(screen.getByTestId("ImportWallet__continue-button")).toBeEnabled());
		fireEvent.click(screen.getByTestId("ImportWallet__continue-button"));

		await waitFor(() => expect(() => screen.getByTestId("ImportWallet__method-step")).not.toThrow());

		expect(screen.getByTestId("ImportWallet__method-step")).toBeInTheDocument();

		fireEvent.focus(screen.getByTestId("SelectDropdown__input"));

		await screen.findAllByText(commonTranslations.MNEMONIC_TYPE.BIP39);
		await screen.findByText(commonTranslations.ADDRESS);
		await waitFor(() => expect(screen.queryByText(commonTranslations.MNEMONIC_TYPE.BIP49)).not.toBeInTheDocument());
		await waitFor(() => expect(screen.queryByText(commonTranslations.PRIVATE_KEY)).not.toBeInTheDocument());
		await waitFor(() => expect(screen.queryByText(commonTranslations.WIF)).not.toBeInTheDocument());
		await waitFor(() => expect(screen.queryByText(commonTranslations.ENCRYPTED_WIF)).not.toBeInTheDocument());
	});

	it("should show an error message for duplicate address when importing by mnemonic", async () => {
		const generated = await profile.walletFactory().generate({
			coin: "ARK",
			network: "ark.devnet",
		});

		profile.wallets().push(generated.wallet);

		const history = createMemoryHistory();
		history.push(route);

		render(
			<Route path="/profiles/:profileId/wallets/import">
				<ImportWallet />
			</Route>,
			{
				history,
				routes: [route],
			},
		);

		await screen.findByTestId("NetworkStep");

		const selectNetworkInput = screen.getByTestId("SelectNetworkInput__input");

		fireEvent.change(selectNetworkInput, { target: { value: "ARK D" } });
		fireEvent.keyDown(selectNetworkInput, { code: 13, key: "Enter" });

		expect(selectNetworkInput).toHaveValue("ARK Devnet");

		await waitFor(() => expect(screen.getByTestId("ImportWallet__continue-button")).toBeEnabled());
		fireEvent.click(screen.getByTestId("ImportWallet__continue-button"));

		await waitFor(() => expect(() => screen.getByTestId("ImportWallet__method-step")).not.toThrow());

		expect(screen.getByTestId("ImportWallet__method-step")).toBeInTheDocument();

		const passphraseInput = screen.getByTestId("ImportWallet__mnemonic-input");

		expect(passphraseInput).toBeInTheDocument();

		fireEvent.input(passphraseInput, { target: { value: generated.mnemonic } });

		await waitFor(() => {
			expect(screen.getByTestId("Input__error")).toHaveAttribute(
				"data-errortext",
				commonTranslations.INPUT_ADDRESS.VALIDATION.ADDRESS_ALREADY_EXISTS.replace(
					"{{address}}",
					generated.wallet.address(),
				),
			);
		});

		expect(screen.getByTestId("ImportWallet__continue-button")).toBeDisabled();
	});

	it("should show an error message for duplicate address when importing by address", async () => {
		const history = createMemoryHistory();
		history.push(route);

		render(
			<Route path="/profiles/:profileId/wallets/import">
				<ImportWallet />
			</Route>,
			{
				history,
				routes: [route],
			},
		);

		await screen.findByTestId("NetworkStep");

		const selectNetworkInput = screen.getByTestId("SelectNetworkInput__input");

		fireEvent.change(selectNetworkInput, { target: { value: "ARK D" } });
		fireEvent.keyDown(selectNetworkInput, { code: 13, key: "Enter" });

		expect(selectNetworkInput).toHaveValue("ARK Devnet");

		await waitFor(() => expect(screen.getByTestId("ImportWallet__continue-button")).toBeEnabled());
		fireEvent.click(screen.getByTestId("ImportWallet__continue-button"));

		await waitFor(() => expect(() => screen.getByTestId("ImportWallet__method-step")).not.toThrow());

		expect(screen.getByTestId("ImportWallet__method-step")).toBeInTheDocument();

		fireEvent.focus(screen.getByTestId("SelectDropdown__input"));

		await screen.findByText(commonTranslations.ADDRESS);
		fireEvent.mouseDown(screen.getByText(commonTranslations.ADDRESS));

		await screen.findByTestId("ImportWallet__address-input");
		fireEvent.input(screen.getByTestId("ImportWallet__address-input"), {
			target: { value: profile.wallets().first().address() },
		});

		await waitFor(() => {
			expect(screen.getByTestId("Input__error")).toHaveAttribute(
				"data-errortext",
				commonTranslations.INPUT_ADDRESS.VALIDATION.ADDRESS_ALREADY_EXISTS.replace(
					"{{address}}",
					profile.wallets().first().address(),
				),
			);
		});

		expect(screen.getByTestId("ImportWallet__continue-button")).toBeDisabled();
	});

	it("should show an error message for invalid address", async () => {
		const history = createMemoryHistory();
		history.push(route);

		render(
			<Route path="/profiles/:profileId/wallets/import">
				<ImportWallet />
			</Route>,
			{
				history,
				routes: [route],
			},
		);

		await screen.findByTestId("NetworkStep");

		const selectNetworkInput = screen.getByTestId("SelectNetworkInput__input");

		fireEvent.change(selectNetworkInput, { target: { value: "ARK D" } });
		fireEvent.keyDown(selectNetworkInput, { code: 13, key: "Enter" });

		expect(selectNetworkInput).toHaveValue("ARK Devnet");

		await waitFor(() => expect(screen.getByTestId("ImportWallet__continue-button")).toBeEnabled());
		fireEvent.click(screen.getByTestId("ImportWallet__continue-button"));

		await waitFor(() => expect(() => screen.getByTestId("ImportWallet__method-step")).not.toThrow());

		expect(screen.getByTestId("ImportWallet__method-step")).toBeInTheDocument();

		fireEvent.focus(screen.getByTestId("SelectDropdown__input"));

		await screen.findByText(commonTranslations.ADDRESS);
		fireEvent.mouseDown(screen.getByText(commonTranslations.ADDRESS));

		await screen.findByTestId("ImportWallet__address-input");
		fireEvent.input(screen.getByTestId("ImportWallet__address-input"), { target: { value: "123" } });

		await waitFor(() => {
			expect(screen.getByTestId("Input__error")).toHaveAttribute(
				"data-errortext",
				commonTranslations.INPUT_ADDRESS.VALIDATION.NOT_VALID,
			);
		});

		expect(screen.getByTestId("ImportWallet__continue-button")).toBeDisabled();
	});

	it("should render as ledger import", async () => {
		const transport = getDefaultLedgerTransport();

		const history = createMemoryHistory();

		history.push({
			pathname: route,
			search: `?ledger=true`,
		});

		const { container } = render(
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

		await screen.findByTestId("LedgerTabs");
	});

	it("should import by address and name", async () => {
		const emptyProfile = env.profiles().create("empty profile");
		const emptyProfileRoute = `/profiles/${emptyProfile.id()}/wallets/import`;

		await env.profiles().restore(emptyProfile);
		await emptyProfile.sync();

		const history = createMemoryHistory();
		history.push(route);
		const randomNewAddress = "DHnF7Ycv16QxQQNGDUdGzWGh5n3ym424UW";

		render(
			<Route path="/profiles/:profileId/wallets/import">
				<ImportWallet />
			</Route>,
			{
				history,
				routes: [emptyProfileRoute],
			},
		);

		const historySpy = jest.spyOn(history, "push").mockImplementation();

		await screen.findByTestId("NetworkStep");

		const selectNetworkInput = screen.getByTestId("SelectNetworkInput__input");

		fireEvent.change(selectNetworkInput, { target: { value: "ARK D" } });
		fireEvent.keyDown(selectNetworkInput, { code: 13, key: "Enter" });

		expect(selectNetworkInput).toHaveValue("ARK Devnet");

		await waitFor(() => expect(screen.getByTestId("ImportWallet__continue-button")).toBeEnabled());
		fireEvent.click(screen.getByTestId("ImportWallet__continue-button"));

		await waitFor(() => expect(() => screen.getByTestId("ImportWallet__method-step")).not.toThrow());

		expect(screen.getByTestId("ImportWallet__method-step")).toBeInTheDocument();

		fireEvent.focus(screen.getByTestId("SelectDropdown__input"));

		await screen.findByText(commonTranslations.ADDRESS);
		fireEvent.mouseDown(screen.getByText(commonTranslations.ADDRESS));

		await screen.findByTestId("ImportWallet__address-input");
		fireEvent.input(screen.getByTestId("ImportWallet__address-input"), { target: { value: randomNewAddress } });

		await waitFor(() => expect(screen.getByTestId("ImportWallet__continue-button")).toBeEnabled(), {
			timeout: 4000,
		});
		fireEvent.click(screen.getByTestId("ImportWallet__continue-button"));

		await waitFor(() => {
			expect(screen.getByTestId("ImportWallet__success-step")).toBeInTheDocument();
		});

		fireEvent.click(screen.getByTestId("ImportWallet__finish-button"));

		await waitFor(() => {
			expect(historySpy).toHaveBeenCalledWith(expect.stringContaining(`/profiles/${profile.id()}/wallets/`));
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
			mnemonic: MNEMONICS[1],
			network: "ark.devnet",
		});

		wallet.settings().set(Contracts.WalletSetting.Alias, "My wallet");

		profile.wallets().push(wallet);

		render(
			<Route path="/profiles/:profileId/wallets/import">
				<ImportWallet />
			</Route>,
			{
				history,
				routes: [emptyProfileRoute],
			},
		);

		await screen.findByTestId("NetworkStep");

		const selectNetworkInput = screen.getByTestId("SelectNetworkInput__input");

		fireEvent.change(selectNetworkInput, { target: { value: "ARK D" } });
		fireEvent.keyDown(selectNetworkInput, { code: 13, key: "Enter" });

		expect(selectNetworkInput).toHaveValue("ARK Devnet");

		await waitFor(() => expect(screen.getByTestId("ImportWallet__continue-button")).toBeEnabled());
		fireEvent.click(screen.getByTestId("ImportWallet__continue-button"));

		await waitFor(() => expect(() => screen.getByTestId("ImportWallet__method-step")).not.toThrow());

		expect(screen.getByTestId("ImportWallet__method-step")).toBeInTheDocument();

		fireEvent.focus(screen.getByTestId("SelectDropdown__input"));

		await screen.findByText(commonTranslations.ADDRESS);
		fireEvent.mouseDown(screen.getByText(commonTranslations.ADDRESS));

		await screen.findByTestId("ImportWallet__address-input");
		fireEvent.input(screen.getByTestId("ImportWallet__address-input"), { target: { value: randomNewAddress } });

		await waitFor(() => expect(screen.getByTestId("ImportWallet__continue-button")).toBeEnabled(), {
			timeout: 4000,
		});
		fireEvent.click(screen.getByTestId("ImportWallet__continue-button"));

		await waitFor(() => {
			expect(screen.getByTestId("ImportWallet__success-step")).toBeInTheDocument();
		});

		const alias = "My Wallet";

		fireEvent.click(screen.getByTestId("ImportWallet__edit-alias"));

		await screen.findByTestId("UpdateWalletName__input");

		fireEvent.input(screen.getByTestId("UpdateWalletName__input"), { target: { value: alias } });

		await waitFor(() => {
			expect(screen.getByTestId("Input__error")).toHaveAttribute(
				"data-errortext",
				walletTranslations.VALIDATION.ALIAS_ASSIGNED.replace("{{alias}}", alias),
			);
		});

		expect(screen.getByTestId("UpdateWalletName__submit")).toBeDisabled();
	});

	it("should show warning sync error toast in network step and retry sync", async () => {
		const history = createMemoryHistory();
		history.push(route);

		render(
			<Route path="/profiles/:profileId/wallets/import">
				<>
					<ToastContainer closeOnClick={false} newestOnTop />
					<ImportWallet />
				</>
			</Route>,
			{
				history,
				routes: [route],
			},
		);

		await screen.findByTestId("NetworkStep");

		const selectNetworkInput = screen.getByTestId("SelectNetworkInput__input");

		fireEvent.change(selectNetworkInput, { target: { value: "ARK D" } });
		fireEvent.keyDown(selectNetworkInput, { code: 13, key: "Enter" });

		expect(selectNetworkInput).toHaveValue("ARK Devnet");

		const coin = profile.coins().get("ARK", "ark.devnet");
		const coinMock = jest.spyOn(coin, "__construct").mockImplementationOnce(() => {
			throw new Error("test");
		});

		await waitFor(() => expect(screen.getByTestId("ImportWallet__continue-button")).toBeEnabled());
		fireEvent.click(screen.getByTestId("ImportWallet__continue-button"));

		await screen.findByTestId("SyncErrorMessage__retry");

		const toastDismissMock = jest.spyOn(toasts, "dismiss").mockResolvedValue(undefined);
		fireEvent.click(screen.getByTestId("SyncErrorMessage__retry"));

		await screen.findByTestId("SyncErrorMessage__retry");

		coinMock.mockRestore();
		toastDismissMock.mockRestore();
	});

	it("should import with wif", async () => {
		let form: ReturnType<typeof useForm>;
		const wif = "wif.1111";

		const Component = () => {
			const network = env.availableNetworks().find((net) => net.coin() === "ARK" && net.id() === "ark.devnet");
			assertNetwork(network);

			network.importMethods = () => ({
				wif: {
					canBeEncrypted: true,
					default: true,
					permissions: ["read", "write"],
				},
			});

			form = useForm({
				defaultValues: { network, wif },
				shouldUnregister: false,
			});

			form.register("importOption");
			form.register("network");
			form.register("wif");
			form.register("value");

			return (
				<EnvironmentProvider env={env}>
					<FormProvider {...form}>
						<MethodStep profile={profile} />
					</FormProvider>
				</EnvironmentProvider>
			);
		};

		history.push(`/profiles/${profile.id()}`);

		const { container } = render(
			<Route path="/profiles/:profileId">
				<Component />
			</Route>,
			{ history, withProviders: false },
		);

		expect(screen.getByTestId("ImportWallet__method-step")).toBeInTheDocument();

		await waitFor(() => expect(screen.getByTestId("ImportWallet__wif-input")));

		const passphraseInput = screen.getByTestId("ImportWallet__wif-input");

		expect(passphraseInput).toBeInTheDocument();

		fireEvent.input(passphraseInput, { target: { value: wif } });

		await waitFor(() => {
			expect(form.getValues()).toMatchObject({
				importOption: {
					canBeEncrypted: true,
					label: "WIF",
					value: OptionsValue.WIF,
				},
				value: wif,
			});
		});
		await waitFor(() => {
			expect(screen.getByTestId("ImportWallet__wif-input")).toHaveValue(wif);
		});

		expect(container).toMatchSnapshot();
	});

	it("should import with encryped wif", async () => {
		let form: ReturnType<typeof useForm>;
		const wif = "wif.1111";

		const Component = () => {
			const network = env.availableNetworks().find((net) => net.coin() === "ARK" && net.id() === "ark.devnet");
			assertNetwork(network);

			//ts-ignore
			network.importMethods = () => ({
				//ts-ignore
				encryptedWif: true,
			});

			form = useForm({
				defaultValues: { network, wif },
				shouldUnregister: false,
			});

			form.register("type");
			form.register("network");
			form.register("encryptedWif");
			form.register("value");

			return (
				<EnvironmentProvider env={env}>
					<FormProvider {...form}>
						<MethodStep profile={profile} />
					</FormProvider>
				</EnvironmentProvider>
			);
		};

		history.push(`/profiles/${profile.id()}`);

		const { container } = render(
			<Route path="/profiles/:profileId">
				<Component />
			</Route>,
			{ history, withProviders: false },
		);

		expect(screen.getByTestId("ImportWallet__method-step")).toBeInTheDocument();

		await waitFor(() => expect(screen.getByTestId("ImportWallet__encryptedWif-input")));

		const passphraseInput = screen.getByTestId("ImportWallet__encryptedWif-input");

		expect(passphraseInput).toBeInTheDocument();

		fireEvent.input(passphraseInput, { target: { value: wif } });

		await waitFor(() => {
			expect(screen.getByTestId("ImportWallet__encryptedWif-input")).toHaveValue(wif);
		});

		expect(container).toMatchSnapshot();
	});
});
