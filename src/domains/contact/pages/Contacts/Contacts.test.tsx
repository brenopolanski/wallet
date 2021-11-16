/* eslint-disable @typescript-eslint/require-await */
import userEvent from "@testing-library/user-event";
import { Contracts } from "@payvo/profiles";
import { ProfileSetting } from "@payvo/profiles/distribution/contracts";
import { translations as commonTranslations } from "app/i18n/common/i18n";
import { translations } from "domains/contact/i18n";
import { createMemoryHistory } from "history";
import React from "react";
import { Route } from "react-router-dom";
import { env, fireEvent, getDefaultProfileId, render, screen, waitFor, within } from "utils/testing-library";

import { Contacts } from "./Contacts";

let profile: Contracts.IProfile;

const history = createMemoryHistory();

const renderComponent = () => {
	const contactsURL = `/profiles/${profile.id()}/contacts`;
	history.push(contactsURL);

	return render(
		<Route path="/profiles/:profileId/contacts">
			<Contacts />
		</Route>,
		{
			history,
			routes: [contactsURL],
		},
	);
};

describe("Contacts", () => {
	beforeAll(() => {
		profile = env.profiles().findById(getDefaultProfileId());
	});

	it("should render with contacts", () => {
		const { asFragment } = renderComponent();

		expect(screen.getByTestId("header__title")).toHaveTextContent(translations.CONTACTS_PAGE.TITLE);
		expect(screen.getByTestId("header__subtitle")).toHaveTextContent(translations.CONTACTS_PAGE.SUBTITLE);

		expect(screen.getByTestId("ContactList")).toBeInTheDocument();
		expect(() => screen.getByTestId("EmptyBlock")).toThrow(/Unable to find an element by/);

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render with contacts of live networks only", () => {
		profile.settings().set(ProfileSetting.UseTestNetworks, false);

		const contact = profile.contacts().first();
		const address = contact.addresses().create({
			address: "AdVSe37niA3uFUPgCgMUH2tMsHF4LpLoiX",
			coin: "ARK",
			network: "ark.mainnet",
		});

		const { asFragment } = renderComponent();

		expect(screen.getByTestId("header__title")).toHaveTextContent(translations.CONTACTS_PAGE.TITLE);
		expect(screen.getByTestId("header__subtitle")).toHaveTextContent(translations.CONTACTS_PAGE.SUBTITLE);

		expect(screen.getByTestId("ContactList")).toBeInTheDocument();
		expect(screen.getAllByTestId("TableRow")).toHaveLength(1);
		expect(screen.getByTestId("TableRow")).toHaveTextContent(address.address());
		expect(() => screen.getByTestId("EmptyBlock")).toThrow(/Unable to find an element by/);

		expect(asFragment()).toMatchSnapshot();

		profile.settings().set(ProfileSetting.UseTestNetworks, true);

		contact.addresses().forget(address.id());
	});

	it("should render without contacts", () => {
		const contactsSpy = jest.spyOn(profile.contacts(), "values").mockReturnValue([]);

		const { asFragment } = renderComponent();

		expect(screen.getByTestId("header__title")).toHaveTextContent(translations.CONTACTS_PAGE.TITLE);
		expect(screen.getByTestId("header__subtitle")).toHaveTextContent(translations.CONTACTS_PAGE.SUBTITLE);

		expect(() => screen.getByTestId("ContactList")).toThrow(/Unable to find an element by/);
		expect(screen.getByTestId("EmptyBlock")).toBeInTheDocument();

		expect(asFragment()).toMatchSnapshot();

		contactsSpy.mockRestore();
	});

	it.each([
		["close", "modal__close-btn"],
		["cancel", "contact-form__cancel-btn"],
	])("should open & %s add contact modal", async (_, buttonId) => {
		renderComponent();

		userEvent.click(screen.getByTestId("contacts__add-contact-btn"));

		await waitFor(() => expect(screen.getByTestId(buttonId)).not.toBeDisabled());

		expect(screen.getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_CREATE_CONTACT.TITLE);
		expect(screen.getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_CREATE_CONTACT.DESCRIPTION);

		userEvent.click(screen.getByTestId(buttonId));

		expect(() => screen.getByTestId("modal__inner")).toThrow(/Unable to find an element by/);
	});

	it("should successfully add contact", async () => {
		renderComponent();

		userEvent.click(screen.getByTestId("contacts__add-contact-btn"));

		expect(screen.getByTestId("contact-form__save-btn")).toBeDisabled();
		expect(screen.getByTestId("contact-form__add-address-btn")).toBeDisabled();

		expect(() => screen.getAllByTestId("contact-form__address-list-item")).toThrow(/Unable to find an element by/);

		fireEvent.input(screen.getByTestId("contact-form__name-input"), {
			target: { value: "Test Contact" },
		});

		await waitFor(() => {
			expect(screen.getByTestId("contact-form__name-input")).toHaveValue("Test Contact");
		});

		const selectNetworkInput = screen.getByTestId("SelectDropdown__input");

		fireEvent.change(selectNetworkInput, { target: { value: "ARK D" } });
		fireEvent.keyDown(selectNetworkInput, { code: 13, key: "Enter" });

		await waitFor(() => {
			expect(selectNetworkInput).toHaveValue("ARK Devnet");
		});

		fireEvent.input(screen.getByTestId("contact-form__address-input"), {
			target: { value: "D8rr7B1d6TL6pf14LgMz4sKp1VBMs6YUYD" },
		});

		await waitFor(() => {
			expect(screen.getByTestId("contact-form__address-input")).toHaveValue("D8rr7B1d6TL6pf14LgMz4sKp1VBMs6YUYD");
		});

		await waitFor(() => {
			expect(screen.getByTestId("contact-form__add-address-btn")).not.toBeDisabled();
		});

		userEvent.click(screen.getByTestId("contact-form__add-address-btn"));

		await waitFor(() => expect(screen.getAllByTestId("contact-form__address-list-item")).toHaveLength(1));

		await waitFor(() => expect(screen.getByTestId("contact-form__save-btn")).not.toBeDisabled());

		userEvent.click(screen.getByTestId("contact-form__save-btn"));

		await waitFor(() => {
			expect(() => screen.getByTestId("modal__inner")).toThrow(/Unable to find an element by/);
		});

		expect(profile.contacts().findByAddress("D8rr7B1d6TL6pf14LgMz4sKp1VBMs6YUYD")).toHaveLength(1);
	});

	it("should successfully delete contact", async () => {
		const newContact = profile.contacts().create("New Contact", [
			{
				address: "D8rr7B1d6TL6pf14LgMz4sKp1VBMs6YUYD",
				coin: "ARK",
				network: "ark.devnet",
			},
		]);

		const contactsSpy = jest
			.spyOn(profile.contacts(), "values")
			.mockReturnValue([profile.contacts().findById(newContact.id())]);

		renderComponent();

		await waitFor(() => {
			expect(screen.getByTestId("ContactList")).toBeInTheDocument();
		});

		const firstContactOptionsDropdown = within(screen.getByTestId("ContactList")).getAllByTestId(
			"dropdown__toggle",
		)[0];
		userEvent.click(firstContactOptionsDropdown);

		await waitFor(() => {
			expect(screen.getByTestId("dropdown__options")).toBeInTheDocument();
		});

		const deleteOption = within(screen.getByTestId("dropdown__options")).getByText(commonTranslations.DELETE);
		userEvent.click(deleteOption);

		await waitFor(() => {
			expect(screen.getByTestId("modal__inner")).toBeInTheDocument();
		});

		userEvent.click(screen.getByTestId("DeleteResource__submit-button"));

		await waitFor(() => {
			expect(() => profile.contacts().findById(newContact.id())).toThrow("Failed to find");
		});

		contactsSpy.mockRestore();
	});

	it.each([
		["close", "modal__close-btn"],
		["cancel", "DeleteResource__cancel-button"],
	])("should %s delete contact modal", async (_, buttonId) => {
		renderComponent();

		await waitFor(() => {
			expect(screen.getByTestId("ContactList")).toBeInTheDocument();
		});

		const firstContactOptionsDropdown = within(screen.getByTestId("ContactList")).getAllByTestId(
			"dropdown__toggle",
		)[0];
		userEvent.click(firstContactOptionsDropdown);

		await waitFor(() => {
			expect(screen.getByTestId("dropdown__options")).toBeInTheDocument();
		});

		const deleteOption = within(screen.getByTestId("dropdown__options")).getByText(commonTranslations.DELETE);
		userEvent.click(deleteOption);

		await waitFor(() => {
			expect(screen.getByTestId("modal__inner")).toBeInTheDocument();
		});

		userEvent.click(screen.getByTestId(buttonId));

		await waitFor(() => {
			expect(() => screen.getByTestId("modal__inner")).toThrow(/Unable to find an element by/);
		});
	});

	it("should successfully delete contact from update modal", async () => {
		const newContact = profile.contacts().create("New Contact", [
			{
				address: "D8rr7B1d6TL6pf14LgMz4sKp1VBMs6YUYD",
				coin: "ARK",
				network: "ark.devnet",
			},
		]);

		const contactsSpy = jest
			.spyOn(profile.contacts(), "values")
			.mockReturnValue([profile.contacts().findById(newContact.id())]);

		renderComponent();

		await waitFor(() => {
			expect(screen.getByTestId("ContactList")).toBeInTheDocument();
		});

		const firstContactOptionsDropdown = within(screen.getByTestId("ContactList")).getAllByTestId(
			"dropdown__toggle",
		)[0];
		userEvent.click(firstContactOptionsDropdown);

		await waitFor(() => {
			expect(screen.getByTestId("dropdown__options")).toBeInTheDocument();
		});

		const editOption = within(screen.getByTestId("dropdown__options")).getByText(commonTranslations.EDIT);
		userEvent.click(editOption);

		await waitFor(() => {
			expect(screen.getByTestId("modal__inner")).toBeInTheDocument();
		});

		userEvent.click(screen.getByTestId("contact-form__delete-btn"));

		expect(screen.getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_DELETE_CONTACT.TITLE);

		userEvent.click(screen.getByTestId("DeleteResource__submit-button"));

		await waitFor(() => {
			expect(() => profile.contacts().findById(newContact.id())).toThrow("Failed to find");
		});

		contactsSpy.mockRestore();
	});

	it("should redirect contact address to send transfer page", async () => {
		const newContact = profile.contacts().create("New Contact", [
			{
				address: "D8rr7B1d6TL6pf14LgMz4sKp1VBMs6YUYD",
				coin: "ARK",
				network: "ark.devnet",
			},
		]);

		const contactsSpy = jest
			.spyOn(profile.contacts(), "values")
			.mockReturnValue([profile.contacts().findById(newContact.id())]);

		renderComponent();

		await waitFor(() => {
			expect(screen.getByTestId("ContactList")).toBeInTheDocument();
		});

		userEvent.click(screen.getAllByTestId("ContactListItem__send-button")[0]);

		expect(history.location.pathname).toBe("/profiles/b999d134-7a24-481e-a95d-bc47c543bfc9/send-transfer");
		expect(history.location.search).toBe(
			"?coin=ARK&network=ark.devnet&recipient=D8rr7B1d6TL6pf14LgMz4sKp1VBMs6YUYD",
		);

		contactsSpy.mockRestore();
	});

	it("should search for contact by name", async () => {
		const [contact1, contact2] = profile.contacts().values();

		renderComponent();

		expect(screen.getAllByTestId("ContactListItem__name")).toHaveLength(profile.contacts().count());
		expect(screen.getByText(contact1.name())).toBeInTheDocument();
		expect(screen.getByText(contact2.name())).toBeInTheDocument();

		userEvent.click(within(screen.getByTestId("HeaderSearchBar")).getByRole("button"));

		await waitFor(() =>
			expect(within(screen.getByTestId("HeaderSearchBar__input")).getByTestId("Input")).toBeInTheDocument(),
		);

		fireEvent.input(within(screen.getByTestId("HeaderSearchBar__input")).getByTestId("Input"), {
			target: { value: contact1.name() },
		});

		await waitFor(() => expect(screen.getAllByTestId("ContactListItem__name")).toHaveLength(1));

		expect(screen.queryByText(contact2.name())).not.toBeInTheDocument();

		fireEvent.input(within(screen.getByTestId("HeaderSearchBar__input")).getByTestId("Input"), {
			target: { value: "Unknown Name" },
		});

		await screen.findByTestId("Contacts--empty-results");
	});

	it("should search for contact by address", async () => {
		const [contact1, contact2] = profile.contacts().values();

		const contact1Address = contact1.addresses().first().address();
		const contact2Address = contact2.addresses().first().address();

		renderComponent();

		expect(screen.getAllByTestId("ContactListItem__address")).toHaveLength(6);
		expect(screen.getByText(contact1Address)).toBeInTheDocument();
		expect(screen.getByText(contact2Address)).toBeInTheDocument();

		userEvent.click(within(screen.getByTestId("HeaderSearchBar")).getByRole("button"));

		await waitFor(() =>
			expect(within(screen.getByTestId("HeaderSearchBar__input")).getByTestId("Input")).toBeInTheDocument(),
		);

		fireEvent.input(within(screen.getByTestId("HeaderSearchBar__input")).getByTestId("Input"), {
			target: { value: contact1Address },
		});

		await waitFor(() => expect(screen.getAllByTestId("ContactListItem__address")).toHaveLength(1));

		expect(screen.queryByText(contact2.name())).not.toBeInTheDocument();

		fireEvent.input(within(screen.getByTestId("HeaderSearchBar__input")).getByTestId("Input"), {
			target: { value: "Unknown Address" },
		});

		await screen.findByTestId("Contacts--empty-results");
	});

	it("should not include addresses of test networks in search if not enabled", async () => {
		profile.settings().set(ProfileSetting.UseTestNetworks, false);

		const contact = profile.contacts().first();

		const addressLive = contact.addresses().create({
			address: "AdVSe37niA3uFUPgCgMUH2tMsHF4LpLoiX",
			coin: "ARK",
			network: "ark.mainnet",
		});

		const addressTest = contact.addresses().create({
			address: "DNjuJEDQkhrJ7cA9FZ2iVXt5anYiM8Jtc9",
			coin: "ARK",
			network: "ark.devnet",
		});

		renderComponent();

		userEvent.click(within(screen.getByTestId("HeaderSearchBar")).getByRole("button"));

		await waitFor(() =>
			expect(within(screen.getByTestId("HeaderSearchBar__input")).getByTestId("Input")).toBeInTheDocument(),
		);

		fireEvent.input(within(screen.getByTestId("HeaderSearchBar__input")).getByTestId("Input"), {
			target: { value: addressLive.address() },
		});

		await waitFor(() => expect(screen.getAllByTestId("ContactListItem__address")).toHaveLength(1));

		expect(screen.queryByText(addressLive.address())).toBeInTheDocument();

		fireEvent.input(within(screen.getByTestId("HeaderSearchBar__input")).getByTestId("Input"), {
			target: { value: addressTest.address() },
		});

		await screen.findByTestId("Contacts--empty-results");

		profile.settings().set(ProfileSetting.UseTestNetworks, true);

		contact.addresses().forget(addressLive.id());
		contact.addresses().forget(addressTest.id());
	});
});
