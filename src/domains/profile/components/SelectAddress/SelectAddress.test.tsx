import { Contracts } from "@payvo/profiles";
import userEvent from "@testing-library/user-event";
import React from "react";
import { env, getDefaultProfileId, MNEMONICS, render, waitFor } from "utils/testing-library";

import { SelectAddress } from "./SelectAddress";

let profile: Contracts.IProfile;
let wallet: Contracts.IReadWriteWallet;
let wallets: Contracts.IReadWriteWallet[];

describe("SelectAddress", () => {
	beforeAll(async () => {
		profile = env.profiles().findById(getDefaultProfileId());

		wallet = await profile.walletFactory().fromMnemonicWithBIP39({
			coin: "ARK",
			mnemonic: MNEMONICS[0],
			network: "ark.devnet",
		});

		profile.wallets().push(wallet);
		wallets = profile.wallets().values();
	});

	it("should render empty", () => {
		const { container } = render(<SelectAddress wallets={wallets} profile={profile} />);

		expect(container).toMatchSnapshot();
	});

	it("should render disabled", () => {
		const { container } = render(<SelectAddress disabled wallets={wallets} profile={profile} />);

		expect(container).toMatchSnapshot();
	});

	it("should render invalid", () => {
		const { container, getByTestId } = render(<SelectAddress isInvalid wallets={wallets} profile={profile} />);

		expect(getByTestId("Input__error")).toBeVisible();
		expect(container).toMatchSnapshot();
	});

	it("should render with preselected address", () => {
		const { container, getByTestId } = render(
			<SelectAddress
				wallets={wallets}
				wallet={{ address: wallet.address(), network: wallet.network() }}
				profile={profile}
			/>,
		);

		expect(getByTestId("SelectAddress__input")).toHaveValue(wallet.address());

		expect(container).toMatchSnapshot();
	});

	it("should open and close wallets modal", async () => {
		const { getByTestId } = render(
			<SelectAddress
				wallets={wallets}
				wallet={{ address: wallet.address(), network: wallet.network() }}
				profile={profile}
			/>,
		);

		expect(() => getByTestId("modal__inner")).toThrow(/Unable to find an element by/);

		userEvent.click(getByTestId("SelectAddress__wrapper"));

		expect(getByTestId("modal__inner")).toBeInTheDocument();

		userEvent.click(getByTestId("modal__close-btn"));

		await waitFor(() => {
			expect(() => getByTestId("modal__inner")).toThrow(/Unable to find an element by/);
		});
	});

	it("should not open if disabled", () => {
		const { getByTestId } = render(
			<SelectAddress
				wallets={wallets}
				wallet={{ address: wallet.address(), network: wallet.network() }}
				profile={profile}
				disabled={true}
			/>,
		);

		expect(() => getByTestId("modal__inner")).toThrow(/Unable to find an element by/);

		userEvent.click(getByTestId("SelectAddress__wrapper"));

		expect(() => getByTestId("modal__inner")).toThrow(/Unable to find an element by/);
	});

	it("should select address from wallets modal", async () => {
		const { getByTestId } = render(
			<SelectAddress
				wallets={wallets}
				wallet={{ address: wallet.address(), network: wallet.network() }}
				profile={profile}
			/>,
		);

		expect(() => getByTestId("modal__inner")).toThrow(/Unable to find an element by/);

		userEvent.click(getByTestId("SelectAddress__wrapper"));

		await waitFor(() => {
			expect(getByTestId("modal__inner")).toBeInTheDocument();
		});

		const firstAddress = getByTestId("SearchWalletListItem__select-0");

		userEvent.click(firstAddress);

		await waitFor(() => {
			expect(() => getByTestId("modal__inner")).toThrow(/Unable to find an element by/);

			const selectedAddressValue = wallets[0].address();

			expect(getByTestId("SelectAddress__input")).toHaveValue(selectedAddressValue);
		});
	});

	it("should not open wallets modal if disabled", async () => {
		const { getByTestId } = render(
			<SelectAddress
				wallets={wallets}
				disabled
				wallet={{ address: wallet.address(), network: wallet.network() }}
				profile={profile}
			/>,
		);

		expect(() => getByTestId("modal__inner")).toThrow(/Unable to find an element by/);

		userEvent.click(getByTestId("SelectAddress__wrapper"));

		await waitFor(() => {
			expect(() => getByTestId("modal__inner")).toThrow(/Unable to find an element by/);
		});
	});

	it("should call onChange prop if provided", async () => {
		const onChange = jest.fn();

		const { getByTestId } = render(
			<SelectAddress
				wallets={wallets}
				onChange={onChange}
				wallet={{ address: wallet.address(), network: wallet.network() }}
				profile={profile}
			/>,
		);

		expect(() => getByTestId("modal__inner")).toThrow(/Unable to find an element by/);

		userEvent.click(getByTestId("SelectAddress__wrapper"));

		await waitFor(() => {
			expect(getByTestId("modal__inner")).toBeInTheDocument();
		});

		const firstAddress = getByTestId("SearchWalletListItem__select-0");

		userEvent.click(firstAddress);

		await waitFor(() => {
			expect(() => getByTestId("modal__inner")).toThrow(/Unable to find an element by/);
		});

		expect(onChange).toHaveBeenCalledWith(wallets[0].address());
	});
});
