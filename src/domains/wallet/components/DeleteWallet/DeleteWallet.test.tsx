import React from "react";
import { render } from "utils/testing-library";

// i18n
import { translations } from "../../i18n";
import { DeleteWallet } from "./DeleteWallet";

const onDelete = jest.fn();

describe("DeleteWallet", () => {
	it("should render a modal", () => {
		const { asFragment, getByTestId } = render(<DeleteWallet isOpen={true} onDelete={onDelete} />);

		expect(getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_DELETE_WALLET.TITLE);
		expect(getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_DELETE_WALLET.DESCRIPTION);
		expect(asFragment()).toMatchSnapshot();
	});
});
