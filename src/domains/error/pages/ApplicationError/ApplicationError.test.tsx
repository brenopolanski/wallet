import userEvent from "@testing-library/user-event";
import { translations } from "domains/error/i18n";
import React from "react";
import { fireEvent, render } from "utils/testing-library";

import { ApplicationError } from "./ApplicationError";

describe("ApplicationError", () => {
	it("should render", () => {
		const onResetErrorBoundary = jest.fn();
		const { asFragment, container, getByTestId } = render(
			<ApplicationError resetErrorBoundary={onResetErrorBoundary} />,
		);

		expect(container).toBeInTheDocument();
		expect(getByTestId("ApplicationError__text")).toHaveTextContent(translations.APPLICATION.TITLE);
		expect(getByTestId("ApplicationError__text")).toHaveTextContent(translations.APPLICATION.DESCRIPTION);

		userEvent.click(getByTestId("ApplicationError__button--reload"));

		expect(onResetErrorBoundary).toHaveBeenCalledWith(
			expect.objectContaining({ nativeEvent: expect.any(MouseEvent) }),
		);
		expect(asFragment()).toMatchSnapshot();
	});
});
