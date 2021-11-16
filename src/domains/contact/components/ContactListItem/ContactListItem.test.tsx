import { Contracts } from "@payvo/profiles";
import { ContactAddress } from "@payvo/profiles/distribution/contact-address";
import userEvent from "@testing-library/user-event";
import React from "react";
import { env, getDefaultProfileId, render } from "utils/testing-library";

import { ContactListItem } from "./ContactListItem";

const singleOption = [{ label: "Option 1", value: "option_1" }];

const multiOptions = [...singleOption, { label: "Option 2", value: "option_2" }];

let contact: Contracts.IContact;

describe("ContactListItem", () => {
	beforeAll(() => {
		const profile = env.profiles().findById(getDefaultProfileId());
		contact = profile.contacts().first();
	});

	it("should render", () => {
		const { asFragment } = render(
			<table>
				<tbody>
					<ContactListItem item={contact} useTestNetworks />
				</tbody>
			</table>,
		);

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render with live networks only", () => {
		const address = contact.addresses().create({
			address: "AdVSe37niA3uFUPgCgMUH2tMsHF4LpLoiX",
			coin: "ARK",
			network: "ark.mainnet",
		});

		const { asFragment, getAllByTestId, getByTestId } = render(
			<table>
				<tbody>
					<ContactListItem item={contact} useTestNetworks={false} />
				</tbody>
			</table>,
		);

		expect(getAllByTestId("TableRow")).toHaveLength(1);
		expect(getByTestId("TableRow")).toHaveTextContent(address.address());

		expect(asFragment()).toMatchSnapshot();

		contact.addresses().forget(address.id());
	});

	it("should render as delegate", () => {
		const delegateContact = {
			addresses: () => ({
				count: () => 1,
				values: () => [
					{
						address: () => "id5sRKWckH4rE1hQ9eeMeHAepgyC3cvJtwb",
						coin: () => "ARK",
						hasSyncedWithNetwork: () => true,
						isDelegate: () => true,
						network: () => "ark.devnet",
					},
				],
			}),
			avatar: () => "data:image/png;base64,avatarImage",
			id: () => "id5sRKWckH4rE1hQ9eeMeHAepgyC3cvJtwb",
			name: () => "Caio",
		};

		const { asFragment } = render(
			<table>
				<tbody>
					<ContactListItem item={delegateContact} useTestNetworks />
				</tbody>
			</table>,
		);

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render with multiple addresses", () => {
		contact.addresses().create({
			address: "D61mfSggzbvQgTUe6JhYKH2doHaqJ3Dyib",
			coin: "ARK",
			network: "ark.devnet",
		});

		contact.addresses().create({
			address: "DKrACQw7ytoU2gjppy3qKeE2dQhZjfXYqu",
			coin: "ARK",
			network: "ark.devnet",
		});

		const { asFragment } = render(
			<table>
				<tbody>
					<ContactListItem item={contact} useTestNetworks />
				</tbody>
			</table>,
		);

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render with one option", () => {
		const { asFragment } = render(
			<table>
				<tbody>
					<ContactListItem item={contact} options={singleOption} useTestNetworks />
				</tbody>
			</table>,
		);

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render with multiple options", () => {
		const { asFragment } = render(
			<table>
				<tbody>
					<ContactListItem item={contact} options={multiOptions} useTestNetworks />
				</tbody>
			</table>,
		);

		expect(asFragment()).toMatchSnapshot();
	});

	it("should call onAction callback if provided with one option", () => {
		const onAction = jest.fn();

		const { getByTestId } = render(
			<table>
				<tbody>
					<ContactListItem item={contact} onAction={onAction} options={singleOption} useTestNetworks />
				</tbody>
			</table>,
		);

		userEvent.click(getByTestId("ContactListItem__one-option-button-0"));

		expect(onAction).toHaveBeenCalledWith(singleOption[0], contact.addresses().first().address());
	});

	it("should call onAction callback if provided with one option in my contacts", () => {
		const onAction = jest.fn();

		const { getByTestId } = render(
			<table>
				<tbody>
					<ContactListItem item={contact} onAction={onAction} options={singleOption} useTestNetworks />
				</tbody>
			</table>,
		);

		userEvent.click(getByTestId("ContactListItem__one-option-button-0"));

		expect(onAction).toHaveBeenCalledWith(singleOption[0], contact.addresses().first().address());
	});

	it("should call onAction callback if provided with multiple options", () => {
		const onAction = jest.fn();

		const { getAllByTestId, getByTestId } = render(
			<table>
				<tbody>
					<ContactListItem item={contact} onAction={onAction} options={multiOptions} useTestNetworks />
				</tbody>
			</table>,
		);

		userEvent.click(getAllByTestId("dropdown__toggle")[0]);
		userEvent.click(getByTestId("dropdown__option--0"));

		expect(onAction).toHaveBeenCalledWith(singleOption[0], contact.addresses().first().address());
	});

	it("should call onAction callback if provided with multiple options in my contacts", () => {
		const onAction = jest.fn();

		const { getAllByTestId, getByTestId } = render(
			<table>
				<tbody>
					<ContactListItem item={contact} onAction={onAction} options={multiOptions} useTestNetworks />
				</tbody>
			</table>,
		);

		userEvent.click(getAllByTestId("dropdown__toggle")[0]);
		userEvent.click(getByTestId("dropdown__option--0"));

		expect(onAction).toHaveBeenCalledWith(singleOption[0], contact.addresses().first().address());
	});

	it("should not call onAction callback if not provided with multiple options", () => {
		const onAction = jest.fn();

		const { getAllByTestId, getByTestId } = render(
			<table>
				<tbody>
					<ContactListItem item={contact} options={multiOptions} useTestNetworks />
				</tbody>
			</table>,
		);

		userEvent.click(getAllByTestId("dropdown__toggle")[0]);
		userEvent.click(getByTestId("dropdown__option--0"));

		expect(onAction).not.toHaveBeenCalled();
	});

	it("should not call onAction callback if not provided with multiple options in my contacts", () => {
		const onAction = jest.fn();

		const { getAllByTestId, getByTestId } = render(
			<table>
				<tbody>
					<ContactListItem item={contact} options={multiOptions} useTestNetworks />
				</tbody>
			</table>,
		);

		userEvent.click(getAllByTestId("dropdown__toggle")[0]);
		userEvent.click(getByTestId("dropdown__option--0"));

		expect(onAction).not.toHaveBeenCalled();
	});

	it("should call onAction callback with given values", () => {
		const onAction = jest.fn();

		const { getByTestId } = render(
			<table>
				<tbody>
					<ContactListItem item={contact} onAction={onAction} options={singleOption} useTestNetworks />
				</tbody>
			</table>,
		);

		userEvent.click(getByTestId("ContactListItem__one-option-button-0"));

		expect(onAction).toHaveBeenCalledWith(
			{ label: "Option 1", value: "option_1" },
			"D61mfSggzbvQgTUe6JhYKH2doHaqJ3Dyib",
		);
	});

	it("should call onAction callback with given values in my contacts", () => {
		const onAction = jest.fn();

		const { getByTestId } = render(
			<table>
				<tbody>
					<ContactListItem item={contact} onAction={onAction} options={singleOption} useTestNetworks />
				</tbody>
			</table>,
		);

		userEvent.click(getByTestId("ContactListItem__one-option-button-0"));

		expect(onAction).toHaveBeenCalledWith(
			{ label: "Option 1", value: "option_1" },
			"D61mfSggzbvQgTUe6JhYKH2doHaqJ3Dyib",
		);
	});

	it("should call send", () => {
		const onSend = jest.fn();

		const { getAllByTestId } = render(
			<table>
				<tbody>
					<ContactListItem item={contact} onSend={onSend} options={singleOption} useTestNetworks />
				</tbody>
			</table>,
		);

		userEvent.click(getAllByTestId("ContactListItem__send-button")[0]);

		expect(onSend).toHaveBeenCalledWith(expect.any(ContactAddress));
	});
});
