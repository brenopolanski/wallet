import userEvent from "@testing-library/user-event";
import React from "react";
import { fireEvent, render, screen } from "utils/testing-library";

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
		userEvent.click(wrongButton);

		expect(firstTab).toEqual(asFragment());

		const firstButton = getByText(mnemonicWords[wordPositions[0] - 1]);
		userEvent.click(firstButton);

		expect(firstTab).not.toEqual(asFragment());

		const secondButton = getByText(mnemonicWords[wordPositions[1] - 1]);
		userEvent.click(secondButton);

		const thirdButton = getByText(mnemonicWords[wordPositions[2] - 1]);
		userEvent.click(thirdButton);

		expect(handleComplete).toHaveBeenCalledWith();
	});

	it("should ask for random words", () => {
		const firstElement = render(
			<MnemonicVerification mnemonic={mnemonic} optionsLimit={limit} handleComplete={handleComplete} />,
		);
		const firstOptions = firstElement
			.getAllByTestId("MnemonicVerificationProgress__Tab")
			.map((element: any) => element.innerHTML);

		const secondElement = render(
			<MnemonicVerification mnemonic={mnemonic} optionsLimit={limit} handleComplete={handleComplete} />,
		);
		const secondOptions = secondElement
			.getAllByTestId("MnemonicVerificationProgress__Tab")
			.map((element: any) => element.innerHTML);

		expect(firstOptions).not.toEqual(secondOptions);
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
