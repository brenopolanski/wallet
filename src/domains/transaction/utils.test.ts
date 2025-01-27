import { handleBroadcastError, isNoDeviceError, isRejectionError } from "./utils";

describe("Transaction utils", () => {
	describe("isNoDeviceError", () => {
		it("should return isNoDeviceError", () => {
			const error = isNoDeviceError("no device found");

			expect(error).toBe(true);
		});
	});

	describe("isRejectionError", () => {
		it("should return isRejectionError", () => {
			const error = isRejectionError("Condition of use not satisfied");

			expect(error).toBe(true);
		});
	});

	describe("handleBroadcastError", () => {
		it("should throw if rejected", () => {
			expect(() => handleBroadcastError({ accepted: [], errors: { id: "ERROR" }, rejected: ["id"] })).toThrow(
				"ERROR",
			);
		});

		it("should not throw if accepted", () => {
			expect(() => handleBroadcastError({ accepted: ["id"], errors: {}, rejected: [] })).not.toThrow();
		});

		it("should handle empty response", () => {
			expect(() => handleBroadcastError()).not.toThrow();
		});
	});
});
