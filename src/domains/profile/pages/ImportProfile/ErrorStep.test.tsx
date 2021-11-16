import userEvent from "@testing-library/user-event";
import { ImportError } from "domains/profile/pages/ImportProfile/ErrorStep";
import React from "react";
import { fireEvent, render } from "utils/testing-library";

jest.mock("fs", () => ({
	readFileSync: jest.fn().mockReturnValue({ toString: () => "{test:'test'}" }),
	writeFileSync: jest.fn(),
}));

describe("Import Profile - Error Step", () => {
	const file = { content: "dfdf", extension: ".dwe", name: "filename" };

	it("should render", () => {
		const { container } = render(<ImportError file={file} />);

		expect(container).toMatchSnapshot();
	});

	it("should emit back event", () => {
		const onBack = jest.fn();
		const { getByTestId } = render(<ImportError file={file} onBack={onBack} />);
		userEvent.click(getByTestId("ImportError__back"));

		expect(onBack).toHaveBeenCalledWith(expect.objectContaining({ nativeEvent: expect.any(MouseEvent) }));
	});

	it("should emit retry event", () => {
		const onRetry = jest.fn();
		const { getByTestId } = render(<ImportError file={file} onRetry={onRetry} />);
		userEvent.click(getByTestId("ImportError__retry"));

		expect(onRetry).toHaveBeenCalledWith(expect.objectContaining({ nativeEvent: expect.any(MouseEvent) }));
	});
});
