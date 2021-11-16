/* eslint-disable @typescript-eslint/require-await */
import userEvent from "@testing-library/user-event";
import React from "react";
import { fireEvent, render, waitFor } from "utils/testing-library";

import { PasswordModal } from "./PasswordModal";

describe("PasswordModal", () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterAll(() => {
		jest.useRealTimers();
	});

	it("should not render if not open", () => {
		const { asFragment, getByTestId } = render(<PasswordModal isOpen={false} />);

		expect(() => getByTestId("modal__inner")).toThrow(/Unable to find an element by/);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render with title and description", async () => {
		const { asFragment, getByTestId } = render(
			<PasswordModal isOpen={true} title="Password title" description="Password description" />,
		);

		expect(getByTestId("modal__inner")).toHaveTextContent("Password title");
		expect(getByTestId("modal__inner")).toHaveTextContent("Password description");
		expect(asFragment()).toMatchSnapshot();
	});

	it("should submit", async () => {
		const onSuccess = jest.fn();

		const { findByTestId, getByTestId } = render(<PasswordModal isOpen={true} onSubmit={onSuccess} />);

		fireEvent.input(getByTestId("PasswordModal__input"), { target: { value: "password" } });

		// wait for formState.isValid to be updated
		await findByTestId("PasswordModal__submit-button");

		userEvent.click(getByTestId("PasswordModal__submit-button"));

		await waitFor(() => {
			expect(onSuccess).toHaveBeenCalledWith("password");
		});
	});
});
