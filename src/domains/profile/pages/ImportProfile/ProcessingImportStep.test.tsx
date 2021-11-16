import { Profile } from "@payvo/sdk-profiles";
import { ProcessingImport } from "domains/profile/pages/ImportProfile/ProcessingImportStep";
import fs from "fs";
import React from "react";
import { env, fireEvent, render, screen, waitFor } from "utils/testing-library";

let dwe: any;
let passwordProtectedDwe: any;
let json: any;
let jsonEmpty: any;

describe("Import Profile - Processing import", () => {
	beforeAll(() => {
		const jsonEmptyContent = fs.readFileSync("src/tests/fixtures/profile/import/d2_test_wallets-empty.json");
		const jsonContent = fs.readFileSync("src/tests/fixtures/profile/import/d2_test_wallets.json");
		const dweFileContents = fs.readFileSync("src/tests/fixtures/profile/import/profile.dwe");
		const passwordProtectedDweFileContents = fs.readFileSync(
			"src/tests/fixtures/profile/import/password-protected-profile.dwe",
		);

		dwe = { content: dweFileContents.toString(), extension: ".dwe", name: "profile.dwe" };
		passwordProtectedDwe = {
			content: passwordProtectedDweFileContents.toString(),
			extension: ".dwe",
			name: "export",
		};

		json = { content: jsonContent.toString(), extension: ".json", name: "export" };
		jsonEmpty = { content: jsonEmptyContent.toString(), extension: ".json", name: "export" };
	});

	it("should not run import process if file is not provided", () => {
		const { container } = render(<ProcessingImport env={env} />);

		expect(container).toMatchSnapshot();
	});

	it("should successfully import dwe profile", async () => {
		const onSuccess = jest.fn();
		const { container } = render(<ProcessingImport env={env} file={dwe} onSuccess={onSuccess} />);
		await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(expect.any(Profile)));

		expect(container).toMatchSnapshot();
	});

	it("should successfully import json profile", async () => {
		const onSuccess = jest.fn();
		const { container } = render(<ProcessingImport env={env} file={json} onSuccess={onSuccess} />);
		await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(expect.any(Profile)));

		expect(container).toMatchSnapshot();
	});

	it("should require password for password-protected profile import", async () => {
		const onPasswordChange = jest.fn();
		const { container, getByTestId, findByTestId } = render(
			<ProcessingImport env={env} file={passwordProtectedDwe} onPasswordChange={onPasswordChange} />,
		);
		await findByTestId("modal__inner");

		fireEvent.input(getByTestId("PasswordModal__input"), { target: { value: "S3cUrePa$sword" } });

		await findByTestId("PasswordModal__submit-button");

		fireEvent.click(getByTestId("PasswordModal__submit-button"));

		await waitFor(() => expect(onPasswordChange).toHaveBeenCalledWith("S3cUrePa$sword"));

		expect(container).toMatchSnapshot();
	});

	it("should call back when password modal is closed", async () => {
		const onBack = jest.fn();
		const { getByTestId, findByTestId } = render(
			<ProcessingImport env={env} file={passwordProtectedDwe} onBack={onBack} password="test" />,
		);
		await findByTestId("modal__inner");

		fireEvent.click(getByTestId("modal__close-btn"));

		await waitFor(() => expect(onBack).toHaveBeenCalledWith());
	});

	it("should handle invalid password", async () => {
		const onPasswordChange = jest.fn();
		const { container } = render(
			<ProcessingImport
				env={env}
				file={passwordProtectedDwe}
				onPasswordChange={onPasswordChange}
				password="test"
			/>,
		);
		await screen.findByTestId("modal__inner");

		fireEvent.input(screen.getByTestId("PasswordModal__input"), { target: { value: "invalid" } });

		await screen.findByTestId("PasswordModal__submit-button");

		fireEvent.click(screen.getByTestId("PasswordModal__submit-button"));

		await screen.findByTestId("modal__inner");
		await waitFor(() => expect(screen.getByTestId("PasswordModal__input")).toHaveValue("invalid"));
		await waitFor(() => expect(onPasswordChange).not.toHaveBeenCalledWith("testtest2"));

		expect(container).toMatchSnapshot();
	});

	it("should enter password again", async () => {
		const onPasswordChange = jest.fn();
		const { container, getByTestId, findByTestId } = render(
			<ProcessingImport
				env={env}
				file={passwordProtectedDwe}
				onPasswordChange={onPasswordChange}
				password="test"
				shouldRequestPassword
			/>,
		);
		await findByTestId("modal__inner");

		fireEvent.input(getByTestId("PasswordModal__input"), { target: { value: "invalid" } });

		await findByTestId("PasswordModal__submit-button");

		fireEvent.click(getByTestId("PasswordModal__submit-button"));

		await findByTestId("modal__inner");
		await waitFor(() => expect(onPasswordChange).not.toHaveBeenCalledWith("testtest2"));

		expect(container).toMatchSnapshot();
	});

	it("should show error if json import has an error", async () => {
		const onError = jest.fn();
		const { container } = render(<ProcessingImport env={env} file={jsonEmpty} onError={onError} password="test" />);

		await waitFor(() => expect(onError).toHaveBeenCalledWith("MissingWallets"));

		expect(container).toMatchSnapshot();
	});

	it("should handle import error", async () => {
		const onError = jest.fn();
		const { container } = render(
			<ProcessingImport
				env={env}
				file={{ content: "corrupted format", extension: ".dwe", name: "test.dwe" }}
				onError={onError}
				password="test"
			/>,
		);

		await waitFor(() =>
			expect(onError).toHaveBeenCalledWith(expect.stringMatching(/Failed to decode or decrypt the profile/)),
		);

		expect(container).toMatchSnapshot();
	});
});
