import userEvent from "@testing-library/user-event";
import { SelectFileStep } from "domains/profile/pages/ImportProfile/SelectFileStep";
import React from "react";
import { render, screen } from "utils/testing-library";

jest.mock("fs", () => ({
	readFileSync: jest.fn().mockReturnValue({ toString: () => "{test:'test'}" }),
	writeFileSync: jest.fn(),
}));

describe("Import Profile Select File Step", () => {
	it("should render with dwe fileFormat selected", () => {
		const { container } = render(<SelectFileStep fileFormat=".dwe" />);

		expect(container).toMatchSnapshot();
	});

	it("should render with json fileFormat selected", () => {
		const { container } = render(<SelectFileStep fileFormat=".json" />);

		expect(container).toMatchSnapshot();
	});

	it("should render file selection for dwe and switch to json", () => {
		const onFileFormatChange = jest.fn();

		const { container } = render(<SelectFileStep fileFormat=".dwe" onFileFormatChange={onFileFormatChange} />);

		userEvent.click(screen.getByTestId("SelectFileStep__change-file"));

		expect(onFileFormatChange).toHaveBeenCalledWith(".json");
		expect(container).toMatchSnapshot();
	});

	it("should handle back event", () => {
		const onBack = jest.fn();

		const { container } = render(<SelectFileStep fileFormat=".dwe" onBack={onBack} />);

		userEvent.click(screen.getByTestId("SelectFileStep__back"));

		expect(onBack).toHaveBeenCalledWith();
		expect(container).toMatchSnapshot();
	});

	it("should change back from json to dwe", () => {
		const onFileFormatChange = jest.fn();

		const { container } = render(<SelectFileStep fileFormat=".json" onFileFormatChange={onFileFormatChange} />);

		userEvent.click(screen.getByTestId("SelectFileStep__back"));

		expect(onFileFormatChange).toHaveBeenCalledWith(".dwe");
		expect(container).toMatchSnapshot();
	});
});
