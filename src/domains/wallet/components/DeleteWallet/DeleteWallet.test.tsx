import { translations } from "domains/wallet/i18n";
import React from "react";
import { render, screen } from "utils/testing-library";

import { DeleteWallet } from "./DeleteWallet";

const onDelete = jest.fn();

describe("DeleteWallet", () => {
	it("should not render if not open", () => {
		const { asFragment } = render(<DeleteWallet isOpen={false} onDelete={onDelete} />);

		expect(() => screen.getByTestId("modal__inner")).toThrow(/Unable to find an element by/);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render a modal", () => {
		const { asFragment } = render(<DeleteWallet isOpen={true} onDelete={onDelete} />);

		expect(screen.getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_DELETE_WALLET.TITLE);
		expect(screen.getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_DELETE_WALLET.DESCRIPTION);
		expect(asFragment()).toMatchSnapshot();
	});
});
