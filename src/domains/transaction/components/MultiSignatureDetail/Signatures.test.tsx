import { Contracts, DTO } from "@payvo/sdk-profiles";
import React from "react";
import { env, getDefaultProfileId, render, screen, waitFor } from "utils/testing-library";

import { Signatures } from "./Signatures";

describe("Signatures", () => {
	let profile: Contracts.IProfile;
	let wallet: Contracts.IReadWriteWallet;
	let wallet2: Contracts.IReadWriteWallet;
	let multisignatureTransactionMock: DTO.ExtendedSignedTransactionData;

	beforeEach(async () => {
		profile = env.profiles().findById(getDefaultProfileId());
		wallet = profile.wallets().first();
		wallet2 = profile.wallets().last();

		await profile.sync();

		multisignatureTransactionMock = new DTO.ExtendedSignedTransactionData(
			await wallet
				.coin()
				.transaction()
				.transfer({
					data: {
						amount: 1,
						to: wallet.address(),
					},
					fee: 1,
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

	it("should render", async () => {
		jest.spyOn(wallet.transaction(), "isAwaitingSignatureByPublicKey").mockImplementation((_, publicKey) => {
			if (wallet.publicKey() === publicKey) {
				return true;
			}
			return false;
		});
		jest.spyOn(wallet.transaction(), "isAwaitingOurSignature").mockReturnValue(true);

		const { container } = render(<Signatures transaction={multisignatureTransactionMock} wallet={wallet} />);

		await waitFor(() => expect(screen.getAllByTestId("Signatures__participant-status")).toHaveLength(2));

		expect(screen.getAllByTestId("Signatures__waiting-badge")).toHaveLength(1);
		expect(screen.getAllByTestId("Signatures__signed-badge")).toHaveLength(1);

		expect(container).toMatchSnapshot();
	});

	it("should handle exception when checking if participant is awaiting signature", async () => {
		jest.spyOn(wallet.transaction(), "isAwaitingSignatureByPublicKey").mockImplementation(() => {
			throw new Error("Failed");
		});

		const { container } = render(<Signatures transaction={multisignatureTransactionMock} wallet={wallet} />);

		await waitFor(() => expect(screen.getAllByTestId("Signatures__participant-status")).toHaveLength(2));

		expect(screen.getAllByTestId("Signatures__signed-badge")).toHaveLength(2);

		expect(container).toMatchSnapshot();
	});

	it("should show all participants as signed when all signatures are added", async () => {
		jest.spyOn(multisignatureTransactionMock, "get").mockImplementation((key) => {
			if (key === "multiSignature") {
				return { publicKeys: [wallet.publicKey(), wallet2.publicKey()] };
			}

			if (key === "signatures") {
				return ["1", "2"]; // Only checking lengths
			}
		});

		const { container } = render(<Signatures transaction={multisignatureTransactionMock} wallet={wallet} />);

		await waitFor(() => expect(screen.getAllByTestId("Signatures__participant-status")).toHaveLength(2));

		expect(screen.getAllByTestId("Signatures__signed-badge")).toHaveLength(2);

		expect(container).toMatchSnapshot();
	});

	it("should render with waiting badge", async () => {
		jest.spyOn(multisignatureTransactionMock, "get").mockImplementation((key) => {
			if (key === "multiSignature") {
				return { publicKeys: [wallet.publicKey(), wallet2.publicKey()] };
			}

			if (key === "signatures") {
				return []; // Only checking lengths
			}
		});
		jest.spyOn(wallet.transaction(), "isAwaitingOurSignature").mockReturnValue(false);
		jest.spyOn(wallet.transaction(), "isAwaitingOtherSignatures").mockReturnValue(false);

		const { container } = render(<Signatures transaction={multisignatureTransactionMock} wallet={wallet} />);

		await waitFor(() => expect(screen.getAllByTestId("Signatures__participant-status")).toHaveLength(2));

		expect(screen.getAllByTestId("Signatures__signed-badge")).toHaveLength(2);

		expect(container).toMatchSnapshot();

		jest.restoreAllMocks();
	});
});
