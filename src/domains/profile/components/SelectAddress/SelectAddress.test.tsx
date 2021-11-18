import { Contracts } from "@payvo/sdk-profiles";
import React from "react";
import { env, fireEvent, getDefaultProfileId, MNEMONICS, render, screen, waitFor } from "utils/testing-library";

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
		const { container } = render(<SelectAddress isInvalid wallets={wallets} profile={profile} />);

		expect(screen.getByTestId("Input__error")).toBeVisible();
		expect(container).toMatchSnapshot();
	});

	it("should render with preselected address", () => {
		const { container } = render(
			<SelectAddress
				wallets={wallets}
				wallet={{ address: wallet.address(), network: wallet.network() }}
				profile={profile}
			/>,
		);

		expect(screen.getByTestId("SelectAddress__input")).toHaveValue(wallet.address());

		expect(container).toMatchSnapshot();
	});

	it("should open and close wallets modal", async () => {
		render(
			<SelectAddress
				wallets={wallets}
				wallet={{ address: wallet.address(), network: wallet.network() }}
				profile={profile}
			/>,
		);

		expect(() => screen.getByTestId("modal__inner")).toThrow(/Unable to find an element by/);

		fireEvent.click(screen.getByTestId("SelectAddress__wrapper"));

		expect(screen.getByTestId("modal__inner")).toBeInTheDocument();

		fireEvent.click(screen.getByTestId("modal__close-btn"));

		await waitFor(() => {
			expect(() => screen.getByTestId("modal__inner")).toThrow(/Unable to find an element by/);
		});
	});

	it("should not open if disabled", () => {
		render(
			<SelectAddress
				wallets={wallets}
				wallet={{ address: wallet.address(), network: wallet.network() }}
				profile={profile}
				disabled={true}
			/>,
		);

		expect(() => screen.getByTestId("modal__inner")).toThrow(/Unable to find an element by/);

		fireEvent.click(screen.getByTestId("SelectAddress__wrapper"));

		expect(() => screen.getByTestId("modal__inner")).toThrow(/Unable to find an element by/);
	});

	it("should select address from wallets modal", async () => {
		render(
			<SelectAddress
				wallets={wallets}
				wallet={{ address: wallet.address(), network: wallet.network() }}
				profile={profile}
			/>,
		);

		expect(() => screen.getByTestId("modal__inner")).toThrow(/Unable to find an element by/);

		fireEvent.click(screen.getByTestId("SelectAddress__wrapper"));

		await waitFor(() => {
			expect(screen.getByTestId("modal__inner")).toBeInTheDocument();
		});

		const firstAddress = screen.getByTestId("SearchWalletListItem__select-0");

		fireEvent.click(firstAddress);

		await waitFor(() => {
			expect(() => screen.getByTestId("modal__inner")).toThrow(/Unable to find an element by/);

			const selectedAddressValue = wallets[0].address();

			expect(screen.getByTestId("SelectAddress__input")).toHaveValue(selectedAddressValue);
		});
	});

	it("should not open wallets modal if disabled", async () => {
		render(
			<SelectAddress
				wallets={wallets}
				disabled
				wallet={{ address: wallet.address(), network: wallet.network() }}
				profile={profile}
			/>,
		);

		expect(() => screen.getByTestId("modal__inner")).toThrow(/Unable to find an element by/);

		fireEvent.click(screen.getByTestId("SelectAddress__wrapper"));

		await waitFor(() => {
			expect(() => screen.getByTestId("modal__inner")).toThrow(/Unable to find an element by/);
		});
	});

	it("should call onChange prop if provided", async () => {
		const onChange = jest.fn();

		render(
			<SelectAddress
				wallets={wallets}
				onChange={onChange}
				wallet={{ address: wallet.address(), network: wallet.network() }}
				profile={profile}
			/>,
		);

		expect(() => screen.getByTestId("modal__inner")).toThrow(/Unable to find an element by/);

		fireEvent.click(screen.getByTestId("SelectAddress__wrapper"));

		await waitFor(() => {
			expect(screen.getByTestId("modal__inner")).toBeInTheDocument();
		});

		const firstAddress = screen.getByTestId("SearchWalletListItem__select-0");

		fireEvent.click(firstAddress);

		await waitFor(() => {
			expect(() => screen.getByTestId("modal__inner")).toThrow(/Unable to find an element by/);
		});

		expect(onChange).toHaveBeenCalledWith(wallets[0].address());
	});
});
