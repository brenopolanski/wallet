import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { buildTranslations } from "app/i18n/helpers";
import React from "react";
import { render } from "utils/testing-library";

import { PasswordRemovalConfirmModal } from "./PasswordRemovalConfirmModal";

const translations = buildTranslations();

describe("PasswordRemovalConfirmModal", () => {
	it("should render", async () => {
		const { asFragment } = render(<PasswordRemovalConfirmModal onCancel={jest.fn()} onConfirm={jest.fn()} />);

		await screen.findByText(translations.SETTINGS.PASSWORD.REMOVAL.PROFILE_PASSWORD);

		expect(asFragment()).toMatchSnapshot();
	});

	it("should call onCancel when closed", async () => {
		const onCancel = jest.fn();

		render(<PasswordRemovalConfirmModal onCancel={onCancel} onConfirm={jest.fn()} />);

		await screen.findByText(translations.SETTINGS.PASSWORD.REMOVAL.PROFILE_PASSWORD);

		userEvent.click(screen.getByTestId("PasswordRemovalConfirmModal__cancel"));

		expect(onCancel).toHaveBeenCalledWith(expect.objectContaining({ nativeEvent: expect.any(MouseEvent) }));
	});

	it("should call onConfirm when submitted", async () => {
		const onConfirm = jest.fn();

		render(<PasswordRemovalConfirmModal onCancel={jest.fn()} onConfirm={onConfirm} />);

		await screen.findByText(translations.SETTINGS.PASSWORD.REMOVAL.PROFILE_PASSWORD);

		expect(screen.getByTestId("PasswordRemovalConfirmModal__confirm")).toBeDisabled();

		userEvent.paste(screen.getByTestId("PasswordRemovalConfirmModal__input-password"), "password");

		await waitFor(() => expect(screen.getByTestId("PasswordRemovalConfirmModal__confirm")).not.toBeDisabled());

		userEvent.click(screen.getByTestId("PasswordRemovalConfirmModal__confirm"));

		await waitFor(() => expect(onConfirm).toHaveBeenCalledWith("password"));
	});
});
