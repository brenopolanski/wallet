/* eslint-disable @typescript-eslint/require-await */
import { Contracts } from "@payvo/sdk-profiles";
import { renderHook } from "@testing-library/react-hooks";
import { toasts } from "app/services";
import electron from "electron";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Trans } from "react-i18next";
import { env, fireEvent, getDefaultProfileId, MNEMONICS, render, waitFor } from "utils/testing-library";

import { WalletOverviewStep } from "./WalletOverviewStep";

let profile: Contracts.IProfile;

describe("WalletOverviewStep", () => {
	beforeEach(() => {
		profile = env.profiles().findById(getDefaultProfileId());

		for (const wallet of profile.wallets().values()) {
			profile.wallets().forget(wallet.id());
		}
	});

	describe("Render step", () => {
		it("should render", async () => {
			const { result: form } = renderHook(() =>
				useForm({
					defaultValues: {
						mnemonic: MNEMONICS[0],
						wallet: {
							address: () => "address",
						},
					},
				}),
			);

			jest.spyOn(electron.remote.dialog, "showSaveDialog").mockImplementation(() => ({
				filePath: "filePath",
			}));

			const { getByTestId, asFragment } = render(
				<FormProvider {...form.current}>
					<WalletOverviewStep />
				</FormProvider>,
			);

			expect(asFragment()).toMatchSnapshot();

			const writeTextMock = jest.fn();
			const clipboardOriginal = navigator.clipboard;
			// @ts-ignore
			navigator.clipboard = { writeText: writeTextMock };

			fireEvent.click(getByTestId("CreateWallet__copy"));

			await waitFor(() => expect(writeTextMock).toHaveBeenCalledWith(MNEMONICS[0]));

			// @ts-ignore
			navigator.clipboard = clipboardOriginal;
		});

		it("should show success toast on successful download", async () => {
			const { result: form } = renderHook(() =>
				useForm({
					defaultValues: {
						mnemonic: MNEMONICS[0],
						wallet: {
							address: () => "address",
						},
					},
				}),
			);

			jest.spyOn(electron.remote.dialog, "showSaveDialog").mockImplementation(() => ({
				filePath: "filePath",
			}));

			const toastSpy = jest.spyOn(toasts, "success");

			const { getByTestId } = render(
				<FormProvider {...form.current}>
					<WalletOverviewStep />
				</FormProvider>,
			);

			fireEvent.click(getByTestId("CreateWallet__download"));

			await waitFor(() => {
				expect(toastSpy).toHaveBeenCalledWith(
					<Trans
						components={{ bold: <strong /> }}
						i18nKey="COMMON.SAVE_FILE.SUCCESS"
						values={{ filePath: "filePath" }}
					/>,
				);
			});

			toastSpy.mockRestore();
		});

		it("should not show success toast on cancelled download", async () => {
			const { result: form } = renderHook(() =>
				useForm({
					defaultValues: {
						mnemonic: MNEMONICS[0],
						wallet: {
							address: () => "address",
						},
					},
				}),
			);

			jest.spyOn(electron.remote.dialog, "showSaveDialog").mockImplementation(() => ({
				filePath: undefined,
			}));

			const toastSpy = jest.spyOn(toasts, "success");

			const { getByTestId } = render(
				<FormProvider {...form.current}>
					<WalletOverviewStep />
				</FormProvider>,
			);

			fireEvent.click(getByTestId("CreateWallet__download"));

			expect(toastSpy).not.toHaveBeenCalled();

			toastSpy.mockRestore();
		});

		it("should show error toast on error", async () => {
			const { result: form } = renderHook(() =>
				useForm({
					defaultValues: {
						mnemonic: MNEMONICS[0],
						wallet: {
							address: () => "address",
						},
					},
				}),
			);

			jest.spyOn(electron.remote.dialog, "showSaveDialog").mockImplementation(() => {
				throw new Error("Error");
			});

			const toastSpy = jest.spyOn(toasts, "error");

			const { getByTestId } = render(
				<FormProvider {...form.current}>
					<WalletOverviewStep />
				</FormProvider>,
			);

			fireEvent.click(getByTestId("CreateWallet__download"));

			await waitFor(() => {
				expect(toastSpy).toHaveBeenCalledWith(expect.stringMatching(/Could not save/));
			});

			toastSpy.mockRestore();
		});
	});
});
