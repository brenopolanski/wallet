import { DateTime } from "@payvo/sdk-intl";
import React from "react";
import { useTranslation } from "react-i18next";

import { TIME_PERIODS } from "./TimeAgo.constants";
import { DateDifferenceReturnValue } from "./TimeAgo.contracts";

const dateDifference = (date: string): DateDifferenceReturnValue => {
	const now = DateTime.make();
	const target = DateTime.make(date);

	for (const period of TIME_PERIODS) {
		const count: number = now[`diffIn${period}`](target);

		if (count > 0) {
			return { count, key: period.toUpperCase() };
		}
	}

	return { key: "FEW_SECONDS" };
};

export const TimeAgo = ({ date }: { date: string }) => {
	const { t } = useTranslation();

	const { count, key } = dateDifference(date);

	// TODO: waiting for i18next.TS will support plurals https://github.com/i18next/i18next/issues/1683
	return <span data-testid="TimeAgo">{t(`COMMON.DATETIME.${key}_AGO` as any, { count })}</span>;
};
