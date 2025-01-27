import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { translations } from "domains/transaction/i18n";
import React from "react";
import { renderWithForm } from "utils/testing-library";

import { FeeWarning, FeeWarningVariant } from "./FeeWarning";

describe("FeeWarning", () => {
	it("should not render if not open", () => {
		const { asFragment } = renderWithForm(<FeeWarning isOpen={false} onCancel={jest.fn()} onConfirm={jest.fn()} />);

		expect(() => screen.getByTestId("modal__inner")).toThrow(/Unable to find an element by/);
		expect(asFragment()).toMatchSnapshot();
	});

	it.each([FeeWarningVariant.Low, FeeWarningVariant.High])(
		"should render a warning for a fee that is too %s",
		(variant) => {
			const { asFragment } = renderWithForm(
				<FeeWarning isOpen={true} variant={variant} onCancel={jest.fn()} onConfirm={jest.fn()} />,
			);

			expect(screen.getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_FEE_WARNING.TITLE);
			expect(screen.getByTestId("modal__inner")).toHaveTextContent(
				translations.MODAL_FEE_WARNING.DESCRIPTION[`TOO_${variant}`],
			);

			expect(asFragment()).toMatchSnapshot();
		},
	);

	it("should call onCancel callback when closing the modal", () => {
		const onCancel = jest.fn();

		renderWithForm(<FeeWarning isOpen={true} onCancel={onCancel} onConfirm={jest.fn()} />);

		userEvent.click(screen.getByTestId("modal__close-btn"));

		expect(onCancel).toHaveBeenCalledWith(true);
	});

	it("should call onCancel callback when clicking on cancel button", () => {
		const onCancel = jest.fn();

		renderWithForm(<FeeWarning isOpen={true} onCancel={onCancel} onConfirm={jest.fn()} />);

		userEvent.click(screen.getByTestId("FeeWarning__cancel-button"));

		expect(onCancel).toHaveBeenCalledWith(false);
	});

	it.each([true, false])(
		"should pass %s to onConfirm callback when clicking on continue button",
		(suppressWarning) => {
			const onConfirm = jest.fn();

			renderWithForm(<FeeWarning isOpen={true} onCancel={jest.fn()} onConfirm={onConfirm} />, {
				registerCallback: ({ register }) => {
					register("suppressWarning");
				},
			});

			if (suppressWarning) {
				userEvent.click(screen.getByTestId("FeeWarning__suppressWarning-toggle"));
			}

			userEvent.click(screen.getByTestId("FeeWarning__continue-button"));

			expect(onConfirm).toHaveBeenCalledWith(suppressWarning);
		},
	);
});
