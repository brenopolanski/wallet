/* eslint-disable @typescript-eslint/require-await */
import { Contracts } from "@payvo/sdk-profiles";
import { renderHook } from "@testing-library/react-hooks";
import { translations as transactionTranslations } from "domains/transaction/i18n";
import nock from "nock";
import React from "react";
import { act } from "react-dom/test-utils";
import { useTranslation } from "react-i18next";
import { Route } from "react-router-dom";
import walletFixture from "tests/fixtures/coins/ark/devnet/wallets/D61mfSggzbvQgTUe6JhYKH2doHaqJ3Dyib.json";
import coldWalletFixture from "tests/fixtures/coins/ark/devnet/wallets/DC8ghUdhS8w8d11K8cFQ37YsLBFhL3Dq2P.json";
import { env, fireEvent, getDefaultProfileId, render, screen, waitFor } from "utils/testing-library";

import { AddParticipant } from "./AddParticipant";

let t: any;

describe("Add Participant", () => {
	let profile: Contracts.IProfile;
	let wallet: Contracts.IReadWriteWallet;
	let wallet2: Contracts.IReadWriteWallet;
	let wallet3: Contracts.IReadWriteWallet;

	beforeEach(async () => {
		const { result } = renderHook(() => useTranslation());
		t = result.current.t;

		profile = env.profiles().findById(getDefaultProfileId());
		wallet = profile.wallets().first();
		wallet2 = profile.wallets().last();

		wallet3 = await profile
			.walletFactory()
			.fromSecret({ coin: wallet.coinId(), network: wallet.networkId(), secret: "passphrase" });

		await profile.sync();
	});

	it("should fail to find", async () => {
		nock("https://ark-test.payvo.com")
			.get("/api/wallets")
			.query({ address: "D61mfSggzbvQgTUe6JhYKH2doHaqJ3Dyiba" })
			.reply(404);

		const { asFragment } = render(
			<Route path="/profiles/:profileId">
				<AddParticipant profile={profile} wallet={wallet} />
			</Route>,
			{
				routes: [`/profiles/${profile.id()}`],
			},
		);

		fireEvent.input(screen.getByTestId("SelectDropdown__input"), {
			target: {
				value: "D61mfSggzbvQgTUe6JhYKH2doHaqJ3Dyiba",
			},
		});

		await waitFor(() => {
			expect(screen.getByTestId("SelectDropdown__input")).toHaveValue("D61mfSggzbvQgTUe6JhYKH2doHaqJ3Dyiba");
		});

		fireEvent.click(screen.getByText(transactionTranslations.MULTISIGNATURE.ADD_PARTICIPANT));

		await waitFor(() => {
			expect(screen.getAllByTestId("Input__error")[0]).toBeVisible();
		});

		expect(screen.getAllByTestId("Input__error")[0]).toHaveAttribute(
			"data-errortext",
			t("TRANSACTION.MULTISIGNATURE.ERROR.ADDRESS_NOT_FOUND"),
		);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should fail with cold wallet", async () => {
		nock("https://ark-test.payvo.com")
			.get("/api/wallets")
			.query({ address: "DC8ghUdhS8w8d11K8cFQ37YsLBFhL3Dq2P" })
			.reply(200, {
				data: [coldWalletFixture.data],
				meta: { count: 1, pageCount: 1, totalCount: 1 },
			});

		const { asFragment } = render(
			<Route path="/profiles/:profileId">
				<AddParticipant profile={profile} wallet={wallet} />
			</Route>,
			{
				routes: [`/profiles/${profile.id()}`],
			},
		);

		fireEvent.input(screen.getByTestId("SelectDropdown__input"), {
			target: {
				value: "DC8ghUdhS8w8d11K8cFQ37YsLBFhL3Dq2P",
			},
		});

		await waitFor(() => {
			expect(screen.getByTestId("SelectDropdown__input")).toHaveValue("DC8ghUdhS8w8d11K8cFQ37YsLBFhL3Dq2P");
		});

		fireEvent.click(screen.getByText(transactionTranslations.MULTISIGNATURE.ADD_PARTICIPANT));

		await waitFor(() => {
			expect(screen.getAllByTestId("Input__error")[0]).toBeVisible();
		});

		expect(screen.getAllByTestId("Input__error")[0]).toHaveAttribute(
			"data-errortext",
			t("TRANSACTION.MULTISIGNATURE.ERROR.PUBLIC_KEY_NOT_FOUND"),
		);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should fail with a duplicate address", async () => {
		const { asFragment } = render(
			<Route path="/profiles/:profileId">
				<AddParticipant
					profile={profile}
					wallet={wallet}
					defaultParticipants={[
						{
							address: wallet.address(),
							publicKey: wallet.publicKey()!,
						},
					]}
				/>
			</Route>,
			{
				routes: [`/profiles/${profile.id()}`],
			},
		);

		fireEvent.input(screen.getByTestId("SelectDropdown__input"), {
			target: {
				value: wallet.address(),
			},
		});

		await waitFor(() => {
			expect(screen.getByTestId("SelectDropdown__input")).toHaveValue(wallet.address());
		});

		fireEvent.click(screen.getByText(transactionTranslations.MULTISIGNATURE.ADD_PARTICIPANT));

		await waitFor(() => {
			expect(screen.getAllByTestId("Input__error")[0]).toBeVisible();
		});

		expect(screen.getAllByTestId("Input__error")[0]).toHaveAttribute(
			"data-errortext",
			t("TRANSACTION.MULTISIGNATURE.ERROR.ADDRESS_ALREADY_ADDED"),
		);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should fail if cannot find the address remotely", async () => {
		nock("https://ark-test.payvo.com")
			.get("/api/wallets")
			.query({ address: "DC8ghUdhS8w8d11K8cFQ37YsLBFhL3Dq20" })
			.reply(200, {
				data: [],
				meta: { count: 0, pageCount: 1, totalCount: 0 },
			});

		const { asFragment } = render(
			<Route path="/profiles/:profileId">
				<AddParticipant profile={profile} wallet={wallet} />
			</Route>,
			{
				routes: [`/profiles/${profile.id()}`],
			},
		);

		fireEvent.input(screen.getByTestId("SelectDropdown__input"), {
			target: {
				value: "DC8ghUdhS8w8d11K8cFQ37YsLBFhL3Dq20",
			},
		});

		await waitFor(() => {
			expect(screen.getByTestId("SelectDropdown__input")).toHaveValue("DC8ghUdhS8w8d11K8cFQ37YsLBFhL3Dq20");
		});

		fireEvent.click(screen.getByText(transactionTranslations.MULTISIGNATURE.ADD_PARTICIPANT));

		await waitFor(() => {
			expect(screen.getAllByTestId("Input__error")[0]).toBeVisible();
		});

		expect(screen.getAllByTestId("Input__error")[0]).toHaveAttribute(
			"data-errortext",
			t("TRANSACTION.MULTISIGNATURE.ERROR.ADDRESS_NOT_FOUND"),
		);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should work with an imported wallet", async () => {
		const onChange = jest.fn();
		const { asFragment } = render(
			<Route path="/profiles/:profileId">
				<AddParticipant profile={profile} wallet={wallet} onChange={onChange} />
			</Route>,
			{
				routes: [`/profiles/${profile.id()}`],
			},
		);

		fireEvent.input(screen.getByTestId("SelectDropdown__input"), {
			target: {
				value: profile.wallets().last().address(),
			},
		});

		fireEvent.click(screen.getByText(transactionTranslations.MULTISIGNATURE.ADD_PARTICIPANT));

		await waitFor(() => expect(screen.getAllByRole("row")).toHaveLength(2));

		expect(onChange).toHaveBeenCalledWith([
			{
				address: "D8rr7B1d6TL6pf14LgMz4sKp1VBMs6YUYD",
				alias: "ARK Wallet 1",
				publicKey: "03df6cd794a7d404db4f1b25816d8976d0e72c5177d17ac9b19a92703b62cdbbbc",
			},
			{
				address: "D5sRKWckH4rE1hQ9eeMeHAepgyC3cvJtwb",
				alias: "ARK Wallet 2",
				publicKey: "03af2feb4fc97301e16d6a877d5b135417e8f284d40fac0f84c09ca37f82886c51",
			},
		]);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should work with a remote wallet", async () => {
		const scope = nock("https://ark-test.payvo.com")
			.get("/api/wallets")
			.query((parameters) => !!parameters.address)
			.reply(200, {
				data: [walletFixture.data],
				meta: { count: 1, pageCount: 1, totalCount: 1 },
			});

		render(
			<Route path="/profiles/:profileId">
				<AddParticipant profile={profile} wallet={wallet} />
			</Route>,
			{
				routes: [`/profiles/${profile.id()}`],
			},
		);

		fireEvent.input(screen.getByTestId("SelectDropdown__input"), {
			target: {
				value: walletFixture.data.address,
			},
		});

		await waitFor(() =>
			expect(screen.getByTestId("SelectDropdown__input")).toHaveValue(walletFixture.data.address),
		);

		fireEvent.click(screen.getByText(transactionTranslations.MULTISIGNATURE.ADD_PARTICIPANT));

		await waitFor(() => expect(screen.getAllByRole("row")).toHaveLength(2));

		expect(scope.isDone()).toBe(true);
	});

	it("should render custom participants", () => {
		const { asFragment } = render(
			<Route path="/profiles/:profileId">
				<AddParticipant
					profile={profile}
					wallet={wallet}
					defaultParticipants={[
						{
							address: wallet2.address(),
							publicKey: wallet2.publicKey()!,
						},
					]}
				/>
			</Route>,
			{
				routes: [`/profiles/${profile.id()}`],
			},
		);

		expect(asFragment()).toMatchSnapshot();
	});

	it("should clear participant field when address is added", async () => {
		nock("https://ark-test.payvo.com")
			.get("/api/wallets")
			.query((parameters) => !!parameters.address)
			.reply(200, {
				data: [walletFixture.data],
				meta: { count: 1, pageCount: 1, totalCount: 1 },
			});

		render(
			<Route path="/profiles/:profileId">
				<AddParticipant profile={profile} wallet={wallet} />
			</Route>,
			{
				routes: [`/profiles/${profile.id()}`],
			},
		);

		expect(screen.queryAllByTestId("recipient-list__recipient-list-item")).toHaveLength(1);

		expect(screen.getByTestId("SelectDropdown__input")).not.toHaveValue();

		// add participant
		fireEvent.input(screen.getByTestId("SelectDropdown__input"), {
			target: {
				value: wallet2.address(),
			},
		});

		fireEvent.click(screen.getByText(transactionTranslations.MULTISIGNATURE.ADD_PARTICIPANT));

		await waitFor(() => expect(screen.queryAllByTestId("recipient-list__recipient-list-item")).toHaveLength(2));

		await waitFor(() => expect(screen.getByTestId("SelectDropdown__input")).not.toHaveValue());

		// add participant
		fireEvent.input(screen.getByTestId("SelectDropdown__input"), {
			target: {
				value: walletFixture.data.address,
			},
		});

		fireEvent.click(screen.getByText(transactionTranslations.MULTISIGNATURE.ADD_PARTICIPANT));

		await waitFor(() => expect(screen.queryAllByTestId("recipient-list__recipient-list-item")).toHaveLength(3));

		await waitFor(() => expect(screen.getByTestId("SelectDropdown__input")).not.toHaveValue());
	});

	it("should remove participant", async () => {
		const onChange = jest.fn();

		render(
			<Route path="/profiles/:profileId">
				<AddParticipant
					profile={profile}
					wallet={wallet}
					onChange={onChange}
					defaultParticipants={[
						{
							address: wallet.address(),
							publicKey: wallet.publicKey()!,
						},
						{
							address: wallet2.address(),
							publicKey: wallet2.publicKey()!,
						},
					]}
				/>
			</Route>,
			{
				routes: [`/profiles/${profile.id()}`],
			},
		);

		await waitFor(() => expect(screen.getAllByRole("row")).toHaveLength(2));

		expect(screen.getAllByTestId("recipient-list__remove-recipient")[1]).not.toBeDisabled();

		fireEvent.click(screen.getAllByTestId("recipient-list__remove-recipient")[1]);

		expect(onChange).toHaveBeenCalledWith([
			{
				address: wallet.address(),
				publicKey: wallet.publicKey()!,
			},
		]);
	});

	it("should not remove own address", async () => {
		render(
			<Route path="/profiles/:profileId">
				<AddParticipant profile={profile} wallet={wallet} />
			</Route>,
			{
				routes: [`/profiles/${profile.id()}`],
			},
		);

		await waitFor(() => expect(screen.getAllByRole("row")).toHaveLength(1));

		expect(screen.getByTestId("recipient-list__remove-recipient")).toBeDisabled();

		fireEvent.click(screen.getByTestId("recipient-list__remove-recipient"));

		await waitFor(() => expect(screen.getAllByRole("row")).toHaveLength(1));
	});

	it("should set a participant as mandatory", async () => {
		const onChangeMandatoryKeys = jest.fn();
		const advancedMultiSignatureTypeMock = jest
			.spyOn(wallet.network(), "multiSignatureType")
			.mockReturnValue("advanced");

		render(
			<Route path="/profiles/:profileId">
				<AddParticipant
					profile={profile}
					wallet={wallet}
					onChangeMandatoryKeys={onChangeMandatoryKeys}
					minRequiredSignatures={2}
					defaultParticipants={[
						{
							address: wallet.address(),
							publicKey: wallet.publicKey()!,
						},
						{
							address: wallet2.address(),
							publicKey: wallet2.publicKey()!,
						},
					]}
				/>
			</Route>,
			{
				routes: [`/profiles/${profile.id()}`],
			},
		);

		await waitFor(() => expect(screen.getAllByRole("row")).toHaveLength(2));

		fireEvent.click(screen.getAllByTestId("RecipientListItem__mandatory-toggle")[0]);

		expect(onChangeMandatoryKeys).toHaveBeenCalledWith([wallet.publicKey()]);

		advancedMultiSignatureTypeMock.mockRestore();
	});

	it("should not set a participant as mandatory if min signatures are not provided", async () => {
		const onChangeMandatoryKeys = jest.fn();
		const advancedMultiSignatureTypeMock = jest
			.spyOn(wallet.network(), "multiSignatureType")
			.mockReturnValue("advanced");

		render(
			<Route path="/profiles/:profileId">
				<AddParticipant
					profile={profile}
					wallet={wallet}
					mandatoryKeys={[]}
					onChangeMandatoryKeys={onChangeMandatoryKeys}
					defaultParticipants={[
						{
							address: wallet.address(),
							publicKey: wallet.publicKey()!,
						},
						{
							address: wallet2.address(),
							publicKey: wallet2.publicKey()!,
						},
					]}
				/>
			</Route>,
			{
				routes: [`/profiles/${profile.id()}`],
			},
		);

		await waitFor(() => expect(screen.getAllByRole("row")).toHaveLength(2));

		fireEvent.click(screen.getAllByTestId("RecipientListItem__mandatory-toggle")[0]);

		expect(onChangeMandatoryKeys).toHaveBeenCalledWith([]);

		advancedMultiSignatureTypeMock.mockRestore();
	});

	it("should not emit mandatory key change event if public key is not provided", async () => {
		const onChangeMandatoryKeys = jest.fn();
		const advancedMultiSignatureTypeMock = jest
			.spyOn(wallet.network(), "multiSignatureType")
			.mockReturnValue("advanced");

		render(
			<Route path="/profiles/:profileId">
				<AddParticipant
					profile={profile}
					wallet={wallet}
					mandatoryKeys={[wallet2.publicKey()!]}
					onChangeMandatoryKeys={onChangeMandatoryKeys}
					minRequiredSignatures={2}
					defaultParticipants={[
						{
							address: wallet.address(),
							// @ts-ignore
							publicKey: undefined,
						},
						{
							address: wallet2.address(),
							publicKey: wallet2.publicKey()!,
						},
					]}
				/>
			</Route>,
			{
				routes: [`/profiles/${profile.id()}`],
			},
		);

		fireEvent.click(screen.getAllByTestId("RecipientListItem__mandatory-toggle")[1]);

		expect(onChangeMandatoryKeys).toHaveBeenCalledTimes(2);

		fireEvent.click(screen.getAllByTestId("RecipientListItem__mandatory-toggle")[0]);

		expect(onChangeMandatoryKeys).toHaveBeenCalledTimes(2);

		advancedMultiSignatureTypeMock.mockRestore();
	});

	it("should not add more mandatory keys than min signatures", async () => {
		const onChangeMandatoryKeys = jest.fn();
		const advancedMultiSignatureTypeMock = jest
			.spyOn(wallet.network(), "multiSignatureType")
			.mockReturnValue("advanced");

		profile.wallets().push(wallet3);

		render(
			<Route path="/profiles/:profileId">
				<AddParticipant
					profile={profile}
					wallet={wallet}
					mandatoryKeys={[wallet2.publicKey()!, wallet3.publicKey()!]}
					onChangeMandatoryKeys={onChangeMandatoryKeys}
					minRequiredSignatures={2}
					defaultParticipants={[
						{
							address: wallet.address(),
							publicKey: wallet.publicKey()!,
						},
						{
							address: wallet2.address(),
							publicKey: wallet2.publicKey()!,
						},
						{
							address: wallet3.address(),
							publicKey: wallet3.publicKey()!,
						},
					]}
				/>
			</Route>,
			{
				routes: [`/profiles/${profile.id()}`],
			},
		);

		expect(onChangeMandatoryKeys).toHaveBeenCalledTimes(1);

		fireEvent.click(screen.getAllByTestId("RecipientListItem__mandatory-toggle")[0]);

		expect(onChangeMandatoryKeys).not.toHaveBeenCalledTimes(2);

		fireEvent.click(screen.getAllByTestId("RecipientListItem__mandatory-toggle")[0]);

		expect(onChangeMandatoryKeys).not.toHaveBeenCalledTimes(2);

		advancedMultiSignatureTypeMock.mockRestore();
	});
});
