import { Contracts } from "@payvo/profiles";
import { Networks } from "@payvo/sdk";
import { ARK } from "@payvo/sdk-ark";
import { LSK } from "@payvo/sdk-lsk";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useValidation } from "app/hooks";
import * as useFeesHook from "app/hooks/use-fees";
import { toasts } from "app/services";
import { FeeField } from "domains/transaction/components/FeeField/FeeField";
import { translations } from "domains/transaction/i18n";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { env, getDefaultProfileId, render } from "utils/testing-library";

describe("FeeField", () => {
	let profile: Contracts.IProfile;

	const networksByFeeType = {
		default: new Networks.Network(ARK.manifest, ARK.manifest.networks["ark.devnet"]),
		size: new Networks.Network(LSK.manifest, LSK.manifest.networks["lsk.testnet"]),
	};

	beforeAll(() => {
		env.registerCoin("LSK", LSK);
		profile = env.profiles().findById(getDefaultProfileId());
	});

	const Component = ({ balance = 10, network = networksByFeeType.default, type, data }: any) => {
		const form = useForm({ mode: "onChange" });

		const { register, watch } = form;
		const { common } = useValidation();
		const { fees } = watch();

		register("fee");
		register("fees", common.fee(balance, network, fees));
		register("inputFeeSettings");

		return (
			<FormProvider {...form}>
				<FeeField type={type} data={data} network={network} profile={profile} />
			</FormProvider>
		);
	};

	it("should render", async () => {
		const { asFragment } = render(<Component type="transfer" />);

		await waitFor(() => expect(screen.getAllByTestId("Amount")).toHaveLength(3));

		expect(asFragment()).toMatchSnapshot();
	});

	describe("when network's fee type is size", () => {
		it.each(["transfer", "multiPayment", "vote", "delegateRegistration", "secondSignature"])(
			"should show 0 when %s data is undefined",
			async (transactionType) => {
				render(<Component type={transactionType} network={networksByFeeType.size} data={undefined} />);

				await waitFor(() => expect(screen.getAllByTestId("Amount")).toHaveLength(3));

				expect(screen.getAllByTestId("Amount")[0]).toHaveTextContent("0 LSK");
				expect(screen.getAllByTestId("Amount")[1]).toHaveTextContent("0 LSK");
				expect(screen.getAllByTestId("Amount")[2]).toHaveTextContent("0 LSK");
			},
		);

		it.each(["transfer", "multiPayment", "vote", "delegateRegistration", "secondSignature"])(
			"should show 0 %s data is not available yet",
			async (transactionType) => {
				render(<Component type={transactionType} network={networksByFeeType.size} data={{}} />);

				await waitFor(() => expect(screen.getAllByTestId("Amount")).toHaveLength(3));

				expect(screen.getAllByTestId("Amount")[0]).toHaveTextContent("0 LSK");
				expect(screen.getAllByTestId("Amount")[1]).toHaveTextContent("0 LSK");
				expect(screen.getAllByTestId("Amount")[2]).toHaveTextContent("0 LSK");
			},
		);

		it("should recalculate fees on data changes", async () => {
			const calculate = jest.fn().mockResolvedValue({ avg: 2, max: 2, min: 2, static: 2 });
			const useFeesMock = jest.spyOn(useFeesHook, "useFees").mockImplementation(() => ({ calculate }));

			const properties = { network: networksByFeeType.size, type: "transfer" };

			const { rerender } = render(<Component {...properties} data={{}} />);

			await waitFor(() => expect(screen.getAllByTestId("Amount")[0]).toHaveTextContent("0 LSK"));

			rerender(
				<Component {...properties} data={{ amount: 1, to: "lsktpbzum9d9gnhqu3homwbwo8h238zeo3bhpjocg" }} />,
			);

			await waitFor(() => expect(screen.getAllByTestId("Amount")[0]).toHaveTextContent("2 LSK"));

			calculate.mockRestore();
			useFeesMock.mockRestore();
		});

		it("should override fee when it is lower than the minimum fees", async () => {
			let useFeesSpy: jest.SpyInstance;

			const toastSpy = jest.spyOn(toasts, "warning").mockImplementation();

			useFeesSpy = jest.spyOn(useFeesHook, "useFees").mockReturnValue({
				calculate: () => Promise.resolve({ avg: 3, max: 5, min: 1, static: 3 }),
			});

			const { rerender } = render(
				<Component
					network={networksByFeeType.size}
					type="transfer"
					data={{ amount: 1, to: "lsktpbzum9d9gnhqu3homwbwo8h238zeo3bhpjocg" }}
				/>,
			);

			await waitFor(() => expect(screen.getAllByTestId("Amount")[0]).toHaveTextContent("1 LSK"));

			expect(screen.getAllByTestId("Amount")[1]).toHaveTextContent("3 LSK");
			expect(screen.getAllByTestId("Amount")[2]).toHaveTextContent("5 LSK");
			expect(screen.getAllByRole("radio")[1]).toBeChecked();

			userEvent.click(screen.getByText(translations.INPUT_FEE_VIEW_TYPE.ADVANCED));

			await waitFor(() => expect(screen.getByTestId("InputCurrency")).toHaveValue("3"));

			useFeesSpy = jest.spyOn(useFeesHook, "useFees").mockReturnValue({
				calculate: () => Promise.resolve({ avg: 9, max: 12, min: 6, static: 9 }),
			});

			rerender(
				<Component
					network={networksByFeeType.size}
					type="transfer"
					data={{ amount: 2, to: "lsktpbzum9d9gnhqu3homwbwo8h238zeo3bhpjocg" }}
				/>,
			);

			await waitFor(() => expect(screen.getByTestId("InputCurrency")).toHaveValue("6"));

			expect(toastSpy).toHaveBeenCalledWith(translations.PAGE_TRANSACTION_SEND.FORM_STEP.FEE_UPDATE);

			toastSpy.mockRestore();
			useFeesSpy.mockRestore();
		});
	});

	it("should set fee to fees.avg when it has no value yet", async () => {
		const calculate = jest.fn().mockResolvedValue({ avg: 30, max: 1, min: 1, static: 1 });
		const useFeesMock = jest.spyOn(useFeesHook, "useFees").mockImplementation(() => ({ calculate }));

		render(
			<Component
				network={networksByFeeType.size}
				type="transfer"
				data={{ amount: 1, to: "lsktpbzum9d9gnhqu3homwbwo8h238zeo3bhpjocg" }}
			/>,
		);

		await waitFor(() => expect(screen.getAllByTestId("Amount")[0]).toHaveTextContent("1 LSK"));

		expect(screen.getByRole("radio", { checked: true })).toHaveTextContent("30 LSK");

		calculate.mockRestore();
		useFeesMock.mockRestore();
	});
});
