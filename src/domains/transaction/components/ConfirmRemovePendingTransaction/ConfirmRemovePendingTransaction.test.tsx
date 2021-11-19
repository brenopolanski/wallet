import { Contracts, DTO } from "@payvo/sdk-profiles";
import { translations } from "domains/transaction/i18n";
import React from "react";
import { env, fireEvent, getDefaultProfileId, render, screen } from "utils/testing-library";

import { ConfirmRemovePendingTransaction } from "./ConfirmRemovePendingTransaction";

describe("ConfirmRemovePendingTransaction", () => {
	let profile: Contracts.IProfile;
	let wallet: Contracts.IReadWriteWallet;
	let transferFixture: DTO.ExtendedSignedTransactionData;
	let multiSignatureFixture: DTO.ExtendedSignedTransactionData;

	beforeEach(async () => {
		profile = env.profiles().findById(getDefaultProfileId());

		wallet = profile.wallets().first();

		await profile.sync();

		transferFixture = new DTO.ExtendedSignedTransactionData(
			await wallet
				.coin()
				.transaction()
				.transfer({
					data: {
						amount: 1,
						to: wallet.address(),
					},
					fee: 0.1,
					nonce: "1",
					signatory: await wallet
						.coin()
						.signatory()
						.multiSignature({
							min: 2,
							publicKeys: [wallet.publicKey()!, profile.wallets().last().publicKey()!],
						}),
				}),
			wallet,
		);

		multiSignatureFixture = new DTO.ExtendedSignedTransactionData(
			await wallet
				.coin()
				.transaction()
				.multiSignature({
					data: {
						min: 2,
						publicKeys: [wallet.publicKey()!, profile.wallets().last().publicKey()!],
						senderPublicKey: wallet.publicKey()!,
					},
					fee: 0.1,
					nonce: "1",
					signatory: await wallet
						.coin()
						.signatory()
						.multiSignature({
							min: 2,
							publicKeys: [wallet.publicKey()!, profile.wallets().last().publicKey()!],
						}),
				}),
			wallet,
		);
	});

	it("should not render if not open", () => {
		const { asFragment } = render(<ConfirmRemovePendingTransaction isOpen={false} />);

		expect(() => screen.getByTestId("modal__inner")).toThrow(/Unable to find an element by/);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should not render if transaction type is not available", () => {
		const { asFragment } = render(<ConfirmRemovePendingTransaction isOpen={true} />);

		expect(() => screen.getByTestId("modal__inner")).toThrow(/Unable to find an element by/);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render multisignature transaction", () => {
		const { asFragment } = render(<ConfirmRemovePendingTransaction isOpen={true} transaction={transferFixture} />);

		expect(screen.getByTestId("modal__inner")).toBeInTheDocument();
		expect(screen.getByTestId("ConfirmRemovePendingTransaction__remove")).toBeInTheDocument();
		expect(screen.getByTestId("ConfirmRemovePendingTransaction__cancel")).toBeInTheDocument();

		expect(
			screen.getByTestId(
				`ConfirmRemovePendingTransaction__${translations.TRANSACTION_TYPES.TRANSFER}-${translations.TRANSACTION}`,
			),
		).toBeInTheDocument();

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render multisignature registration", () => {
		const { asFragment } = render(
			<ConfirmRemovePendingTransaction isOpen={true} transaction={multiSignatureFixture} />,
		);

		expect(screen.getByTestId("modal__inner")).toBeInTheDocument();
		expect(screen.getByTestId("ConfirmRemovePendingTransaction__remove")).toBeInTheDocument();
		expect(screen.getByTestId("ConfirmRemovePendingTransaction__cancel")).toBeInTheDocument();

		expect(
			screen.getByTestId(
				`ConfirmRemovePendingTransaction__${translations.TRANSACTION_TYPES.MULTI_SIGNATURE}-${translations.REGISTRATION}`,
			),
		).toBeInTheDocument();

		expect(asFragment()).toMatchSnapshot();
	});

	it("should handle close", () => {
		const onClose = jest.fn();
		render(<ConfirmRemovePendingTransaction isOpen={true} transaction={multiSignatureFixture} onClose={onClose} />);

		expect(screen.getByTestId("modal__inner")).toBeInTheDocument();
		expect(screen.getByTestId("ConfirmRemovePendingTransaction__remove")).toBeInTheDocument();
		expect(screen.getByTestId("ConfirmRemovePendingTransaction__cancel")).toBeInTheDocument();

		expect(
			screen.getByTestId(
				`ConfirmRemovePendingTransaction__${translations.TRANSACTION_TYPES.MULTI_SIGNATURE}-${translations.REGISTRATION}`,
			),
		).toBeInTheDocument();

		fireEvent.click(screen.getByTestId("ConfirmRemovePendingTransaction__cancel"));

		expect(onClose).toHaveBeenCalledWith(expect.objectContaining({ nativeEvent: expect.any(MouseEvent) }));
	});

	it("should handle remove", () => {
		const onRemove = jest.fn();
		render(
			<ConfirmRemovePendingTransaction isOpen={true} transaction={multiSignatureFixture} onRemove={onRemove} />,
		);

		expect(screen.getByTestId("modal__inner")).toBeInTheDocument();
		expect(screen.getByTestId("ConfirmRemovePendingTransaction__remove")).toBeInTheDocument();
		expect(screen.getByTestId("ConfirmRemovePendingTransaction__cancel")).toBeInTheDocument();

		expect(
			screen.getByTestId(
				`ConfirmRemovePendingTransaction__${translations.TRANSACTION_TYPES.MULTI_SIGNATURE}-${translations.REGISTRATION}`,
			),
		).toBeInTheDocument();

		fireEvent.click(screen.getByTestId("ConfirmRemovePendingTransaction__remove"));

		expect(onRemove).toHaveBeenCalledWith(expect.any(DTO.ExtendedSignedTransactionData));
	});
});
