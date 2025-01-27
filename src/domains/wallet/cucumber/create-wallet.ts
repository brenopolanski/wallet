import { Selector } from "testcafe";

import { buildTranslations } from "../../../app/i18n/helpers";
import { BASEURL, cucumber, mockMuSigRequest, mockRequest, visitWelcomeScreen } from "../../../utils/e2e-utils";
import { goToProfile } from "../../profile/e2e/common";

const translations = buildTranslations();
let mnemonicWords: string[] = [];

const mocks = [
	mockRequest(
		(request: any) => !!new RegExp(BASEURL + "wallets/([-0-9a-zA-Z]{1,34})").test(request.url),
		"coins/ark/devnet/wallets/not-found",
		404,
	),
	mockRequest(
		(request: any) =>
			!!new RegExp(BASEURL + "transactions\\?page=1&limit=15&address=([-0-9a-zA-Z]{1,34})").test(request.url),
		{
			data: [],
			meta: {
				count: 0,
				first: null,
				last: null,
				next: null,
				pageCount: 0,
				previous: null,
				self: null,
				totalCount: 0,
				totalCountIsEstimate: true,
			},
		},
	),
	mockMuSigRequest("https://ark-test-musig.payvo.com", "list", { result: [] }),
];

cucumber(
	"@createWallet",
	{
		"Given Alice is signed into a profile": async (t: TestController) => {
			await visitWelcomeScreen(t);
			await goToProfile(t);
		},
		"When she navigates to create a wallet": async (t: TestController) => {
			await t.click(Selector("button").withExactText(translations.COMMON.CREATE));
			await t
				.expect(Selector("div").withText(translations.WALLETS.PAGE_CREATE_WALLET.NETWORK_STEP.SUBTITLE).exists)
				.ok();
		},
		"And selects a network": async (t: TestController) => {
			await t.typeText(Selector('[data-testid="SelectNetworkInput__input"]'), "ARK Devnet");
			await t.pressKey("enter");
			await t
				.expect(Selector("button").withText(translations.COMMON.CONTINUE).hasAttribute("disabled"))
				.notOk("Cryptoasset selected", { timeout: 5000 });
			await t.click(Selector("button").withExactText(translations.COMMON.CONTINUE));
		},
		"And sees the generated mnemonic": async (t: TestController) => {
			await t.expect(Selector("h1").withExactText(translations.COMMON.YOUR_PASSPHRASE).exists).ok();
		},
		"And confirms the generated mnemonic": async (t: TestController) => {
			const mnemonicsCount = await Selector("[data-testid=MnemonicList__item]").count;

			if (mnemonicWords.length) {
				mnemonicWords = [];
			}

			for (let index = 0; index <= mnemonicsCount - 1; index++) {
				const textContent = await Selector("[data-testid=MnemonicList__item]").nth(index).textContent;

				mnemonicWords.push(textContent.replace(/\d+/, "").trim());
			}
			await t.click(Selector("button").withExactText(translations.COMMON.CONTINUE));

			// Confirm your password
			await t.expect(Selector("button").withText(translations.COMMON.CONTINUE).hasAttribute("disabled")).ok();

			for (let index = 0; index < 3; index++) {
				const selectWordPhrase = await Selector("[data-testid=MnemonicVerificationOptions__title]").textContent;
				const wordNumber = selectWordPhrase.match(/\d+/)?.[0];
				await t.click(
					Selector("[data-testid=MnemonicVerificationOptions__button]").withText(
						new RegExp(`^${mnemonicWords[Number(wordNumber) - 1]}$`),
					),
				);
			}

			await t.hover(Selector("button").withExactText(translations.COMMON.CONTINUE));
			await t.click(Selector("button").withExactText(translations.COMMON.CONTINUE));
		},
		"Then the new wallet is created": async (t: TestController) => {
			await t.expect(Selector("h1").withExactText(translations.COMMON.COMPLETED).exists).ok();

			// Save and finish
			await t.click(Selector("button").withExactText(translations.COMMON.GO_TO_WALLET));
			await t.expect(Selector("[data-testid=WalletHeader]").exists).ok();
		},
	},
	mocks,
);
cucumber(
	"@createWallet-withEncryption",
	{
		"Given Alice is signed into a profile": async (t: TestController) => {
			await visitWelcomeScreen(t);
			await goToProfile(t);
		},
		"When she navigates to create a wallet": async (t: TestController) => {
			await t.click(Selector("button").withExactText(translations.COMMON.CREATE));
			await t
				.expect(Selector("div").withText(translations.WALLETS.PAGE_CREATE_WALLET.NETWORK_STEP.SUBTITLE).exists)
				.ok();
		},
		"And selects a network": async (t: TestController) => {
			await t.typeText(Selector('[data-testid="SelectNetworkInput__input"]'), "ARK Devnet");
			await t.pressKey("enter");
			await t
				.expect(Selector("button").withText(translations.COMMON.CONTINUE).hasAttribute("disabled"))
				.notOk("Cryptoasset selected", { timeout: 5000 });
			await t.click(Selector("button").withExactText(translations.COMMON.CONTINUE));
		},
		"And sees the generated mnemonic": async (t: TestController) => {
			await t.expect(Selector("h1").withExactText(translations.COMMON.YOUR_PASSPHRASE).exists).ok();
		},
		"And chooses to encrypt the created wallet": async (t: TestController) => {
			await t.click(Selector('[data-testid="CreateWallet__encryption-toggle"]').parent());
		},
		"And confirms the generated mnemonic": async (t: TestController) => {
			const mnemonicsCount = await Selector("[data-testid=MnemonicList__item]").count;

			if (mnemonicWords.length) {
				mnemonicWords = [];
			}

			for (let index = 0; index <= mnemonicsCount - 1; index++) {
				const textContent = await Selector("[data-testid=MnemonicList__item]").nth(index).textContent;

				mnemonicWords.push(textContent.replace(/\d+/, "").trim());
			}
			await t.click(Selector("button").withExactText(translations.COMMON.CONTINUE));

			// Confirm your password
			await t.expect(Selector("button").withText(translations.COMMON.CONTINUE).hasAttribute("disabled")).ok();

			for (let index = 0; index < 3; index++) {
				const selectWordPhrase = await Selector("[data-testid=MnemonicVerificationOptions__title]").textContent;
				const wordNumber = selectWordPhrase.match(/\d+/)?.[0];
				await t.click(
					Selector("[data-testid=MnemonicVerificationOptions__button]").withText(
						new RegExp(`^${mnemonicWords[Number(wordNumber) - 1]}$`),
					),
				);
			}

			await t.hover(Selector("button").withExactText(translations.COMMON.CONTINUE));
			await t.click(Selector("button").withExactText(translations.COMMON.CONTINUE));
		},
		"And enters the encryption passwords": async (t: TestController) => {
			const passwordInputs = Selector("[data-testid=InputPassword]");

			await t.typeText(passwordInputs.nth(0), "S3cUrePa$sword", { paste: true });
			await t.typeText(passwordInputs.nth(1), "S3cUrePa$sword", { paste: true });

			await t.hover(Selector("button").withExactText(translations.COMMON.CONTINUE));
			await t.click(Selector("button").withExactText(translations.COMMON.CONTINUE));
		},
		"Then the new wallet is created": async (t: TestController) => {
			await t.expect(Selector("h1").withExactText(translations.COMMON.COMPLETED).exists).ok();

			// Save and finish
			await t.click(Selector("button").withExactText(translations.COMMON.GO_TO_WALLET));
			await t.expect(Selector("[data-testid=WalletHeader]").exists).ok();
		},
	},
	mocks,
);
