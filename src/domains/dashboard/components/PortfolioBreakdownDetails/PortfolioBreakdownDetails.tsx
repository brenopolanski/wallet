import { Modal } from "app/components/Modal";
import { AssetItem } from "domains/dashboard/components/PortfolioBreakdown/PortfolioBreakdown.contracts";
import React from "react";
import { useTranslation } from "react-i18next";

import { AssetList } from "./PortfolioBreakdownDetails.blocks";

interface PortfolioBreakdownDetailsProperties {
	isOpen: boolean;
	data: AssetItem[];
	exchangeCurrency: string;
	onClose: () => void;
}

export const PortfolioBreakdownDetails: React.VFC<PortfolioBreakdownDetailsProperties> = ({
	isOpen,
	data,
	exchangeCurrency,
	onClose,
}) => {
	const { t } = useTranslation();

	return (
		<Modal isOpen={isOpen} title={t("DASHBOARD.PORTFOLIO_BREAKDOWN_DETAILS.TITLE")} onClose={onClose}>
			<AssetList data={data} exchangeCurrency={exchangeCurrency} />
		</Modal>
	);
};
