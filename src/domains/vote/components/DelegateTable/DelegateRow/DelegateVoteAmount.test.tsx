import { Contracts } from "@payvo/sdk-profiles";
import { ReadOnlyWallet } from "@payvo/sdk-profiles/distribution/read-only-wallet";
import { fireEvent } from "@testing-library/react";
import { renderHook } from "@testing-library/react-hooks";
import { translations as transactionTranslations } from "domains/transaction/i18n";
import { VoteDelegateProperties } from "domains/vote/components/DelegateTable/DelegateTable.models";
import React from "react";
import { useTranslation } from "react-i18next";
import { data } from "tests/fixtures/coins/ark/devnet/delegates.json";
import { env, getDefaultProfileId, render, screen, waitFor } from "utils/testing-library";

import { DelegateVoteAmount } from "./DelegateVoteAmount";

let wallet: Contracts.IReadWriteWallet;
let delegate: Contracts.IReadOnlyWallet;

let Component: () => JSX.Element;
let walletBalanceMock: jest.SpyInstance;
let votesAmountMinimumMock: jest.SpyInstance;
let votesAmountStepMock: jest.SpyInstance;

const Wrapper = ({ children }: { children: React.ReactNode }) => (
	<table>
		<tbody>
			<tr>{children}</tr>
		</tbody>
	</table>
);

describe("DelegateVoteAmount", () => {
	beforeAll(() => {
		const profile = env.profiles().findById(getDefaultProfileId());
		wallet = profile.wallets().values()[0];

		delegate = new ReadOnlyWallet({
			address: data[0].address,
			explorerLink: "",
			governanceIdentifier: "address",
			isDelegate: true,
			isResignedDelegate: false,
			publicKey: data[0].publicKey,
			username: data[0].username,
		});

		walletBalanceMock = jest.spyOn(wallet, "balance").mockReturnValue(90);
		votesAmountMinimumMock = jest.spyOn(wallet.network(), "votesAmountMinimum").mockReturnValue(10);
		votesAmountStepMock = jest.spyOn(wallet.network(), "votesAmountStep").mockReturnValue(10);

		const selectedVotes: VoteDelegateProperties[] = [
			{
				amount: 0,
				delegateAddress: delegate.address(),
			},
		];

		// eslint-disable-next-line react/display-name
		Component = () => (
			<Wrapper>
				<DelegateVoteAmount
					isSelectedVote={true}
					isSelectedUnvote={false}
					selectedWallet={wallet}
					selectedUnvotes={[]}
					selectedVotes={selectedVotes}
					toggleUnvotesSelected={jest.fn()}
					toggleVotesSelected={jest.fn()}
					delegateAddress={delegate.address()}
					availableBalance={wallet.balance()}
					setAvailableBalance={jest.fn()}
				/>
			</Wrapper>
		);
	});

	afterAll(() => {
		walletBalanceMock.mockRestore();
		votesAmountMinimumMock.mockRestore();
		votesAmountStepMock.mockRestore();
	});

	it.each([true, false])("should render when isCompact = %s", (isCompact: boolean) => {
		const { container, asFragment } = render(
			<Wrapper>
				<DelegateVoteAmount
					isSelectedVote={true}
					isSelectedUnvote={false}
					selectedWallet={wallet}
					selectedUnvotes={[]}
					selectedVotes={[]}
					toggleUnvotesSelected={jest.fn()}
					toggleVotesSelected={jest.fn()}
					delegateAddress={delegate.address()}
					availableBalance={wallet.balance()}
					setAvailableBalance={jest.fn()}
					isCompact={isCompact}
				/>
			</Wrapper>,
		);

		expect(container).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should change alignment of input by focus", () => {
		const { container, asFragment } = render(
			<Wrapper>
				<DelegateVoteAmount
					isSelectedVote={false}
					isSelectedUnvote={false}
					selectedWallet={wallet}
					selectedUnvotes={[]}
					selectedVotes={[]}
					toggleUnvotesSelected={jest.fn()}
					toggleVotesSelected={jest.fn()}
					delegateAddress={delegate.address()}
					availableBalance={wallet.balance()}
					setAvailableBalance={jest.fn()}
				/>
			</Wrapper>,
		);

		const amountField = screen.getByTestId("InputCurrency");

		expect(amountField).toHaveClass("text-right");

		fireEvent.focus(amountField);

		expect(amountField).toHaveClass("text-left");

		fireEvent.blur(amountField);

		expect(amountField).toHaveClass("text-right");

		expect(container).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should focus on the input by clicking on ticker", async () => {
		render(
			<Wrapper>
				<DelegateVoteAmount
					isSelectedVote={true}
					isSelectedUnvote={false}
					selectedWallet={wallet}
					selectedUnvotes={[]}
					selectedVotes={[]}
					toggleUnvotesSelected={jest.fn()}
					toggleVotesSelected={jest.fn()}
					delegateAddress={delegate.address()}
					availableBalance={wallet.balance()}
					setAvailableBalance={jest.fn()}
				/>
			</Wrapper>,
		);

		const amountField = screen.getByTestId("InputCurrency");

		expect(amountField).toHaveClass("text-right");

		fireEvent.click(screen.getByTestId("DelegateVoteAmount__ticker"));

		await waitFor(() => expect(amountField).toHaveClass("text-left"), { timeout: 4000 });
	});

	it("should not focus on the input by clicking on ticker if it is selected unvote", async () => {
		render(
			<Wrapper>
				<DelegateVoteAmount
					isSelectedVote={true}
					isSelectedUnvote={true}
					selectedWallet={wallet}
					selectedUnvotes={[]}
					selectedVotes={[]}
					toggleUnvotesSelected={jest.fn()}
					toggleVotesSelected={jest.fn()}
					delegateAddress={delegate.address()}
					availableBalance={wallet.balance()}
					setAvailableBalance={jest.fn()}
				/>
			</Wrapper>,
		);

		const amountField = screen.getByTestId("InputCurrency");

		expect(amountField).toHaveClass("text-right");

		fireEvent.click(screen.getByTestId("DelegateVoteAmount__ticker"));

		await waitFor(() => expect(amountField).not.toHaveClass("text-left"), { timeout: 4000 });
	});

	describe("Validations", () => {
		it("should show error if value is below minimum", async () => {
			const {
				result: {
					current: { t },
				},
			} = renderHook(() => useTranslation());
			render(<Component />);

			fireEvent.input(screen.getByTestId("InputCurrency"), { target: { value: 3 } });

			await waitFor(() => {
				expect(screen.getByTestId("Input__error")).toBeVisible();
				expect(screen.getByTestId("Input__error")).toHaveAttribute(
					"data-errortext",
					t("VOTE.DELEGATE_TABLE.VOTE_AMOUNT.VALIDATION.MINIMUM_AMOUNT", {
						coinId: wallet.network().coin(),
						minimumAmount: wallet.network().votesAmountMinimum(),
					}),
				);
			});
		});

		it("should show error if value isn't multiple of votesAmountStep", async () => {
			const {
				result: {
					current: { t },
				},
			} = renderHook(() => useTranslation());
			render(<Component />);

			fireEvent.input(screen.getByTestId("InputCurrency"), { target: { value: 12 } });

			await waitFor(() => {
				expect(screen.getByTestId("Input__error")).toBeVisible();
				expect(screen.getByTestId("Input__error")).toHaveAttribute(
					"data-errortext",
					t("VOTE.DELEGATE_TABLE.VOTE_AMOUNT.VALIDATION.AMOUNT_STEP", {
						coinId: wallet.network().coin(),
						step: wallet.network().votesAmountStep(),
					}),
				);
			});
		});

		it("should show error if value is more than the available balance", async () => {
			render(<Component />);

			fireEvent.input(screen.getByTestId("InputCurrency"), { target: { value: 100 } });

			await waitFor(() => {
				expect(screen.getByTestId("Input__error")).toBeVisible();
				expect(screen.getByTestId("Input__error")).toHaveAttribute(
					"data-errortext",
					transactionTranslations.VALIDATION.LOW_BALANCE,
				);
			});
		});

		it("should show error if value isn't number", async () => {
			const {
				result: {
					current: { t },
				},
			} = renderHook(() => useTranslation());
			render(<Component />);

			fireEvent.input(screen.getByTestId("InputCurrency"), { target: { value: "test" } });

			await waitFor(() => {
				expect(screen.getByTestId("Input__error")).toBeVisible();
				expect(screen.getByTestId("Input__error")).toHaveAttribute(
					"data-errortext",
					t("VOTE.DELEGATE_TABLE.VOTE_AMOUNT.VALIDATION.MINIMUM_AMOUNT", {
						coinId: wallet.network().coin(),
						minimumAmount: wallet.network().votesAmountMinimum(),
					}),
				);
			});
		});
	});

	it("should hide error after inputs changed", async () => {
		render(<Component />);

		fireEvent.input(screen.getByTestId("InputCurrency"), { target: { value: 3 } });

		await waitFor(() => {
			expect(screen.getByTestId("Input__error")).toBeVisible();
		});

		fireEvent.input(screen.getByTestId("InputCurrency"), { target: { value: 10 } });

		await waitFor(() => {
			expect(screen.queryByTestId("Input__error")).not.toBeInTheDocument();
		});
	});

	describe("Rendering initial amount", () => {
		it("should render with selectedVotes", async () => {
			const selectedVotes: VoteDelegateProperties[] = [
				{
					amount: 10,
					delegateAddress: delegate.address(),
				},
			];

			render(
				<Wrapper>
					<DelegateVoteAmount
						isSelectedVote={true}
						isSelectedUnvote={false}
						selectedWallet={wallet}
						selectedUnvotes={[]}
						selectedVotes={selectedVotes}
						toggleUnvotesSelected={jest.fn()}
						toggleVotesSelected={jest.fn()}
						delegateAddress={delegate.address()}
						availableBalance={wallet.balance()}
						setAvailableBalance={jest.fn()}
					/>
				</Wrapper>,
			);

			await waitFor(() => {
				expect(screen.getByTestId("InputCurrency")).toHaveValue("10");
			});
		});

		it("should render with selectedUnvotes", async () => {
			const voted: Contracts.VoteRegistryItem = {
				amount: 30,
				wallet: delegate,
			};
			const selectedUnvotes: VoteDelegateProperties[] = [
				{
					amount: 20,
					delegateAddress: delegate.address(),
				},
			];

			render(
				<Wrapper>
					<DelegateVoteAmount
						isSelectedVote={true}
						isSelectedUnvote={false}
						selectedWallet={wallet}
						selectedUnvotes={selectedUnvotes}
						selectedVotes={[]}
						voted={voted}
						toggleUnvotesSelected={jest.fn()}
						toggleVotesSelected={jest.fn()}
						delegateAddress={delegate.address()}
						availableBalance={wallet.balance()}
						setAvailableBalance={jest.fn()}
					/>
				</Wrapper>,
			);

			await waitFor(() => {
				expect(screen.getByTestId("InputCurrency")).toHaveValue("10");
			});
		});

		it("should render with voted delegate", async () => {
			const voted: Contracts.VoteRegistryItem = {
				amount: 30,
				wallet: delegate,
			};

			render(
				<Wrapper>
					<DelegateVoteAmount
						isSelectedVote={true}
						isSelectedUnvote={false}
						selectedWallet={wallet}
						selectedUnvotes={[]}
						selectedVotes={[]}
						voted={voted}
						toggleUnvotesSelected={jest.fn()}
						toggleVotesSelected={jest.fn()}
						delegateAddress={delegate.address()}
						availableBalance={wallet.balance()}
						setAvailableBalance={jest.fn()}
					/>
				</Wrapper>,
			);

			await waitFor(() => {
				expect(screen.getByTestId("InputCurrency")).toHaveValue("30");
			});
		});

		it("should render with changed the amount voted when there is voted delegate", async () => {
			const voted: Contracts.VoteRegistryItem = {
				amount: 30,
				wallet: delegate,
			};

			const VoteAmount = ({
				selectedUnvotes,
				selectedVotes,
			}: {
				selectedUnvotes: VoteDelegateProperties[];
				selectedVotes: VoteDelegateProperties[];
			}) => (
				<Wrapper>
					<DelegateVoteAmount
						isSelectedVote={true}
						isSelectedUnvote={false}
						selectedWallet={wallet}
						selectedUnvotes={selectedUnvotes}
						selectedVotes={selectedVotes}
						voted={voted}
						toggleUnvotesSelected={jest.fn()}
						toggleVotesSelected={jest.fn()}
						delegateAddress={delegate.address()}
						availableBalance={wallet.balance()}
						setAvailableBalance={jest.fn()}
					/>
				</Wrapper>
			);

			const selectedVotes: VoteDelegateProperties[] = [
				{
					amount: 20,
					delegateAddress: delegate.address(),
				},
			];
			const { rerender, unmount } = render(<VoteAmount selectedUnvotes={[]} selectedVotes={selectedVotes} />);

			await waitFor(() => {
				expect(screen.getByTestId("InputCurrency")).toHaveValue("50");
			});

			unmount();

			// when there is an error
			selectedVotes[0].amount = 0;

			rerender(<VoteAmount selectedUnvotes={[]} selectedVotes={selectedVotes} />);

			await waitFor(() => {
				expect(screen.getByTestId("InputCurrency")).not.toHaveValue();
			});

			unmount();

			const selectedUnvotes: VoteDelegateProperties[] = [
				{
					amount: 20,
					delegateAddress: delegate.address(),
				},
			];

			rerender(<VoteAmount selectedUnvotes={selectedUnvotes} selectedVotes={[]} />);

			await waitFor(() => {
				expect(screen.getByTestId("InputCurrency")).toHaveValue("10");
			});

			unmount();

			// when there is an error
			selectedUnvotes[0].amount = 0;

			rerender(<VoteAmount selectedUnvotes={selectedUnvotes} selectedVotes={[]} />);

			await waitFor(() => {
				expect(screen.getByTestId("InputCurrency")).not.toHaveValue();
			});
		});
	});

	it("should calculate remaining balance and update votes", async () => {
		const toggleVotesSelected = jest.fn();
		let availableBalance = wallet.balance();
		const setAvailableBalance = jest.fn((balance: number) => (availableBalance = balance));
		const selectedVotes: VoteDelegateProperties[] = [
			{
				amount: 0,
				delegateAddress: delegate.address(),
			},
		];

		const VoteAmount = () => (
			<Wrapper>
				<DelegateVoteAmount
					isSelectedVote={true}
					isSelectedUnvote={false}
					selectedWallet={wallet}
					selectedUnvotes={[]}
					selectedVotes={selectedVotes}
					toggleUnvotesSelected={jest.fn()}
					toggleVotesSelected={toggleVotesSelected}
					delegateAddress={delegate.address()}
					availableBalance={availableBalance}
					setAvailableBalance={setAvailableBalance}
				/>
			</Wrapper>
		);

		const { rerender } = render(<VoteAmount />);

		const amountField = screen.getByTestId("InputCurrency");

		fireEvent.input(amountField, { target: { value: 10 } });

		await waitFor(() => {
			expect(toggleVotesSelected).toHaveBeenLastCalledWith(delegate.address(), 10);
			expect(setAvailableBalance).toHaveBeenLastCalledWith(80);
		});

		rerender(<VoteAmount />);

		fireEvent.input(amountField, { target: { value: 20 } });

		await waitFor(() => {
			expect(toggleVotesSelected).toHaveBeenLastCalledWith(delegate.address(), 20);
			expect(setAvailableBalance).toHaveBeenLastCalledWith(70);
		});
	});

	it("should calculate net amount", async () => {
		let availableBalance = wallet.balance();
		const setAvailableBalance = jest.fn((balance: number) => (availableBalance = balance));

		const VoteAmount = () => (
			<Wrapper>
				<DelegateVoteAmount
					isSelectedVote={true}
					isSelectedUnvote={false}
					selectedWallet={wallet}
					selectedUnvotes={[]}
					selectedVotes={[]}
					toggleUnvotesSelected={jest.fn()}
					toggleVotesSelected={jest.fn()}
					delegateAddress={delegate.address()}
					availableBalance={availableBalance}
					setAvailableBalance={setAvailableBalance}
				/>
			</Wrapper>
		);

		const { rerender } = render(<VoteAmount />);

		const amountField = screen.getByTestId("InputCurrency");

		fireEvent.input(amountField, { target: { value: 10 } });

		await waitFor(() => {
			expect(setAvailableBalance).toHaveBeenLastCalledWith(80);
		});

		rerender(<VoteAmount />);

		fireEvent.input(amountField, { target: { value: 20 } });

		await waitFor(() => {
			expect(setAvailableBalance).toHaveBeenLastCalledWith(70);
		});

		rerender(<VoteAmount />);

		fireEvent.input(amountField, { target: { value: 10 } });

		await waitFor(() => {
			expect(setAvailableBalance).toHaveBeenLastCalledWith(80);
		});
	});

	it("should calculate net amount when there is a voted delegate", async () => {
		let availableBalance = wallet.balance();
		const toggleUnvotesSelected = jest.fn();
		const toggleVotesSelected = jest.fn();
		const setAvailableBalance = jest.fn((balance: number) => (availableBalance = balance));
		const voted: Contracts.VoteRegistryItem = {
			amount: 30,
			wallet: delegate,
		};

		const VoteAmount = () => (
			<Wrapper>
				<DelegateVoteAmount
					isSelectedVote={true}
					isSelectedUnvote={false}
					selectedWallet={wallet}
					selectedUnvotes={[]}
					selectedVotes={[]}
					voted={voted}
					toggleUnvotesSelected={toggleUnvotesSelected}
					toggleVotesSelected={toggleVotesSelected}
					delegateAddress={delegate.address()}
					availableBalance={availableBalance}
					setAvailableBalance={setAvailableBalance}
				/>
			</Wrapper>
		);

		const { rerender } = render(<VoteAmount />);

		const amountField = screen.getByTestId("InputCurrency");

		expect(amountField).toHaveValue("30");

		fireEvent.input(amountField, { target: { value: 40 } });

		await waitFor(() => {
			expect(toggleUnvotesSelected).not.toHaveBeenCalled();
			expect(toggleVotesSelected).toHaveBeenLastCalledWith(delegate.address(), 10);
			expect(setAvailableBalance).toHaveBeenLastCalledWith(80);
		});

		rerender(<VoteAmount />);

		fireEvent.input(amountField, { target: { value: 50 } });

		await waitFor(() => {
			expect(toggleUnvotesSelected).not.toHaveBeenCalled();
			expect(toggleVotesSelected).toHaveBeenLastCalledWith(delegate.address(), 20);
			expect(setAvailableBalance).toHaveBeenLastCalledWith(70);
		});

		rerender(<VoteAmount />);

		fireEvent.input(amountField, { target: { value: 0 } });

		await waitFor(() => {
			expect(toggleUnvotesSelected).toHaveBeenLastCalledWith(delegate.address(), 0);
			expect(toggleVotesSelected).toHaveBeenLastCalledWith(delegate.address());
			expect(setAvailableBalance).toHaveBeenLastCalledWith(90);
		});

		rerender(<VoteAmount />);

		fireEvent.input(amountField, { target: { value: 10 } });

		await waitFor(() => {
			expect(toggleUnvotesSelected).toHaveBeenLastCalledWith(delegate.address(), 20);
			expect(setAvailableBalance).toHaveBeenLastCalledWith(90);
		});

		rerender(<VoteAmount />);

		fireEvent.input(amountField, { target: { value: 30 } });

		await waitFor(() => {
			expect(toggleUnvotesSelected).toHaveBeenLastCalledWith(delegate.address());
			expect(setAvailableBalance).toHaveBeenLastCalledWith(90);
		});

		rerender(<VoteAmount />);

		fireEvent.input(amountField, { target: { value: 20 } });

		await waitFor(() => {
			expect(toggleUnvotesSelected).toHaveBeenLastCalledWith(delegate.address(), 10);
			expect(setAvailableBalance).toHaveBeenLastCalledWith(90);
		});

		rerender(<VoteAmount />);

		fireEvent.input(amountField, { target: { value: 60 } });

		await waitFor(() => {
			expect(toggleUnvotesSelected).toHaveBeenLastCalledWith(delegate.address());
			expect(toggleVotesSelected).toHaveBeenLastCalledWith(delegate.address(), 30);
			expect(setAvailableBalance).toHaveBeenLastCalledWith(60);
		});

		rerender(<VoteAmount />);

		fireEvent.input(amountField, { target: { value: 30 } });

		await waitFor(() => {
			expect(toggleUnvotesSelected).toHaveBeenLastCalledWith(delegate.address());
			expect(setAvailableBalance).toHaveBeenLastCalledWith(90);
		});
	});

	describe("disabled", () => {
		it("should render disabled", () => {
			render(
				<Wrapper>
					<DelegateVoteAmount
						isSelectedVote={false}
						isSelectedUnvote={false}
						selectedWallet={wallet}
						selectedUnvotes={[]}
						selectedVotes={[]}
						toggleUnvotesSelected={jest.fn()}
						toggleVotesSelected={jest.fn()}
						delegateAddress={delegate.address()}
						availableBalance={wallet.balance()}
						setAvailableBalance={jest.fn()}
					/>
				</Wrapper>,
			);

			expect(screen.getByTestId("InputCurrency")).toBeDisabled();
		});

		it("should hide error after disabled", async () => {
			const VoteAmount = ({ isSelectedVote }: { isSelectedVote: boolean }) => (
				<Wrapper>
					<DelegateVoteAmount
						isSelectedVote={isSelectedVote}
						isSelectedUnvote={false}
						selectedWallet={wallet}
						selectedUnvotes={[]}
						selectedVotes={[]}
						toggleUnvotesSelected={jest.fn()}
						toggleVotesSelected={jest.fn()}
						delegateAddress={delegate.address()}
						availableBalance={wallet.balance()}
						setAvailableBalance={jest.fn()}
					/>
				</Wrapper>
			);

			const { rerender } = render(<VoteAmount isSelectedVote />);

			fireEvent.input(screen.getByTestId("InputCurrency"), { target: { value: 3 } });

			await waitFor(() => {
				expect(screen.getByTestId("Input__error")).toBeVisible();
			});

			rerender(<VoteAmount isSelectedVote={false} />);

			await waitFor(() => {
				expect(screen.queryByTestId("Input__error")).not.toBeInTheDocument();
			});
		});

		it("should reset fields and calculate remaining balance", async () => {
			let availableBalance = wallet.balance();
			const toggleVotesSelected = jest.fn();
			const setAvailableBalance = jest.fn((balance: number) => (availableBalance = balance));

			const VoteAmount = ({ isSelectedVote }: { isSelectedVote: boolean }) => (
				<Wrapper>
					<DelegateVoteAmount
						isSelectedVote={isSelectedVote}
						isSelectedUnvote={false}
						selectedWallet={wallet}
						selectedUnvotes={[]}
						selectedVotes={[]}
						toggleUnvotesSelected={jest.fn()}
						toggleVotesSelected={toggleVotesSelected}
						delegateAddress={delegate.address()}
						availableBalance={availableBalance}
						setAvailableBalance={setAvailableBalance}
					/>
				</Wrapper>
			);

			const { rerender } = render(<VoteAmount isSelectedVote />);

			fireEvent.input(screen.getByTestId("InputCurrency"), { target: { value: 10 } });

			await waitFor(() => {
				expect(setAvailableBalance).toHaveBeenLastCalledWith(80);
			});

			expect(toggleVotesSelected).toHaveBeenCalledTimes(1);

			rerender(<VoteAmount isSelectedVote={false} />);

			expect(screen.getByTestId("InputCurrency")).not.toHaveValue();

			await waitFor(() => {
				expect(setAvailableBalance).toHaveBeenLastCalledWith(90);
			});

			expect(toggleVotesSelected).toHaveBeenCalledTimes(1);
		});

		it("should reset fields and calculate remaining balance when unvote if there is voted delegate", async () => {
			let availableBalance = wallet.balance();
			const setAvailableBalance = jest.fn((balance: number) => (availableBalance = balance));
			const voted: Contracts.VoteRegistryItem = {
				amount: 30,
				wallet: delegate,
			};

			const VoteAmount = ({ isSelectedUnvote }: { isSelectedUnvote: boolean }) => (
				<Wrapper>
					<DelegateVoteAmount
						isSelectedVote={true}
						isSelectedUnvote={isSelectedUnvote}
						selectedWallet={wallet}
						selectedUnvotes={[]}
						selectedVotes={[]}
						voted={voted}
						toggleUnvotesSelected={jest.fn()}
						toggleVotesSelected={jest.fn()}
						delegateAddress={delegate.address()}
						availableBalance={availableBalance}
						setAvailableBalance={setAvailableBalance}
					/>
				</Wrapper>
			);

			const { rerender } = render(<VoteAmount isSelectedUnvote={false} />);

			const amountField = screen.getByTestId("InputCurrency");

			expect(amountField).toHaveValue("30");

			fireEvent.input(amountField, { target: { value: 20 } });

			await waitFor(() => {
				expect(setAvailableBalance).toHaveBeenLastCalledWith(90);
			});

			rerender(<VoteAmount isSelectedUnvote />);

			expect(screen.getByTestId("InputCurrency")).not.toHaveValue();

			await waitFor(() => {
				expect(setAvailableBalance).toHaveBeenLastCalledWith(90);
			});

			rerender(<VoteAmount isSelectedUnvote={false} />);

			fireEvent.input(amountField, { target: { value: 50 } });

			await waitFor(() => {
				expect(setAvailableBalance).toHaveBeenLastCalledWith(70);
			});

			rerender(<VoteAmount isSelectedUnvote />);

			expect(screen.getByTestId("InputCurrency")).not.toHaveValue();

			await waitFor(() => {
				expect(setAvailableBalance).toHaveBeenLastCalledWith(90);
			});
		});
	});
});
