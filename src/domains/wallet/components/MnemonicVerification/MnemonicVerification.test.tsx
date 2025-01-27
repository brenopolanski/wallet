import React from "react";
import { cleanup, fireEvent, render, screen } from "utils/testing-library";

import { MnemonicVerification } from "./MnemonicVerification";

const mnemonic = "ark btc usd bnb eth ltc";
const mnemonicWords = mnemonic.split(" ");
const limit = 6;
const handleComplete = jest.fn();

describe("MnemonicVerification", () => {
	it("should render", () => {
		const wordPositions = [1, 2, 3];

		render(
			<MnemonicVerification
				mnemonic={mnemonic}
				optionsLimit={limit}
				wordPositions={wordPositions}
				handleComplete={handleComplete}
			/>,
		);

		expect(screen.getAllByTestId("MnemonicVerificationOptions__button")).toHaveLength(mnemonic.split(" ").length);
	});

	it("should render with special delimiter", () => {
		const mnemonic = "てまきずし　くわしい　うけもつ　ないす　にっけい　おつり";

		const wordPositions = [1, 2, 3];

		render(
			<MnemonicVerification
				mnemonic={mnemonic}
				optionsLimit={limit}
				wordPositions={wordPositions}
				handleComplete={handleComplete}
			/>,
		);

		expect(screen.getAllByTestId("MnemonicVerificationOptions__button")).toHaveLength(
			mnemonic.split("\u3000").length,
		);
	});

	it("should verify mnemonic", () => {
		const wordPositions = [1, 2, 3];

		const { asFragment, getByText } = render(
			<MnemonicVerification
				mnemonic={mnemonic}
				optionsLimit={limit}
				wordPositions={wordPositions}
				handleComplete={handleComplete}
			/>,
		);

		const firstTab = asFragment();
		const wrongButton = getByText(mnemonicWords[4]);
		fireEvent.click(wrongButton);

		expect(firstTab).toStrictEqual(asFragment());

		const firstButton = getByText(mnemonicWords[wordPositions[0] - 1]);
		fireEvent.click(firstButton);

		expect(firstTab).not.toStrictEqual(asFragment());

		const secondButton = getByText(mnemonicWords[wordPositions[1] - 1]);
		fireEvent.click(secondButton);

		const thirdButton = getByText(mnemonicWords[wordPositions[2] - 1]);
		fireEvent.click(thirdButton);

		expect(handleComplete).toHaveBeenCalledWith();
	});

	it("should ask for random words", () => {
		render(<MnemonicVerification mnemonic={mnemonic} optionsLimit={limit} handleComplete={handleComplete} />);

		const firstOptions = screen
			.getAllByTestId("MnemonicVerificationProgress__Tab")
			.map((element: any) => element.innerHTML);

		cleanup();

		render(<MnemonicVerification mnemonic={mnemonic} optionsLimit={limit} handleComplete={handleComplete} />);

		const secondOptions = screen
			.getAllByTestId("MnemonicVerificationProgress__Tab")
			.map((element: any) => element.innerHTML);

		expect(firstOptions).not.toStrictEqual(secondOptions);
	});

	it("should ask for unique words", () => {
		let wordCounter = 0;

		// @ts-ignore
		const arrayIncludesSpy = jest.spyOn(Array.prototype, "includes").mockImplementation(function () {
			if (wordCounter === 3) {
				return false;
			}

			wordCounter++;

			return true;
		});

		render(<MnemonicVerification mnemonic={mnemonic} optionsLimit={limit} handleComplete={handleComplete} />);

		expect(arrayIncludesSpy).toHaveBeenCalledTimes(6);

		arrayIncludesSpy.mockRestore();
	});
});
