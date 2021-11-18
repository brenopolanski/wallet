import { Contracts } from "@payvo/sdk-profiles";
import { translations } from "domains/contact/i18n";
import React from "react";
import { env, fireEvent, getDefaultProfileId, render, waitFor } from "utils/testing-library";

import { DeleteContact } from "./DeleteContact";

let contact: Contracts.IContact;
let profile: Contracts.IProfile;

const onDelete = jest.fn();

describe("DeleteContact", () => {
	beforeAll(() => {
		profile = env.profiles().findById(getDefaultProfileId());
		contact = profile.contacts().values()[0];
	});

	afterEach(() => {
		onDelete.mockRestore();
	});

	it("should not render if not open", () => {
		const { asFragment, getByTestId } = render(
			<DeleteContact contact={contact} isOpen={false} onDelete={onDelete} profile={profile} />,
		);

		expect(() => getByTestId("modal__inner")).toThrow(/Unable to find an element by/);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render a modal", () => {
		const { asFragment, getByTestId } = render(
			<DeleteContact contact={contact} isOpen={true} onDelete={onDelete} profile={profile} />,
		);

		expect(getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_DELETE_CONTACT.TITLE);
		expect(getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_DELETE_CONTACT.DESCRIPTION);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should delete contact", async () => {
		const { getByTestId } = render(
			<DeleteContact isOpen={true} onDelete={onDelete} profile={profile} contact={contact} />,
		);
		const deleteButton = getByTestId("DeleteResource__submit-button");

		fireEvent.click(deleteButton);

		await waitFor(() => expect(onDelete).toHaveBeenCalledWith(contact.id()));

		expect(() => profile.contacts().findById(contact.id())).toThrow("Failed to find");
	});
});
