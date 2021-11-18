/* eslint-disable @typescript-eslint/require-await */
import React from "react";
import { fireEvent, render, screen, waitFor } from "utils/testing-library";

import { PasswordModal } from "./PasswordModal";

describe("PasswordModal", () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterAll(() => {
		jest.useRealTimers();
	});

	it("should not render if not open", () => {
		const { asFragment } = render(<PasswordModal isOpen={false} />);

		expect(() => screen.getByTestId("modal__inner")).toThrow(/Unable to find an element by/);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render with title and description", async () => {
		const { asFragment } = render(
			<PasswordModal isOpen={true} title="Password title" description="Password description" />,
		);

		expect(screen.getByTestId("modal__inner")).toHaveTextContent("Password title");
		expect(screen.getByTestId("modal__inner")).toHaveTextContent("Password description");
		expect(asFragment()).toMatchSnapshot();
	});

	it("should submit", async () => {
		const onSuccess = jest.fn();

		render(<PasswordModal isOpen={true} onSubmit={onSuccess} />);

		fireEvent.input(screen.getByTestId("PasswordModal__input"), { target: { value: "password" } });

		// wait for formState.isValid to be updated
		await screen.findByTestId("PasswordModal__submit-button");

		fireEvent.click(screen.getByTestId("PasswordModal__submit-button"));

		await waitFor(() => {
			expect(onSuccess).toHaveBeenCalledWith("password");
		});
	});
});
