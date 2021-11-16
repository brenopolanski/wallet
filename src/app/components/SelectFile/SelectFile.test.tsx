import userEvent from "@testing-library/user-event";
import { renderHook } from "@testing-library/react-hooks";
import electron from "electron";
import os from "os";
import React from "react";
import { useTranslation } from "react-i18next";
import { fireEvent, render, screen, waitFor } from "utils/testing-library";

import { SelectFile } from "./SelectFile";

jest.mock("fs", () => ({
	readFileSync: jest.fn().mockReturnValue({ toString: () => "{test:'test'}" }),
	writeFileSync: jest.fn(),
}));

describe("SelectFile", () => {
	let t: any;

	beforeAll(() => {
		const { result } = renderHook(() => useTranslation());
		t = result.current.t;
	});

	it("should render with dwe file format", () => {
		const { container } = render(<SelectFile fileFormat=".dwe" />);

		expect(container).toMatchSnapshot();
	});

	it("should render with json file format", () => {
		const { container } = render(<SelectFile fileFormat=".json" />);

		expect(container).toMatchSnapshot();
	});

	it("should open dialog to select file", async () => {
		//@ts-ignore
		const showOpenDialogMock = jest.spyOn(electron.remote.dialog, "showOpenDialog").mockImplementation(() => ({
			filePaths: ["filePath"],
		}));

		const onSelect = jest.fn();
		render(<SelectFile fileFormat=".json" onSelect={onSelect} />);

		userEvent.click(screen.getByTestId("SelectFile__browse-files"));

		expect(showOpenDialogMock).toHaveBeenCalledWith({
			defaultPath: os.homedir(),
			filters: [{ extensions: ["json"], name: "" }],
			properties: ["openFile"],
		});

		await waitFor(() =>
			expect(onSelect).toHaveBeenCalledWith({
				content: expect.any(Buffer),
				extension: expect.any(String),
				name: expect.any(String),
			}),
		);

		showOpenDialogMock.mockRestore();
	});

	it("should change background when dragging over drop zone", async () => {
		render(<SelectFile fileFormat=".json" />);

		expect(screen.getByTestId("SelectFile__drop-zone")).toHaveClass(
			"bg-theme-primary-50 dark:bg-theme-secondary-800",
		);

		fireEvent.dragEnter(screen.getByTestId("SelectFile__drop-zone"), {
			dataTransfer: {
				files: [{ name: "sample-export.json", path: "path/to/sample-export.json" }],
			},
		});

		await waitFor(() =>
			expect(screen.getByTestId("SelectFile__drop-zone")).toHaveClass("bg-theme-primary-100 dark:bg-black"),
		);

		fireEvent.dragLeave(screen.getByTestId("SelectFile__drop-zone"), {
			dataTransfer: {
				files: [{ name: "sample-export.json", path: "path/to/sample-export.json" }],
			},
		});
	});

	it("should handle file drop", async () => {
		//@ts-ignore
		const onSelect = jest.fn();
		render(<SelectFile fileFormat=".json" onSelect={onSelect} />);

		fireEvent.dragOver(screen.getByTestId("SelectFile__browse-files"), {
			dataTransfer: {
				files: [{ name: "sample-export.json", path: "path/to/sample-export.json" }],
			},
		});

		fireEvent.dragEnter(screen.getByTestId("SelectFile__browse-files"), {
			dataTransfer: {
				files: [{ name: "sample-export.json", path: "path/to/sample-export.json" }],
			},
		});

		fireEvent.drop(screen.getByTestId("SelectFile__browse-files"), {
			dataTransfer: {
				files: [{ name: "sample-export.json", path: "path/to/sample-export.json" }],
			},
		});

		await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1));
	});

	it("should show error if the dropped file has wrong type", () => {
		const fileFormat = ".json";

		const { container } = render(<SelectFile fileFormat={fileFormat} />);

		fireEvent.drop(screen.getByTestId("SelectFile__browse-files"), {
			dataTransfer: {
				files: [{ name: "sample-export.dwe", path: "path/to/sample-export.dwe" }],
			},
		});

		const errorHtml = t("PROFILE.IMPORT.SELECT_FILE_STEP.ERRORS.NOT_SUPPORTED", { fileFormat });

		expect(container).toContainHTML(errorHtml);

		userEvent.click(screen.getByRole("button"));

		expect(container).not.toContainHTML(errorHtml);
	});

	it("should show error if multiple files are dropped", () => {
		const { container } = render(<SelectFile fileFormat=".json" />);

		fireEvent.drop(screen.getByTestId("SelectFile__browse-files"), {
			dataTransfer: {
				files: [
					{ name: "sample-export-1.json", path: "path/to/sample-export-1.json" },
					{ name: "sample-export-2.json", path: "path/to/sample-export-2.json" },
				],
			},
		});

		const errorHtml = t("PROFILE.IMPORT.SELECT_FILE_STEP.ERRORS.TOO_MANY", { fileCount: 2 });

		expect(container).toContainHTML(errorHtml);

		userEvent.click(screen.getByRole("button"));

		expect(container).not.toContainHTML(errorHtml);
	});
});
