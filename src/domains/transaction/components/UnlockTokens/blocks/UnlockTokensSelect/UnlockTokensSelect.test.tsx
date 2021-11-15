import { BigNumber } from "@payvo/sdk-helpers";
import { DateTime } from "@payvo/sdk-intl";
import { LSK } from "@payvo/sdk-lsk";
import { Contracts } from "@payvo/sdk-profiles";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as useFeesHook from "app/hooks/use-fees";
import { buildTranslations } from "app/i18n/helpers";
import nock from "nock";
import React, { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { env } from "utils/testing-library";

import { UnlockableBalance, UnlockTokensFormState } from "../../UnlockTokens.contracts";
import { UnlockTokensSelect } from "./UnlockTokensSelect";

const translations = buildTranslations();

describe("UnlockTokensSelect", () => {
	let profile: Contracts.IProfile;
	let wallet: Contracts.IReadWriteWallet;

	const fee = 1.1;

	const items: UnlockableBalance[] = [
		{
			address: "lskw7488a9nqy6m3zkg68x6ynsp6ohg4y7wazs3mw",
			amount: BigNumber.make(10),
			height: "123",
			id: "1",
			isReady: true,
			timestamp: DateTime.make("2020-06-01T00:00:00.000Z"), // 1 month ago
		},
		{
			address: "lskpyemv8bmamz5p8ub326cbgmob2p7yk9etf9nu4",
			amount: BigNumber.make(20),
			height: "234",
			id: "2",
			isReady: true,
			timestamp: DateTime.make("2020-06-15T00:00:00.000Z"), // 2 weeks ago
		},
		{
			address: "lsktxcop8edco2bpxnqhy7q23fvuuym3kav3ayfz3",
			amount: BigNumber.make(30),
			height: "345",
			id: "3",
			isReady: false,
			timestamp: DateTime.make("2020-08-01T00:00:00.000Z"), // unlockable in 1 month
		},
		{
			address: "lskq5f9dn2d548qwsnnyuua9e54wknq5zyro88btc",
			amount: BigNumber.make(40),
			height: "456",
			id: "4",
			isReady: false,
			timestamp: DateTime.make("2020-09-01T00:00:00.000Z"), // unlockable in 2 months
		},
	];

	beforeAll(async () => {
		nock.disableNetConnect();

		env.registerCoin("LSK", LSK);

		profile = env.profiles().create("empty");

		const generated = await profile.walletFactory().generate({
			coin: "LSK",
			network: "lsk.testnet",
		});

		wallet = generated.wallet;

		profile.wallets().push(wallet);

		jest.spyOn(useFeesHook, "useFees").mockReturnValue({
			calculate: () => Promise.resolve({ avg: fee, max: fee, min: fee, static: fee }),
		});
	});

	const Wrapper = ({ children }: any) => {
		const form = useForm<UnlockTokensFormState>({
			defaultValues: {
				amount: 0,
				fee: 0,
				selectedObjects: [],
			},
			mode: "onChange",
		});

		const { register } = form;

		useEffect(() => {
			register("amount");
			register("fee");
			register("selectedObjects");
		}, [register]);

		return <FormProvider {...form}>{children}</FormProvider>;
	};

	it("should render", async () => {
		const onClose = jest.fn();

		const { asFragment } = render(
			<Wrapper>
				<UnlockTokensSelect
					items={items}
					loading={false}
					wallet={wallet}
					profile={profile}
					onClose={onClose}
					onUnlock={jest.fn()}
				/>
			</Wrapper>,
		);

		await waitFor(() => expect(screen.getAllByTestId("TableRow")).toHaveLength(4));

		expect(asFragment()).toMatchSnapshot();

		userEvent.click(screen.getByText(translations.COMMON.CLOSE));

		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("should render loading", async () => {
		render(
			<Wrapper>
				<UnlockTokensSelect
					items={[]}
					loading={true}
					wallet={wallet}
					profile={profile}
					onClose={jest.fn()}
					onUnlock={jest.fn()}
				/>
			</Wrapper>,
		);

		await waitFor(() => expect(screen.getAllByTestId("TableRow")).toHaveLength(3));

		expect(screen.getAllByTestId("TableRow")[0].querySelector(".react-loading-skeleton")).not.toBeNull();
	});

	it("should render empty", async () => {
		const { asFragment } = render(
			<Wrapper>
				<UnlockTokensSelect
					items={[]}
					loading={false}
					wallet={wallet}
					profile={profile}
					onClose={jest.fn()}
					onUnlock={jest.fn()}
				/>
			</Wrapper>,
		);

		await screen.findByTestId("EmptyBlock");

		expect(asFragment()).toMatchSnapshot();
	});

	it("should pre-select unlockable items on first load", async () => {
		render(
			<Wrapper>
				<UnlockTokensSelect
					isFirstLoad={true}
					items={items}
					loading={false}
					wallet={wallet}
					profile={profile}
					onClose={jest.fn()}
					onUnlock={jest.fn()}
				/>
			</Wrapper>,
		);

		await waitFor(() => expect(screen.getAllByTestId("TableRow")).toHaveLength(4));

		expect(screen.getAllByRole("checkbox", { checked: true })).toHaveLength(3);
	});

	it("should allow selection of unlockable items", async () => {
		const onUnlock = jest.fn();

		render(
			<Wrapper>
				<UnlockTokensSelect
					items={items}
					loading={false}
					wallet={wallet}
					profile={profile}
					onClose={jest.fn()}
					onUnlock={onUnlock}
				/>
			</Wrapper>,
		);

		await waitFor(() => expect(screen.getAllByTestId("TableRow")).toHaveLength(4));

		const getAmount = () => within(screen.getAllByTestId("UnlockTokensTotal")[0]).getByTestId("Amount").textContent;
		const getFees = () => within(screen.getAllByTestId("UnlockTokensTotal")[1]).getByTestId("Amount").textContent;

		expect(getAmount()).toBe("0 LSK");
		expect(getFees()).toBe("0 LSK");

		expect(screen.getAllByRole("checkbox", { checked: false })).toHaveLength(5); // one for selectAll + one for each item

		// select single

		userEvent.click(screen.getAllByRole("checkbox")[1]);

		expect(screen.getAllByRole("checkbox", { checked: true })).toHaveLength(1);
		expect(screen.getAllByRole("checkbox", { checked: false })).toHaveLength(4);

		await waitFor(() => expect(getAmount()).toBe("+ 10 LSK"));

		expect(getFees()).toBe("- 1.1 LSK");

		// toggle select single

		userEvent.click(screen.getAllByRole("checkbox")[1]);

		await waitFor(() => expect(screen.getAllByRole("checkbox", { checked: false })).toHaveLength(5));

		expect(getAmount()).toBe("0 LSK");
		expect(getFees()).toBe("0 LSK");

		// select all

		userEvent.click(screen.getAllByRole("checkbox")[0]);

		await waitFor(() => expect(screen.getAllByRole("checkbox", { checked: true })).toHaveLength(3));

		expect(getAmount()).toBe("+ 30 LSK");
		expect(getFees()).toBe("- 1.1 LSK");

		// toggle select all (uncheck all)

		userEvent.click(screen.getAllByRole("checkbox")[0]);

		await waitFor(() => expect(screen.getAllByRole("checkbox", { checked: false })).toHaveLength(5));

		expect(getAmount()).toBe("0 LSK");
		expect(getFees()).toBe("0 LSK");

		// unlock

		userEvent.click(screen.getAllByRole("checkbox")[1]);

		await waitFor(() => expect(screen.getAllByRole("checkbox", { checked: true })).toHaveLength(1));

		userEvent.click(screen.getByText(translations.TRANSACTION.UNLOCK_TOKENS.UNLOCK));

		expect(onUnlock).toHaveBeenCalledTimes(1);
	});
});
