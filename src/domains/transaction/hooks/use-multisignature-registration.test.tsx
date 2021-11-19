import { Contracts } from "@payvo/sdk-profiles";
import { env, getDefaultProfileId } from "utils/testing-library";

import { formatMultiSignatureInputData } from "./use-multisignature-registration";

describe("Use MultiSignature Registration Hook", () => {
	let profile: Contracts.IProfile;
	let wallet: Contracts.IReadWriteWallet;

	beforeAll(() => {
		profile = env.profiles().findById(getDefaultProfileId());
		wallet = profile.wallets().first();
	});

	it("should format transaction data based on multisignature type", () => {
		const result = formatMultiSignatureInputData({ mandatoryKeys: [], min: 2, publicKeys: ["1", "2"], wallet });

		expect(result).toStrictEqual({ min: 2, publicKeys: ["1", "2"] });

		// Advanced type
		jest.spyOn(wallet.network(), "multiSignatureType").mockReturnValue("advanced");
		const advanced = formatMultiSignatureInputData({
			mandatoryKeys: ["1"],
			min: 2,
			publicKeys: ["1", "2"],
			wallet,
		});

		expect(advanced).toStrictEqual({ mandatoryKeys: ["1"], numberOfSignatures: 2, optionalKeys: ["2"] });

		jest.clearAllMocks();
	});
});
