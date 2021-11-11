import { Contracts } from "@payvo/profiles";
import { fireEvent, waitFor, within } from "@testing-library/react";
import React from "react";
import { act, env, getDefaultProfileId, render, screen } from "utils/testing-library";

import { translations } from "../../i18n";
import { SearchRecipient } from "./SearchRecipient";
import { RecipientProperties } from "./SearchRecipient.contracts";

let recipients: RecipientProperties[];

describe("SearchRecipient", () => {
	beforeAll(() => {
		const profile: Contracts.IProfile = env.profiles().findById(getDefaultProfileId());
		const wallets: Contracts.IReadWriteWallet[] = profile.wallets().values();

		recipients = wallets.map((wallet) => ({
			address: wallet.address(),
			alias: wallet.alias(),
			avatar: wallet.avatar(),
			id: wallet.id(),
			network: wallet.networkId(),
			type: "wallet",
		}));
	});

	it("should not render if not open", () => {
		const { asFragment } = render(<SearchRecipient isOpen={false} recipients={recipients} onAction={jest.fn} />);

		expect(() => screen.getByTestId("modal__inner")).toThrow(/Unable to find an element by/);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render a modal", () => {
		const { asFragment } = render(<SearchRecipient isOpen={true} recipients={recipients} onAction={jest.fn} />);

		expect(screen.getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_SEARCH_RECIPIENT.TITLE);
		expect(screen.getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_SEARCH_RECIPIENT.DESCRIPTION);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should handle close", () => {
		const onClose = jest.fn();

		render(<SearchRecipient isOpen={true} recipients={recipients} onClose={onClose} onAction={jest.fn} />);

		fireEvent.click(screen.getByTestId("modal__close-btn"));

		expect(onClose).toHaveBeenCalledWith(expect.objectContaining({ nativeEvent: expect.any(MouseEvent) }));
	});

	it("should render a modal with custom title and description", () => {
		const title = "Modal title";
		const description = "Modal description";
		const { asFragment } = render(
			<SearchRecipient
				isOpen={true}
				recipients={recipients}
				title={title}
				description={description}
				onAction={jest.fn()}
			/>,
		);

		expect(screen.getByTestId("modal__inner")).toHaveTextContent("Modal title");
		expect(screen.getByTestId("modal__inner")).toHaveTextContent("Modal description");
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render with selected address", () => {
		const onAction = jest.fn();

		const { asFragment } = render(
			<SearchRecipient
				isOpen={true}
				recipients={recipients}
				selectedAddress="D8rr7B1d6TL6pf14LgMz4sKp1VBMs6YUYD"
				onAction={onAction}
			/>,
		);

		expect(screen.getByTestId("RecipientListItem__selected-button-0")).toBeInTheDocument();

		fireEvent.click(screen.getByTestId("RecipientListItem__selected-button-0"));

		expect(onAction).toHaveBeenCalledWith(recipients[0].address);

		expect(asFragment()).toMatchSnapshot();
	});

	it("should filter recipients by address", async () => {
		jest.useFakeTimers();

		render(<SearchRecipient isOpen={true} recipients={recipients} onAction={jest.fn} />);

		await waitFor(() =>
			expect(screen.getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_SEARCH_RECIPIENT.TITLE),
		);
		await waitFor(() =>
			expect(screen.getByTestId("modal__inner")).toHaveTextContent(
				translations.MODAL_SEARCH_RECIPIENT.DESCRIPTION,
			),
		);

		await waitFor(() => expect(screen.queryAllByTestId("TableRow")).toHaveLength(2));

		fireEvent.click(within(screen.getByTestId("HeaderSearchBar")).getByRole("button"));

		await screen.findByTestId("HeaderSearchBar__input");
		const searchInput = within(screen.getByTestId("HeaderSearchBar__input")).getByTestId("Input");
		await waitFor(() => expect(searchInput).toBeInTheDocument());

		fireEvent.change(searchInput, { target: { value: "D8rr7B1d6TL6pf1" } });

		act(() => {
			jest.advanceTimersByTime(100);
		});

		await waitFor(() => expect(screen.queryAllByTestId("TableRow")).toHaveLength(1));
		jest.useRealTimers();
	});

	it("should filter recipients by alias", async () => {
		jest.useFakeTimers();

		render(<SearchRecipient isOpen={true} recipients={recipients} onAction={jest.fn} />);

		await waitFor(() =>
			expect(screen.getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_SEARCH_RECIPIENT.TITLE),
		);
		await waitFor(() =>
			expect(screen.getByTestId("modal__inner")).toHaveTextContent(
				translations.MODAL_SEARCH_RECIPIENT.DESCRIPTION,
			),
		);

		await waitFor(() => expect(screen.queryAllByTestId("TableRow")).toHaveLength(2));

		fireEvent.click(within(screen.getByTestId("HeaderSearchBar")).getByRole("button"));

		await screen.findByTestId("HeaderSearchBar__input");
		const searchInput = within(screen.getByTestId("HeaderSearchBar__input")).getByTestId("Input");
		await waitFor(() => expect(searchInput).toBeInTheDocument());

		fireEvent.change(searchInput, { target: { value: "Ark Wallet 1" } });

		act(() => {
			jest.advanceTimersByTime(100);
		});

		await waitFor(() => expect(screen.queryAllByTestId("TableRow")).toHaveLength(1));
		jest.useRealTimers();
	});

	it("should reset recipient search", async () => {
		jest.useFakeTimers();

		render(<SearchRecipient isOpen={true} recipients={recipients} onAction={jest.fn} />);

		await waitFor(() =>
			expect(screen.getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_SEARCH_RECIPIENT.TITLE),
		);
		await waitFor(() =>
			expect(screen.getByTestId("modal__inner")).toHaveTextContent(
				translations.MODAL_SEARCH_RECIPIENT.DESCRIPTION,
			),
		);

		await waitFor(() => expect(screen.queryAllByTestId("TableRow")).toHaveLength(2));

		fireEvent.click(within(screen.getByTestId("HeaderSearchBar")).getByRole("button"));

		await screen.findByTestId("HeaderSearchBar__input");
		const searchInput = within(screen.getByTestId("HeaderSearchBar__input")).getByTestId("Input");
		await waitFor(() => expect(searchInput).toBeInTheDocument());

		fireEvent.change(searchInput, { target: { value: "Ark Wallet 1" } });

		act(() => {
			jest.advanceTimersByTime(100);
		});

		await waitFor(() => expect(screen.queryAllByTestId("TableRow")).toHaveLength(1));

		// Reset search
		fireEvent.click(screen.getByTestId("header-search-bar__reset"));

		await waitFor(() => expect(searchInput).not.toHaveValue());
		await waitFor(() => expect(screen.queryAllByTestId("TableRow")).toHaveLength(2));

		jest.useRealTimers();
	});

	it("should not find recipient and show empty results screen", async () => {
		jest.useFakeTimers();

		render(<SearchRecipient isOpen={true} recipients={recipients} onAction={jest.fn} />);

		await waitFor(() =>
			expect(screen.getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_SEARCH_RECIPIENT.TITLE),
		);
		await waitFor(() =>
			expect(screen.getByTestId("modal__inner")).toHaveTextContent(
				translations.MODAL_SEARCH_RECIPIENT.DESCRIPTION,
			),
		);

		await waitFor(() => expect(screen.queryAllByTestId("TableRow")).toHaveLength(2));

		fireEvent.click(within(screen.getByTestId("HeaderSearchBar")).getByRole("button"));

		await screen.findByTestId("HeaderSearchBar__input");
		const searchInput = within(screen.getByTestId("HeaderSearchBar__input")).getByTestId("Input");
		await waitFor(() => expect(searchInput).toBeInTheDocument());

		fireEvent.change(searchInput, { target: { value: "non-existent recipient address" } });

		act(() => {
			jest.advanceTimersByTime(100);
		});

		await waitFor(() => expect(screen.getByTestId("Input")).toHaveValue("non-existent recipient address"));
		await waitFor(() => expect(screen.queryAllByTestId("TableRow")).toHaveLength(0));

		await screen.findByTestId("EmptyResults");

		jest.useRealTimers();
	});
});
