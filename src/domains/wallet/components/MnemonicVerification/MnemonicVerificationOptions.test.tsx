import React from "react";
import { fireEvent, render, screen } from "utils/testing-library";

import { MnemonicVerificationOptions } from "./MnemonicVerificationOptions";

const options = ["a", "b", "c", "d"];
const answer = "b";
const limit = 2;

describe("MnemonicVerificationOptions", () => {
	it("should render options", () => {
		const handleChange = jest.fn();
		render(
			<MnemonicVerificationOptions
				handleChange={handleChange}
				options={options}
				answer={answer}
				limit={limit}
				position={1}
			/>,
		);
		const buttons = screen.getAllByTestId("MnemonicVerificationOptions__button");

		expect(buttons).toHaveLength(limit);
	});

	it("should call handle on click", () => {
		const handleChange = jest.fn();
		render(
			<MnemonicVerificationOptions
				handleChange={handleChange}
				options={options}
				answer={answer}
				limit={limit}
				position={1}
			/>,
		);
		fireEvent.click(screen.getByText(answer));

		expect(handleChange).toHaveBeenCalledWith(answer);
	});
});
