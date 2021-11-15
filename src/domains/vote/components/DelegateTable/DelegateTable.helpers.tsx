import { Contracts } from "@payvo/sdk-profiles";
import { Icon } from "app/components/Icon";
import { Tooltip } from "app/components/Tooltip";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Column } from "react-table";

import { DelegateTableColumnsProperties, VoteDelegateProperties } from "./DelegateTable.models";

export const useDelegateTableColumns = ({ network, isLoading }: DelegateTableColumnsProperties) => {
	const { t } = useTranslation();

	return useMemo<Column<Contracts.IReadOnlyWallet>[]>(() => {
		const templateColumns: Column<Contracts.IReadOnlyWallet>[] = [
			{
				Header: t("VOTE.DELEGATE_TABLE.NAME"),
				accessor: (delegate) => isLoading || delegate.username(),
				className: "justify-start",
			},
			{
				Header: t("COMMON.EXPLORER"),
				accessor: (delegate) => isLoading || delegate.explorerLink(),
				className: "justify-center",
				disableSortBy: true,
			},
		];

		if (network.votesAmountMinimum() > 0) {
			templateColumns.push({
				Header: (
					<div className="flex items-center space-x-3 px-3">
						<p>{t("VOTE.DELEGATE_TABLE.VOTE_AMOUNT.TITLE")}</p>
						<Tooltip
							content={t("VOTE.DELEGATE_TABLE.VOTE_AMOUNT.TOOLTIP", {
								coinId: network.coin(),
							})}
						>
							<span className="p-1 bg-theme-primary-100 text-theme-primary-600 dark:bg-theme-secondary-800 dark:text-theme-secondary-200 rounded-full">
								<Icon name="QuestionMarkSmall" size="sm" />
							</span>
						</Tooltip>
					</div>
				),
				accessor: () => "voteAmount",
				className: "justify-end",
				disableSortBy: true,
				id: "voteAmount",
			} as Column<Contracts.IReadOnlyWallet>);
		}

		templateColumns.push({
			Header: t("VOTE.DELEGATE_TABLE.VOTE"),
			accessor: () => "onSelect",
			className: "justify-end",
			disableSortBy: true,
			id: "onSelect",
		});

		return templateColumns;
	}, [t, network, isLoading]);
};

export const delegateExistsInVotes = (
	votes: VoteDelegateProperties[],
	address: string,
): VoteDelegateProperties | undefined => votes.find(({ delegateAddress }) => delegateAddress === address);
