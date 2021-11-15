// @ts-ignore
import Transport, { Observer } from "@ledgerhq/hw-transport";
import { TransportReplayer } from "@ledgerhq/hw-transport-mocker/lib/openTransportReplayer";
import { ARK } from "@payvo/sdk-ark";
import { Contracts, Environment } from "@payvo/sdk-profiles";
import { render, RenderResult } from "@testing-library/react";
import { ConfigurationProvider, EnvironmentProvider } from "app/contexts";
import { useProfileSynchronizer } from "app/hooks/use-profile-synchronizer";
import { i18n } from "app/i18n";
import { httpClient } from "app/services";
import { createMemoryHistory } from "history";
import nock from "nock";
import { PluginManagerProvider } from "plugins/context/PluginManagerProvider";
import { PluginManager } from "plugins/core/plugin-manager";
import React from "react";
import { FormProvider, useForm, UseFormMethods } from "react-hook-form";
import { I18nextProvider } from "react-i18next";
import { Router } from "react-router-dom";
import delegate from "tests/fixtures/coins/ark/devnet/wallets/D61mfSggzbvQgTUe6JhYKH2doHaqJ3Dyib.json";
import fixtureData from "tests/fixtures/env/storage.json";
import TestingPasswords from "tests/fixtures/env/testing-passwords.json";
import { StubStorage } from "tests/mocks";

const ProfileSynchronizer = ({ children }: { children?: React.ReactNode }) => {
	const { profile, profileIsSyncing } = useProfileSynchronizer();

	if (!profile?.id()) {
		return <>{children}</>;
	}

	if (profileIsSyncing) {
		return <></>;
	}

	return <>{children}</>;
};

export const pluginManager = new PluginManager();

export const WithProviders: React.FC = ({ children }: { children?: React.ReactNode }) => (
	<I18nextProvider i18n={i18n}>
		<EnvironmentProvider env={env}>
			<ConfigurationProvider>{children}</ConfigurationProvider>
		</EnvironmentProvider>
	</I18nextProvider>
);

const customRender = (component: React.ReactElement, options: any = {}) =>
	render(component, { wrapper: WithProviders, ...options });

export function renderWithForm(
	component: React.ReactElement,
	options?: {
		withProviders?: boolean;
		defaultValues?: any;
		registerCallback?: (useFormMethods: UseFormMethods) => void;
		shouldUnregister?: boolean;
	},
) {
	const renderFunction = options?.withProviders ?? true ? renderWithRouter : render;
	const defaultValues = options?.defaultValues ?? {};

	let form: UseFormMethods | undefined;

	const Component = () => {
		form = useForm<any>({
			defaultValues,
			mode: "onChange",
			shouldUnregister: options?.shouldUnregister,
		});

		options?.registerCallback?.(form);

		return <FormProvider {...form}>{component}</FormProvider>;
	};

	const renderResult: RenderResult = renderFunction(<Component />);

	return { ...renderResult, form: () => form };
}

const renderWithRouter = (
	component: React.ReactElement,
	{
		routes = ["/"],
		history = createMemoryHistory({ initialEntries: routes }),
		withProviders = true,
		withPluginProvider = true,
		withProfileSynchronizer = false,
	} = {},
) => {
	const PluginProviderWrapper = ({ children }: { children: React.ReactNode }) =>
		withPluginProvider ? (
			<PluginManagerProvider manager={pluginManager} services={[]}>
				{children}
			</PluginManagerProvider>
		) : (
			<>{children}</>
		);

	const ProfileSynchronizerWrapper = ({ children }: { children: React.ReactNode }) =>
		withProfileSynchronizer ? <ProfileSynchronizer>{children}</ProfileSynchronizer> : <>{children}</>;

	const RouterWrapper = ({ children }: { children: React.ReactNode }) =>
		withProviders ? (
			<WithProviders>
				<Router history={history}>
					<PluginProviderWrapper>
						<ProfileSynchronizerWrapper>{children}</ProfileSynchronizerWrapper>
					</PluginProviderWrapper>
				</Router>
			</WithProviders>
		) : (
			<Router history={history}>{children}</Router>
		);

	return {
		...customRender(component, { wrapper: RouterWrapper }),
		history,
	};
};

export * from "@testing-library/react";

export { renderWithRouter as render, customRender as renderWithoutRouter };

export const getDefaultProfileId = () => Object.keys(fixtureData.profiles)[0];
export const getPasswordProtectedProfileId = () => Object.keys(fixtureData.profiles)[1];
export const getDefaultWalletId = () => Object.keys(Object.values(fixtureData.profiles)[0].wallets)[0];
export const getDefaultWalletMnemonic = () => "master dizzy era math peanut crew run manage better flame tree prevent";
export const getDefaultLedgerTransport = () => TransportReplayer;

// Ledger observer spy helper
export const ledgerObserverSpy = () => {
	//@ts-ignore
	let observer: Observer<any> = undefined;
	const unsubscribe = jest.fn();

	const mockTransportListen = (transport: typeof Transport) =>
		jest.spyOn(transport, "listen").mockImplementationOnce((obv) => {
			observer = obv;
			return { unsubscribe };
		});

	return {
		mockTransportListen,
		observer: {
			complete: () => observer.complete(),
			error: (e: any) => observer.error(e),
			next: (property: { descriptor: string; deviceModel: { id: string }; type: string }) =>
				observer.error(property),
		},
		unsubscribe,
	};
};

//@ts-ignore
export const getDefaultPassword = () => TestingPasswords?.profiles[getPasswordProtectedProfileId()]?.password;

const pluginNames: string[] = ["@dated/delegate-calculator-wallet-plugin", "@payvo/ark-explorer-wallet-plugin"];

export const defaultNetMocks = () => {
	nock.disableNetConnect();

	// devnet
	nock("https://ark-test.payvo.com")
		.get("/api/blockchain")
		.reply(200, require("../tests/fixtures/coins/ark/devnet/blockchain.json"))
		.get("/api/node/configuration")
		.reply(200, require("../tests/fixtures/coins/ark/devnet/configuration.json"))
		.get("/api/peers")
		.reply(200, require("../tests/fixtures/coins/ark/devnet/peers.json"))
		.get("/api/node/configuration/crypto")
		.reply(200, require("../tests/fixtures/coins/ark/devnet/cryptoConfiguration.json"))
		.get("/api/node/syncing")
		.reply(200, require("../tests/fixtures/coins/ark/devnet/syncing.json"))
		.get("/api/wallets/D5sRKWckH4rE1hQ9eeMeHAepgyC3cvJtwb")
		.reply(200, require("../tests/fixtures/coins/ark/devnet/wallets/D5sRKWckH4rE1hQ9eeMeHAepgyC3cvJtwb.json"))
		.get("/api/wallets/DABCrsfEqhtdzmBrE2AU5NNmdUFCGXKEkr")
		.reply(200, require("../tests/fixtures/coins/ark/devnet/wallets/DABCrsfEqhtdzmBrE2AU5NNmdUFCGXKEkr.json"))
		.get("/api/wallets/DNTwQTSp999ezQ425utBsWetcmzDuCn2pN")
		.reply(200, require("../tests/fixtures/coins/ark/devnet/wallets/DNTwQTSp999ezQ425utBsWetcmzDuCn2pN.json"))
		.get("/api/wallets/DJXg9Vqg2tofRNrMAvMzhZTkegu8QyyNQq")
		.reply(200, require("../tests/fixtures/coins/ark/devnet/wallets/DJXg9Vqg2tofRNrMAvMzhZTkegu8QyyNQq.json"))
		.get("/api/wallets/D61mfSggzbvQgTUe6JhYKH2doHaqJ3Dyib")
		.reply(200, delegate)
		.get("/api/wallets/034151a3ec46b5670a682b0a63394f863587d1bc97483b1b6c70eb58e7f0aed192")
		.reply(200, delegate)
		.get("/api/wallets/D8rr7B1d6TL6pf14LgMz4sKp1VBMs6YUYD")
		.reply(200, require("../tests/fixtures/coins/ark/devnet/wallets/D8rr7B1d6TL6pf14LgMz4sKp1VBMs6YUYD.json"))
		.get("/api/wallets/DFJ5Z51F1euNNdRUQJKQVdG4h495LZkc6T")
		.reply(200, require("../tests/fixtures/coins/ark/devnet/wallets/DFJ5Z51F1euNNdRUQJKQVdG4h495LZkc6T.json"))
		.get("/api/wallets/DKrACQw7ytoU2gjppy3qKeE2dQhZjfXYqu")
		.reply(200, require("../tests/fixtures/coins/ark/devnet/wallets/DKrACQw7ytoU2gjppy3qKeE2dQhZjfXYqu.json"))
		.get("/api/wallets/D9YiyRYMBS2ofzqkufjrkB9nHofWgJLM7f")
		.reply(200, require("../tests/fixtures/coins/ark/devnet/wallets/D9YiyRYMBS2ofzqkufjrkB9nHofWgJLM7f.json"))
		.get("/api/wallets/D8rr7B1d6TL6pf14LgMz4sKp1VBMs6YUYD/votes")
		.reply(200, require("../tests/fixtures/coins/ark/devnet/votes.json"))
		.get("/api/delegates")
		.query(true)
		.reply(200, require("../tests/fixtures/coins/ark/devnet/delegates.json"))
		.get(/\/api\/delegates\/.+/)
		.reply(200, delegate)
		.get("/api/node/fees")
		.query(true)
		.reply(200, require("../tests/fixtures/coins/ark/devnet/node-fees.json"))
		.get("/api/transactions/fees")
		.reply(200, require("../tests/fixtures/coins/ark/devnet/transaction-fees.json"))
		.persist();

	// mainnet
	nock("https://ark-live.payvo.com")
		.get("/api/node/configuration")
		.reply(200, require("../tests/fixtures/coins/ark/mainnet/configuration.json"))
		.get("/api/peers")
		.reply(200, require("../tests/fixtures/coins/ark/mainnet/peers.json"))
		.get("/api/node/configuration/crypto")
		.reply(200, require("../tests/fixtures/coins/ark/mainnet/cryptoConfiguration.json"))
		.get("/api/node/syncing")
		.reply(200, require("../tests/fixtures/coins/ark/mainnet/syncing.json"))
		.get("/api/wallets/AdVSe37niA3uFUPgCgMUH2tMsHF4LpLoiX")
		.reply(200, require("../tests/fixtures/coins/ark/mainnet/wallets/AdVSe37niA3uFUPgCgMUH2tMsHF4LpLoiX.json"))
		.persist();

	nock("https://min-api.cryptocompare.com")
		.get("/data/dayAvg?fsym=DARK&tsym=BTC&toTs=1593561600")
		.reply(200, require("tests/fixtures/exchange/cryptocompare.json"))
		.get("/data/dayAvg?fsym=ARK&tsym=BTC&toTs=1593561600")
		.reply(200, require("tests/fixtures/exchange/cryptocompare.json"))
		.get("/data/histoday")
		.query(true)
		.reply(200, require("../tests/fixtures/exchange/cryptocompare-historical.json"))
		.persist();

	nock("https://raw.githubusercontent.com")
		.get("/PayvoHQ/wallet-plugins/master/whitelist.json")
		.reply(200, require("tests/fixtures/plugins/whitelist.json"))
		.persist();

	nock("https://registry.npmjs.com")
		.get("/-/v1/search")
		.query((parameters) => parameters.from === "0")
		.once()
		.reply(200, require("tests/fixtures/plugins/registry-response.json"));

	nock("https://api.pwnedpasswords.com")
		.get("/range/88250")
		.reply(200, require("tests/fixtures/haveibeenpwned/range-88250.txt"))
		.get("/range/6699e")
		.reply(200, require("tests/fixtures/haveibeenpwned/range-6699e.txt"))
		.get("/range/de5b5")
		.reply(200, require("tests/fixtures/haveibeenpwned/range-de5b5.txt"))
		.get("/range/15e39")
		.reply(200, require("tests/fixtures/haveibeenpwned/range-15e39.txt"))
		.get("/range/d67b2")
		.reply(200, require("tests/fixtures/haveibeenpwned/range-d67b2.txt"))
		.get("/range/f4110")
		.reply(200, require("tests/fixtures/haveibeenpwned/range-f4110.txt"))
		.get("/range/066d8")
		.reply(200, require("tests/fixtures/haveibeenpwned/range-066d8.txt"))
		.get("/range/e3b02")
		.reply(200, require("tests/fixtures/haveibeenpwned/range-e3b02.txt"))
		.get("/range/10428")
		.reply(200, require("tests/fixtures/haveibeenpwned/range-10428.txt"))
		.get("/range/e28b7")
		.reply(200, require("tests/fixtures/haveibeenpwned/range-e28b7.txt"))
		.get("/range/fdb69")
		.reply(200, require("tests/fixtures/haveibeenpwned/range-fdb69.txt"))
		.get("/range/f4c0e")
		.reply(200, require("tests/fixtures/haveibeenpwned/range-f4c0e.txt"))
		.get("/range/2e137")
		.reply(200, require("tests/fixtures/haveibeenpwned/range-2e137.txt"))
		.get("/range/86be3")
		.reply(200, require("tests/fixtures/haveibeenpwned/range-86be3.txt"))
		.persist();

	for (const pluginName of pluginNames) {
		nock("https://registry.npmjs.com")
			.get(`/${pluginName}`)
			.reply(200, require(`tests/fixtures/plugins/registry/${pluginName}.json`))
			.persist();

		nock("https://api.npmjs.org")
			.get(new RegExp(`/downloads/range/.*${pluginName}`))
			.reply(200, require(`tests/fixtures/plugins/downloads/${pluginName}`))
			.persist();
	}

	nock("https://exchanges.payvo.com")
		.get("/api")
		.reply(200, require("tests/fixtures/exchange/exchanges.json"))
		.get("/api/changenow/currencies")
		.reply(200, require("tests/fixtures/exchange/changenow/currencies.json"))
		.get("/api/changenow/currencies/ark")
		.reply(200, require("tests/fixtures/exchange/changenow/currency-ark.json"))
		.get("/api/changenow/currencies/btc")
		.reply(200, require("tests/fixtures/exchange/changenow/currency-btc.json"))
		.get("/api/changenow/tickers/btc/ark")
		.reply(200, require("tests/fixtures/exchange/changenow/minimum.json"))
		.get("/api/changenow/currencies/ark/payoutAddress")
		.reply(200, { data: true })
		.get("/api/changenow/tickers/ark/btc")
		.reply(200, require("tests/fixtures/exchange/changenow/minimum.json"))
		.get(new RegExp("/api/changenow/tickers/[a-z]{3}/[a-z]{3}/1$"))
		.reply(200, require("tests/fixtures/exchange/changenow/estimate.json"))
		.persist();
};

export const useDefaultNetMocks = defaultNetMocks;

const environmentWithMocks = () => {
	defaultNetMocks();
	return new Environment({ coins: { ARK }, httpClient, storage: new StubStorage() });
};

export const env = environmentWithMocks();

export const syncDelegates = async (profile: Contracts.IProfile) => await env.delegates().syncAll(profile);

export const syncFees = async (profile: Contracts.IProfile) => await env.fees().syncAll(profile);

export const MNEMONICS = [
	"skin fortune security mom coin hurdle click emotion heart brisk exact rather code feature era leopard grocery tide gift power lawsuit sight vehicle coin",
	"audit theory scheme profit away wing rescue cloth fit spell atom rely enter upon man clutch divide buddy office tuition input bundle silk scheme",
	"uphold egg salon police home famous focus fade skin virus fence surprise hidden skate word famous movie grant ghost save fly assume motion case",
	"dress assault rich club glass fancy hood glance install buzz blur attack room outdoor chapter melody tide blur trend into have accuse very little",
	"already device awful potato face kingdom coral biology badge donkey ranch random when dove solve system tonight purchase foot way deliver grow raccoon blame",
	"garden neglect enable bone inform deal shallow smart train enrich cloud police pave ignore assault wrong chef harbor river brain way essay zero mouse",
	"analyst rifle dose thank unfair remain claim exile math foster clarify unfair gauge wasp notice crash sustain session lunch verify gasp try divorce slender",
	"tray analyst bulk topple night swing list execute walk bronze invite title silent loud cash apology sibling wheel thumb dragon black soccer mixed curious",
	"cool path congress harbor position ready embody hunt face field boil brown rubber toss arrange later convince anxiety foam urban monster endless essay melt",
	"subway cradle salad cake toddler sausage neglect eight cruel fault mammal cannon south interest theory sadness pass move outside segment curtain toddler save banner",
];
