/* eslint-disable @typescript-eslint/require-await */
import userEvent from "@testing-library/user-event";
import React from "react";
import { renderWithForm, waitFor } from "utils/testing-library";

import { EncryptPasswordStep } from "./EncryptPasswordStep";

describe("EncryptPasswordStep", () => {
	it("should render", () => {
		const { getByTestId, asFragment } = renderWithForm(<EncryptPasswordStep />);

		expect(getByTestId("EncryptPassword")).toBeInTheDocument();
		expect(asFragment).toMatchSnapshot();
	});

	it("should change password", async () => {
		const { getAllByTestId, asFragment } = renderWithForm(<EncryptPasswordStep />);

		expect(getAllByTestId("InputPassword")).toHaveLength(2);

		const passwordField = getAllByTestId("InputPassword")[0];

		userEvent.paste(passwordField, "password");

		await waitFor(() => expect(passwordField).toHaveValue("password"));

		expect(asFragment).toMatchSnapshot();
	});

	it("should trigger password confirmation validation when password is entered", async () => {
		const { getAllByTestId, asFragment } = renderWithForm(<EncryptPasswordStep />, {
			defaultValues: { confirmEncryptionPassword: "password" },
		});

		expect(getAllByTestId("InputPassword")).toHaveLength(2);

		const passwordField = getAllByTestId("InputPassword")[0];
		const confirmPasswordField = getAllByTestId("InputPassword")[1];

		userEvent.paste(passwordField, "password");

		await waitFor(() => expect(passwordField).toHaveValue("password"));
		await waitFor(() => expect(confirmPasswordField).toHaveValue("password"));

		expect(asFragment).toMatchSnapshot();
	});
});
