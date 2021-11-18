/* eslint-disable @typescript-eslint/require-await */
import { EnvironmentProvider } from "app/contexts";
import { ImportProfile } from "domains/profile/pages/ImportProfile/ImportProfile";
import fs from "fs";
import { createMemoryHistory } from "history";
import React from "react";
import { env, fireEvent, render, screen, waitFor } from "utils/testing-library";

const passwordProtectedDwe = fs.readFileSync("src/tests/fixtures/profile/import/password-protected-profile.dwe");
const corruptedDwe = fs.readFileSync("src/tests/fixtures/profile/import/corrupted-profile.dwe");
const legacyJson = fs.readFileSync("src/tests/fixtures/profile/import/legacy-profile.json");
const darkThemeDwe = fs.readFileSync("src/tests/fixtures/profile/import/profile-dark-theme.dwe");
const lightThemeDwe = fs.readFileSync("src/tests/fixtures/profile/import/profile-light-theme.dwe");
const history = createMemoryHistory();

describe("ImportProfile", () => {
	let consoleSpy: jest.SpyInstance;
	let fsMock: jest.SpyInstance;

	beforeAll(() => {
		consoleSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);
		fsMock = jest.spyOn(fs, "readFileSync").mockReturnValue(passwordProtectedDwe);
	});

	afterAll(() => {
		consoleSpy.mockRestore();
		fsMock.mockRestore();
	});

	it("should render first step", async () => {
		const history = createMemoryHistory();
		history.push("/profiles/import");

		const { container } = render(
			<EnvironmentProvider env={env}>
				<ImportProfile />
			</EnvironmentProvider>,
		);

		expect(screen.getByTestId("SelectFileStep__change-file")).toBeInTheDocument();

		expect(container).toMatchSnapshot();
	});

	it("should go back", async () => {
		history.push("/profiles/import");
		const historyMock = jest.spyOn(history, "push").mockReturnValue();

		render(
			<EnvironmentProvider env={env}>
				<ImportProfile />
			</EnvironmentProvider>,
			{ history },
		);

		expect(screen.getByTestId("SelectFileStep__change-file")).toBeInTheDocument();
		expect(screen.getByTestId("SelectFileStep__back")).toBeInTheDocument();

		fireEvent.click(screen.getByTestId("SelectFileStep__back"));

		await waitFor(() => expect(historyMock).toHaveBeenCalledWith("/"));
		historyMock.mockRestore();
	});

	it("should change file format", async () => {
		history.push("/profiles/import");

		render(
			<EnvironmentProvider env={env}>
				<ImportProfile />
			</EnvironmentProvider>,
			{ history },
		);

		expect(screen.getByTestId("SelectFileStep__change-file")).toBeInTheDocument();

		fireEvent.click(screen.getByTestId("SelectFileStep__change-file"));

		await waitFor(() =>
			expect(() => screen.getByTestId("SelectFileStep__change-file")).toThrow(/Unable to find an element by/),
		);
	});

	it("should select file and go to step 2", async () => {
		history.push("/profiles/import");

		render(
			<EnvironmentProvider env={env}>
				<ImportProfile />
			</EnvironmentProvider>,
			{ history },
		);

		expect(screen.getByTestId("SelectFileStep__change-file")).toBeInTheDocument();
		expect(screen.getByTestId("SelectFileStep__back")).toBeInTheDocument();

		fireEvent.drop(screen.getByTestId("SelectFile__browse-files"), {
			dataTransfer: {
				files: [{ name: "profile-export.dwe", path: "path/to/sample-export.dwe" }],
			},
		});

		await screen.findByTestId("ProcessingImport");
	});

	it("should request and set password for importing password protected profile", async () => {
		history.push("/profiles/import");

		render(
			<EnvironmentProvider env={env}>
				<ImportProfile />
			</EnvironmentProvider>,
			{ history },
		);

		expect(screen.getByTestId("SelectFileStep__change-file")).toBeInTheDocument();
		expect(screen.getByTestId("SelectFileStep__back")).toBeInTheDocument();

		fireEvent.drop(screen.getByTestId("SelectFile__browse-files"), {
			dataTransfer: {
				files: [{ name: "profile-export.dwe", path: "path/to/sample-export.dwe" }],
			},
		});

		await screen.findByTestId("ProcessingImport");
		await screen.findByTestId("modal__inner");

		fireEvent.input(screen.getByTestId("PasswordModal__input"), { target: { value: "S3cUrePa$sword" } });

		// wait for formState.isValid to be updated
		await screen.findByTestId("PasswordModal__submit-button");

		fireEvent.click(screen.getByTestId("PasswordModal__submit-button"));

		await screen.findByTestId("ProcessingImport");
	});

	it("should close password modal and go back to select file", async () => {
		history.push("/profiles/import");

		render(
			<EnvironmentProvider env={env}>
				<ImportProfile />
			</EnvironmentProvider>,
			{ history },
		);

		expect(screen.getByTestId("SelectFileStep__change-file")).toBeInTheDocument();
		expect(screen.getByTestId("SelectFileStep__back")).toBeInTheDocument();

		fireEvent.drop(screen.getByTestId("SelectFile__browse-files"), {
			dataTransfer: {
				files: [{ name: "profile-export.dwe", path: "path/to/sample-export.dwe" }],
			},
		});

		await screen.findByTestId("ProcessingImport");
		await screen.findByTestId("modal__inner");

		fireEvent.click(screen.getByTestId("modal__close-btn"));

		await screen.findByTestId("SelectFileStep__change-file");
	});

	it("should successfully import profile and return to home screen", async () => {
		history.push("/profiles/import");
		const historyMock = jest.spyOn(history, "push").mockReturnValue();
		jest.spyOn(fs, "readFileSync").mockReturnValue(passwordProtectedDwe);

		render(
			<EnvironmentProvider env={env}>
				<ImportProfile />
			</EnvironmentProvider>,
			{ history },
		);

		expect(screen.getByTestId("SelectFileStep__change-file")).toBeInTheDocument();
		expect(screen.getByTestId("SelectFileStep__back")).toBeInTheDocument();

		fireEvent.drop(screen.getByTestId("SelectFile__browse-files"), {
			dataTransfer: {
				files: [{ name: "profile.dwe", path: "path/to/sample-export.dwe" }],
			},
		});

		await screen.findByTestId("ProcessingImport");
		await screen.findByTestId("modal__inner");

		fireEvent.input(screen.getByTestId("PasswordModal__input"), { target: { value: "S3cUrePa$sword" } });
		await waitFor(() => expect(screen.getByTestId("PasswordModal__input")).toHaveValue("S3cUrePa$sword"));

		fireEvent.click(screen.getByTestId("PasswordModal__submit-button"));

		await screen.findByTestId("ProcessingImport");
		await screen.findByTestId("CreateProfile__form");

		expect(() => screen.getByTestId("InputPassword")).toThrow(/Unable to find an element by/);

		fireEvent.click(screen.getByTestId("CreateProfile__submit-button"));

		await waitFor(() => expect(historyMock).toHaveBeenCalledWith("/"));
	});

	it("should successfully import legacy profile and return to home screen", async () => {
		history.push("/profiles/import");
		const historyMock = jest.spyOn(history, "push").mockReturnValue();
		jest.spyOn(fs, "readFileSync").mockReturnValueOnce(legacyJson);

		render(
			<EnvironmentProvider env={env}>
				<ImportProfile />
			</EnvironmentProvider>,
			{ history },
		);

		expect(screen.getByTestId("SelectFileStep__change-file")).toBeInTheDocument();
		expect(screen.getByTestId("SelectFileStep__back")).toBeInTheDocument();

		fireEvent.click(screen.getByTestId("SelectFileStep__change-file"));

		fireEvent.drop(screen.getByTestId("SelectFile__browse-files"), {
			dataTransfer: {
				files: [{ name: "legacy-profile.json", path: "path/to/legacy-profile.json" }],
			},
		});

		await screen.findByTestId("ProcessingImport");
		await screen.findByTestId("CreateProfile__form");

		fireEvent.input(screen.getAllByTestId("Input")[0], { target: { value: "legacy profile" } });
		await waitFor(() => expect(screen.getAllByTestId("Input")[0]).toHaveValue("legacy profile"));

		fireEvent.click(screen.getByTestId("CreateProfile__submit-button"));

		await waitFor(() => expect(historyMock).toHaveBeenCalledWith("/"));
	});

	it.each([
		["dark", darkThemeDwe],
		["light", lightThemeDwe],
	])("should apply theme setting of imported profile regardless of OS preferences", async (theme, dweFile) => {
		history.push("/profiles/import");

		jest.spyOn(fs, "readFileSync").mockReturnValueOnce(dweFile);

		const { asFragment } = render(
			<EnvironmentProvider env={env}>
				<ImportProfile />
			</EnvironmentProvider>,
			{ history },
		);

		expect(screen.getByTestId("SelectFileStep__change-file")).toBeInTheDocument();
		expect(screen.getByTestId("SelectFileStep__back")).toBeInTheDocument();

		fireEvent.drop(screen.getByTestId("SelectFile__browse-files"), {
			dataTransfer: {
				files: [{ name: "profile.dwe", path: "path/to/sample-export.dwe" }],
			},
		});

		await screen.findByTestId("ProcessingImport");

		expect(screen.getByRole("checkbox")).toHaveAttribute("name", "isDarkMode");

		if (theme === "dark") {
			expect(screen.getByRole("checkbox")).toBeChecked();
		} else {
			expect(screen.getByRole("checkbox")).not.toBeChecked();
		}

		expect(asFragment()).toMatchSnapshot();
	});

	it("should go to step 3 and back", async () => {
		history.push("/profiles/import");

		render(
			<EnvironmentProvider env={env}>
				<ImportProfile />
			</EnvironmentProvider>,
			{ history },
		);

		expect(screen.getByTestId("SelectFileStep__change-file")).toBeInTheDocument();
		expect(screen.getByTestId("SelectFileStep__back")).toBeInTheDocument();

		fireEvent.drop(screen.getByTestId("SelectFile__browse-files"), {
			dataTransfer: {
				files: [{ name: "profile.dwe", path: "path/to/sample-export.dwe" }],
			},
		});

		await screen.findByTestId("ProcessingImport");
		await screen.findByTestId("modal__inner");

		fireEvent.input(screen.getByTestId("PasswordModal__input"), { target: { value: "S3cUrePa$sword" } });

		await waitFor(() => {
			expect(screen.getByTestId("PasswordModal__input")).toHaveValue("S3cUrePa$sword");
		});

		fireEvent.click(screen.getByTestId("PasswordModal__submit-button"));

		await screen.findByTestId("ProcessingImport");
		await screen.findByTestId("CreateProfile__form");

		fireEvent.click(screen.getByTestId("CreateProfile__back-button"));

		await screen.findByTestId("SelectFileStep__change-file");
	});

	it("should fail profile import and show error step", async () => {
		history.push("/profiles/import");
		const corruptedDweMock = jest.spyOn(fs, "readFileSync").mockReturnValue(corruptedDwe);

		render(
			<EnvironmentProvider env={env}>
				<ImportProfile />
			</EnvironmentProvider>,
			{ history },
		);

		expect(screen.getByTestId("SelectFileStep__change-file")).toBeInTheDocument();
		expect(screen.getByTestId("SelectFileStep__back")).toBeInTheDocument();

		fireEvent.drop(screen.getByTestId("SelectFile__browse-files"), {
			dataTransfer: {
				files: [{ name: "profile-export.dwe", path: "path/to/sample-export.dwe" }],
			},
		});

		await screen.findByTestId("ProcessingImport");
		await screen.findByTestId("modal__inner");

		fireEvent.input(screen.getByTestId("PasswordModal__input"), { target: { value: "wrong password" } });

		await waitFor(() => {
			expect(screen.getByTestId("PasswordModal__input")).toHaveValue("wrong password");
		});

		fireEvent.click(screen.getByTestId("PasswordModal__submit-button"));

		await screen.findByTestId("ImportError");

		corruptedDweMock.mockRestore();
	});

	it("should fail profile import and retry", async () => {
		history.push("/profiles/import");
		const corruptedDweMock = jest.spyOn(fs, "readFileSync").mockReturnValue(corruptedDwe);

		render(
			<EnvironmentProvider env={env}>
				<ImportProfile />
			</EnvironmentProvider>,
			{ history },
		);

		expect(screen.getByTestId("SelectFileStep__change-file")).toBeInTheDocument();
		expect(screen.getByTestId("SelectFileStep__back")).toBeInTheDocument();

		fireEvent.drop(screen.getByTestId("SelectFile__browse-files"), {
			dataTransfer: {
				files: [{ name: "profile.dwe", path: "path/to/sample-export.dwe" }],
			},
		});

		await screen.findByTestId("ProcessingImport");
		await screen.findByTestId("modal__inner");

		fireEvent.input(screen.getByTestId("PasswordModal__input"), { target: { value: "wrong password" } });

		await waitFor(() => {
			expect(screen.getByTestId("PasswordModal__input")).toHaveValue("wrong password");
		});

		fireEvent.click(screen.getByTestId("PasswordModal__submit-button"));

		await screen.findByTestId("ImportError");

		fireEvent.click(screen.getByTestId("ImportError__retry"));

		await screen.findByTestId("ImportError");
		corruptedDweMock.mockRestore();
	});

	it("should fail profile import and go back to home screen", async () => {
		history.push("/profiles/import");
		const corruptedDweMock = jest.spyOn(fs, "readFileSync").mockReturnValue(corruptedDwe);
		const historyMock = jest.spyOn(history, "push").mockReturnValue();

		render(
			<EnvironmentProvider env={env}>
				<ImportProfile />
			</EnvironmentProvider>,
			{ history },
		);

		expect(screen.getByTestId("SelectFileStep__change-file")).toBeInTheDocument();
		expect(screen.getByTestId("SelectFileStep__back")).toBeInTheDocument();

		fireEvent.drop(screen.getByTestId("SelectFile__browse-files"), {
			dataTransfer: {
				files: [{ name: "profile-export.dwe", path: "path/to/sample-export.dwe" }],
			},
		});

		await screen.findByTestId("ProcessingImport");
		await screen.findByTestId("modal__inner");

		fireEvent.input(screen.getByTestId("PasswordModal__input"), { target: { value: "wrong password" } });

		await waitFor(() => {
			expect(screen.getByTestId("PasswordModal__input")).toHaveValue("wrong password");
		});

		fireEvent.click(screen.getByTestId("PasswordModal__submit-button"));

		await screen.findByTestId("ImportError");

		fireEvent.click(screen.getByTestId("ImportError__back"));

		await screen.findByTestId("ImportError");
		await waitFor(() => expect(historyMock).toHaveBeenCalledWith("/"));

		historyMock.mockRestore();
		corruptedDweMock.mockRestore();
	});
});
