import { Networks } from "@payvo/sdk";
import { TFunction } from "react-i18next";
import { TransactionFees } from "types";

export const common = (t: TFunction) => ({
	fee: (balance = 0, network?: Networks.Network, fees?: TransactionFees) => ({
		validate: {
			valid: (fee?: string | number) => {
				if (fee === undefined || fee === "") {
					return t("COMMON.VALIDATION.FIELD_REQUIRED", {
						field: t("COMMON.FEE"),
					});
				}

				if (!network?.coin()) {
					return true;
				}

				if (balance === 0 || Math.sign(balance) === -1) {
					return t("TRANSACTION.VALIDATION.LOW_BALANCE_AMOUNT", {
						balance: 0,
						coinId: network.coin(),
					});
				}

				if (+fee > balance) {
					return t("TRANSACTION.VALIDATION.LOW_BALANCE_AMOUNT", {
						balance,
						coinId: network.coin(),
					});
				}

				if (+fee === 0 && network && !network.chargesZeroFees()) {
					return t("COMMON.VALIDATION.FIELD_REQUIRED", {
						field: t("COMMON.FEE"),
					});
				}

				if (Math.sign(+fee) === -1) {
					return t("TRANSACTION.VALIDATION.FEE_NEGATIVE");
				}

				if (network.feeType() === "size" && fees?.min && +fee < fees.min) {
					return t("COMMON.VALIDATION.MIN", {
						field: t("COMMON.FEE"),
						min: fees.min,
					});
				}

				return true;
			},
		},
	}),
});
