import { Contracts } from "@payvo/profiles";
// @README: This import is fine in tests but should be avoided in production code.
import { ReadOnlyWallet } from "@payvo/profiles/distribution/read-only-wallet";
import * as useRandomNumberHook from "app/hooks/use-random-number";
import { translations } from "app/i18n/common/i18n";
import React from "react";
import { data } from "tests/fixtures/coins/ark/devnet/delegates.json";
import { act, env, fireEvent, getDefaultProfileId, render, screen, waitFor } from "utils/testing-library";

import { DelegateTable } from "./DelegateTable";
import { VoteDelegateProperties } from "./DelegateTable.models";

let useRandomNumberSpy: jest.SpyInstance;

let wallet: Contracts.IReadWriteWallet;
let delegates: Contracts.IReadOnlyWallet[];
let votes: Contracts.VoteRegistryItem[];

describe("DelegateTable", () => {
	beforeAll(() => {
		useRandomNumberSpy = jest.spyOn(useRandomNumberHook, "useRandomNumber").mockImplementation(() => 1);

		const profile = env.profiles().findById(getDefaultProfileId());
		wallet = profile.wallets().values()[0];

		delegates = [0, 1, 2].map(
			(index) =>
				new ReadOnlyWallet({
					address: data[index].address,
					explorerLink: "",
					governanceIdentifier: "address",
					isDelegate: true,
					isResignedDelegate: false,
					publicKey: data[index].publicKey,
					username: data[index].username,
				}),
		);

		votes = [
			{
				amount: 0,
				wallet: delegates[0],
			},
		];
	});

	afterAll(() => {
		useRandomNumberSpy.mockRestore();
	});

	it("should render", () => {
		const { container, asFragment } = render(
			<DelegateTable
				delegates={delegates}
				votes={[]}
				voteDelegates={[]}
				unvoteDelegates={[]}
				selectedWallet={wallet}
				maxVotes={wallet.network().maximumVotesPerTransaction()}
			/>,
		);

		expect(container).toBeTruthy();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render vote amount column", () => {
		const votesAmountMinimumMock = jest.spyOn(wallet.network(), "votesAmountMinimum").mockReturnValue(10);

		const { container, asFragment } = render(
			<DelegateTable
				delegates={delegates}
				votes={[]}
				voteDelegates={[]}
				unvoteDelegates={[]}
				selectedWallet={wallet}
				maxVotes={wallet.network().maximumVotesPerTransaction()}
			/>,
		);

		expect(container).toBeTruthy();
		expect(asFragment()).toMatchSnapshot();

		votesAmountMinimumMock.mockRestore();
	});

	describe.each(["base", "requiresAmount"])("loading state for %s", (voteType) => {
		it.each([true, false])("should render when isCompact = %s", (isCompact: boolean) => {
			const votesAmountMinimumMock = jest
				.spyOn(wallet.network(), "votesAmountMinimum")
				.mockReturnValue(voteType === "requiresAmount" ? 10 : 0);

			const { container, asFragment } = render(
				<DelegateTable
					delegates={[]}
					votes={[]}
					isLoading={true}
					voteDelegates={[]}
					unvoteDelegates={[]}
					selectedWallet={wallet}
					maxVotes={wallet.network().maximumVotesPerTransaction()}
					isCompact={isCompact}
				/>,
			);

			expect(container).toBeTruthy();
			expect(asFragment()).toMatchSnapshot();

			votesAmountMinimumMock.mockRestore();
		});
	});

	it("should render with empty list", () => {
		const { container, asFragment } = render(
			<DelegateTable
				delegates={[]}
				votes={[]}
				voteDelegates={[]}
				unvoteDelegates={[]}
				selectedWallet={wallet}
				maxVotes={wallet.network().maximumVotesPerTransaction()}
			/>,
		);

		expect(container).toBeTruthy();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render with subtitle", () => {
		const { container, asFragment } = render(
			<DelegateTable
				delegates={delegates}
				votes={[]}
				voteDelegates={[]}
				unvoteDelegates={[]}
				selectedWallet={wallet}
				maxVotes={wallet.network().maximumVotesPerTransaction()}
				subtitle={<p>test</p>}
			/>,
		);

		expect(container).toBeTruthy();
		expect(screen.getByText("test")).toBeTruthy();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should select a delegate to vote", () => {
		const { asFragment } = render(
			<DelegateTable
				delegates={delegates}
				votes={[]}
				voteDelegates={[]}
				unvoteDelegates={[]}
				selectedWallet={wallet}
				maxVotes={wallet.network().maximumVotesPerTransaction()}
			/>,
		);
		const selectButton = screen.getByTestId("DelegateRow__toggle-0");

		act(() => {
			fireEvent.click(selectButton);
		});

		expect(screen.getByTestId("DelegateTable__footer")).toBeTruthy();
		expect(screen.getByTestId("DelegateTable__footer--vote")).toHaveTextContent("1");

		act(() => {
			fireEvent.click(selectButton);
		});

		expect(selectButton).toHaveTextContent(translations.SELECT);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should unselect a delegate to vote", () => {
		const { asFragment } = render(
			<DelegateTable
				delegates={delegates}
				votes={votes}
				voteDelegates={[]}
				unvoteDelegates={[]}
				selectedWallet={wallet}
				maxVotes={wallet.network().maximumVotesPerTransaction()}
			/>,
		);
		const selectButton = screen.getByTestId("DelegateRow__toggle-1");

		act(() => {
			fireEvent.click(selectButton);
		});

		expect(screen.getByTestId("DelegateTable__footer")).toBeTruthy();
		expect(screen.getByTestId("DelegateTable__footer--vote")).toHaveTextContent("1");

		act(() => {
			fireEvent.click(selectButton);
		});

		expect(selectButton).toHaveTextContent(translations.SELECTED);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should select a delegate to unvote", () => {
		const { asFragment } = render(
			<DelegateTable
				delegates={delegates}
				votes={votes}
				voteDelegates={[]}
				unvoteDelegates={[]}
				selectedWallet={wallet}
				maxVotes={wallet.network().maximumVotesPerTransaction()}
			/>,
		);
		const selectButton = screen.getByTestId("DelegateRow__toggle-0");

		act(() => {
			fireEvent.click(selectButton);
		});

		expect(screen.getByTestId("DelegateTable__footer")).toBeTruthy();
		expect(screen.getByTestId("DelegateTable__footer--unvote")).toHaveTextContent("1");

		act(() => {
			fireEvent.click(selectButton);
		});

		expect(selectButton).toHaveTextContent(translations.CURRENT);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should select a delegate with vote amount and make it unvote", () => {
		const votesAmountMinimumMock = jest.spyOn(wallet.network(), "votesAmountMinimum").mockReturnValue(10);

		const votes: Contracts.VoteRegistryItem[] = [
			{
				amount: 10,
				wallet: delegates[0],
			},
		];

		const { asFragment } = render(
			<DelegateTable
				delegates={delegates}
				votes={votes}
				voteDelegates={[]}
				unvoteDelegates={[]}
				selectedWallet={wallet}
				maxVotes={wallet.network().maximumVotesPerTransaction()}
			/>,
		);
		const selectButton = screen.getByTestId("DelegateRow__toggle-0");

		act(() => {
			fireEvent.click(selectButton);
		});

		expect(screen.getByTestId("DelegateTable__footer")).toBeTruthy();
		expect(screen.getByTestId("DelegateTable__footer--unvote")).toHaveTextContent("1");

		act(() => {
			fireEvent.click(selectButton);
		});

		expect(selectButton).toHaveTextContent(translations.CURRENT);
		expect(asFragment()).toMatchSnapshot();

		votesAmountMinimumMock.mockRestore();
	});

	it("should select a changed delegate to unvote", async () => {
		const votesAmountMinimumMock = jest.spyOn(wallet.network(), "votesAmountMinimum").mockReturnValue(10);
		const votesAmountStepMock = jest.spyOn(wallet.network(), "votesAmountStep").mockReturnValue(10);

		const votes: Contracts.VoteRegistryItem[] = [
			{
				amount: 20,
				wallet: delegates[0],
			},
		];

		const Table = () => (
			<DelegateTable
				delegates={delegates}
				votes={votes}
				voteDelegates={[]}
				unvoteDelegates={[]}
				selectedWallet={wallet}
				maxVotes={wallet.network().maximumVotesPerTransaction()}
			/>
		);

		const { asFragment, rerender } = render(<Table />);
		const selectButton = screen.getByTestId("DelegateRow__toggle-0");
		const amountField = screen.getAllByTestId("InputCurrency")[0];

		fireEvent.input(amountField, { target: { value: 30 } });

		expect(screen.getByTestId("DelegateTable__footer")).toBeTruthy();

		await waitFor(() => {
			expect(screen.getByTestId("DelegateTable__footer--vote")).toHaveTextContent("1");
		});

		expect(selectButton).toHaveTextContent(translations.CHANGED);

		act(() => {
			fireEvent.click(selectButton);
		});

		expect(screen.getByTestId("DelegateTable__footer")).toBeTruthy();
		expect(screen.getByTestId("DelegateTable__footer--unvote")).toHaveTextContent("1");

		act(() => {
			fireEvent.click(selectButton);
		});

		expect(selectButton).toHaveTextContent(translations.CURRENT);
		expect(amountField).toHaveValue("20");

		rerender(<Table />);

		fireEvent.input(amountField, { target: { value: 10 } });

		await waitFor(() => {
			expect(screen.getByTestId("DelegateTable__footer--unvote")).toHaveTextContent("1");
		});

		expect(selectButton).toHaveTextContent(translations.CHANGED);

		act(() => {
			fireEvent.click(selectButton);
		});

		expect(screen.getByTestId("DelegateTable__footer")).toBeTruthy();
		expect(screen.getByTestId("DelegateTable__footer--unvote")).toHaveTextContent("1");

		act(() => {
			fireEvent.click(selectButton);
		});

		expect(selectButton).toHaveTextContent(translations.CURRENT);
		expect(amountField).toHaveValue("20");
		expect(asFragment()).toMatchSnapshot();

		votesAmountMinimumMock.mockRestore();
		votesAmountStepMock.mockRestore();
	});

	it("should unselect a delegate to unvote", () => {
		const { asFragment } = render(
			<DelegateTable
				delegates={delegates}
				votes={votes}
				voteDelegates={[]}
				unvoteDelegates={[]}
				selectedWallet={wallet}
				maxVotes={wallet.network().maximumVotesPerTransaction()}
			/>,
		);
		const selectUnvoteButton = screen.getByTestId("DelegateRow__toggle-0");
		const selectVoteButton = screen.getByTestId("DelegateRow__toggle-1");

		act(() => {
			fireEvent.click(selectUnvoteButton);
		});

		act(() => {
			fireEvent.click(selectVoteButton);
		});

		expect(screen.getByTestId("DelegateTable__footer")).toBeTruthy();
		expect(screen.getByTestId("DelegateTable__footer--unvote")).toHaveTextContent("1");
		expect(screen.getByTestId("DelegateTable__footer--vote")).toHaveTextContent("1");

		act(() => {
			fireEvent.click(selectUnvoteButton);
		});

		expect(selectUnvoteButton).toHaveTextContent(translations.CURRENT);
		expect(selectVoteButton).toHaveTextContent(translations.SELECTED);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should select a delegate to unvote/vote", () => {
		const { asFragment } = render(
			<DelegateTable
				delegates={delegates}
				votes={votes}
				voteDelegates={[]}
				unvoteDelegates={[]}
				selectedWallet={wallet}
				maxVotes={wallet.network().maximumVotesPerTransaction()}
			/>,
		);
		const selectUnvoteButton = screen.getByTestId("DelegateRow__toggle-0");
		const selectVoteButton = screen.getByTestId("DelegateRow__toggle-1");

		act(() => {
			fireEvent.click(selectUnvoteButton);
		});

		act(() => {
			fireEvent.click(selectVoteButton);
		});

		expect(screen.getByTestId("DelegateTable__footer")).toBeTruthy();
		expect(screen.getByTestId("DelegateTable__footer--unvote")).toHaveTextContent("1");
		expect(screen.getByTestId("DelegateTable__footer--vote")).toHaveTextContent("1");

		expect(selectUnvoteButton).toHaveTextContent(translations.UNSELECTED);
		expect(selectVoteButton).toHaveTextContent(translations.SELECTED);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should select multiple delegates to unvote/vote", () => {
		const { asFragment } = render(
			<DelegateTable
				delegates={delegates}
				votes={votes}
				voteDelegates={[]}
				unvoteDelegates={[]}
				selectedWallet={wallet}
				maxVotes={10}
			/>,
		);
		const selectButtons = [0, 1, 2].map((index) => screen.getByTestId(`DelegateRow__toggle-${index}`));

		act(() => {
			fireEvent.click(selectButtons[0]);
		});

		act(() => {
			fireEvent.click(selectButtons[1]);
		});

		act(() => {
			fireEvent.click(selectButtons[2]);
		});

		expect(screen.getByTestId("DelegateTable__footer")).toBeTruthy();
		expect(screen.getByTestId("DelegateTable__footer--vote")).toHaveTextContent("2");
		expect(screen.getByTestId("DelegateTable__footer--unvote")).toHaveTextContent("1");
		expect(asFragment()).toMatchSnapshot();
	});

	it("should emit action on continue button to vote", () => {
		const voteDelegates: VoteDelegateProperties[] = [
			{
				amount: 0,
				delegateAddress: delegates[0].address(),
			},
		];

		const onContinue = jest.fn();
		const { container, asFragment } = render(
			<DelegateTable
				delegates={delegates}
				votes={[]}
				onContinue={onContinue}
				voteDelegates={[]}
				unvoteDelegates={[]}
				selectedWallet={wallet}
				maxVotes={wallet.network().maximumVotesPerTransaction()}
			/>,
		);
		const selectButton = screen.getByTestId("DelegateRow__toggle-0");

		act(() => {
			fireEvent.click(selectButton);
		});

		expect(screen.getByTestId("DelegateTable__footer")).toBeTruthy();

		act(() => {
			fireEvent.click(screen.getByTestId("DelegateTable__continue-button"));
		});

		expect(container).toBeTruthy();
		expect(onContinue).toHaveBeenCalledWith([], voteDelegates);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render with a delegate to vote", () => {
		const voteDelegates: VoteDelegateProperties[] = [
			{
				amount: 0,
				delegateAddress: delegates[0].address(),
			},
		];

		const onContinue = jest.fn();
		const { container, asFragment } = render(
			<DelegateTable
				delegates={delegates}
				votes={[]}
				voteDelegates={voteDelegates}
				unvoteDelegates={[]}
				onContinue={onContinue}
				selectedWallet={wallet}
				maxVotes={wallet.network().maximumVotesPerTransaction()}
			/>,
		);

		expect(screen.getByTestId("DelegateTable__footer")).toBeTruthy();

		act(() => {
			fireEvent.click(screen.getByTestId("DelegateTable__continue-button"));
		});

		expect(container).toBeTruthy();
		expect(onContinue).toHaveBeenCalledWith([], voteDelegates);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render with a delegate to unvote", () => {
		const unvoteDelegates: VoteDelegateProperties[] = [
			{
				amount: 0,
				delegateAddress: delegates[0].address(),
			},
		];

		const onContinue = jest.fn();
		const { container, asFragment } = render(
			<DelegateTable
				delegates={delegates}
				voteDelegates={[]}
				votes={[]}
				unvoteDelegates={unvoteDelegates}
				onContinue={onContinue}
				selectedWallet={wallet}
				maxVotes={wallet.network().maximumVotesPerTransaction()}
			/>,
		);

		expect(screen.getByTestId("DelegateTable__footer")).toBeTruthy();

		act(() => {
			fireEvent.click(screen.getByTestId("DelegateTable__continue-button"));
		});

		expect(container).toBeTruthy();
		expect(onContinue).toHaveBeenCalledWith(unvoteDelegates, []);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render with a delegate to unvote/vote", () => {
		const unvoteDelegates: VoteDelegateProperties[] = [
			{
				amount: 0,
				delegateAddress: delegates[0].address(),
			},
		];
		const voteDelegates: VoteDelegateProperties[] = [
			{
				amount: 0,
				delegateAddress: delegates[1].address(),
			},
		];

		const onContinue = jest.fn();
		const { container, asFragment } = render(
			<DelegateTable
				delegates={delegates}
				votes={votes}
				voteDelegates={voteDelegates}
				unvoteDelegates={unvoteDelegates}
				onContinue={onContinue}
				selectedWallet={wallet}
				maxVotes={wallet.network().maximumVotesPerTransaction()}
			/>,
		);

		expect(screen.getByTestId("DelegateTable__footer")).toBeTruthy();
		expect(screen.getByTestId("DelegateTable__footer--unvote")).toHaveTextContent("1");
		expect(screen.getByTestId("DelegateTable__footer--vote")).toHaveTextContent("1");

		act(() => {
			fireEvent.click(screen.getByTestId("DelegateTable__continue-button"));
		});

		expect(container).toBeTruthy();
		expect(onContinue).toHaveBeenCalledWith(unvoteDelegates, voteDelegates);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should emit action on continue button to unvote", () => {
		const voteDelegates: VoteDelegateProperties[] = [
			{
				amount: 0,
				delegateAddress: votes[0].wallet!.address(),
			},
		];

		const onContinue = jest.fn();
		const { container, asFragment } = render(
			<DelegateTable
				delegates={delegates}
				votes={votes}
				voteDelegates={[]}
				unvoteDelegates={[]}
				onContinue={onContinue}
				selectedWallet={wallet}
				maxVotes={wallet.network().maximumVotesPerTransaction()}
			/>,
		);
		const selectButton = screen.getByTestId("DelegateRow__toggle-0");

		act(() => {
			fireEvent.click(selectButton);
		});

		expect(screen.getByTestId("DelegateTable__footer")).toBeTruthy();

		act(() => {
			fireEvent.click(screen.getByTestId("DelegateTable__continue-button"));
		});

		expect(container).toBeTruthy();
		expect(onContinue).toHaveBeenCalledWith(voteDelegates, []);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should navigate to the next and previous pages", () => {
		const delegatesList = Array.from({ length: 52 }).fill(delegates[0]) as Contracts.IReadOnlyWallet[];

		render(
			<DelegateTable
				delegates={delegatesList}
				votes={votes}
				voteDelegates={[]}
				unvoteDelegates={[]}
				selectedWallet={wallet}
				maxVotes={wallet.network().maximumVotesPerTransaction()}
			/>,
		);

		expect(screen.getByTestId("DelegateRow__toggle-1")).toBeTruthy();

		act(() => {
			fireEvent.click(screen.getByTestId("Pagination__next"));
		});

		expect(screen.getByTestId("DelegateRow__toggle-0")).toBeTruthy();

		act(() => {
			fireEvent.click(screen.getByTestId("Pagination__previous"));
		});

		expect(screen.getByTestId("DelegateRow__toggle-1")).toBeTruthy();
	});

	it("should not show pagination", () => {
		render(
			<DelegateTable
				delegates={delegates}
				votes={votes}
				voteDelegates={[]}
				unvoteDelegates={[]}
				selectedWallet={wallet}
				maxVotes={wallet.network().maximumVotesPerTransaction()}
			/>,
		);

		expect(screen.queryByTestId("Pagination__next")).not.toBeInTheDocument();
	});
});
