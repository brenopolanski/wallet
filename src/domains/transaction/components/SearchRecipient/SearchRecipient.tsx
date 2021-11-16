import { Address } from "app/components/Address";
import { Avatar } from "app/components/Avatar";
import { Button } from "app/components/Button";
import { EmptyResults } from "app/components/EmptyResults";
import { HeaderSearchBar } from "app/components/Header/HeaderSearchBar";
import { Modal } from "app/components/Modal";
import { Table, TableCell, TableRow } from "app/components/Table";
import { useSearchWallet } from "app/hooks/use-search-wallet";
import React, { FC, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Column } from "react-table";

import {
	RecipientProperties,
	SearchRecipientListItemProperties,
	SearchRecipientProperties,
} from "./SearchRecipient.contracts";

const SearchRecipientListItem: FC<SearchRecipientListItemProperties> = ({
	index,
	recipient,
	onAction,
	selectedAddress,
}) => {
	const { t } = useTranslation();

	const renderButton = () => {
		if (selectedAddress === recipient.address) {
			return (
				<Button
					data-testid={`RecipientListItem__selected-button-${index}`}
					variant="reverse"
					onClick={() => onAction(recipient.address)}
				>
					{t("COMMON.SELECTED")}
				</Button>
			);
		}

		return (
			<Button
				data-testid={`RecipientListItem__select-button-${index}`}
				variant="secondary"
				onClick={() => onAction(recipient.address)}
			>
				{t("COMMON.SELECT")}
			</Button>
		);
	};

	return (
		<TableRow key={recipient.id} border>
			<TableCell variant="start" innerClassName="space-x-4">
				<Avatar size="lg" address={recipient.address} />
				<Address walletName={recipient.alias} address={recipient.address} />
			</TableCell>

			<TableCell>
				<span data-testid="RecipientListItem__type">
					{recipient.type === "wallet" ? t("COMMON.MY_WALLET") : t("COMMON.CONTACT")}
				</span>
			</TableCell>

			<TableCell variant="end" innerClassName="justify-end">
				{renderButton()}
			</TableCell>
		</TableRow>
	);
};

export const SearchRecipient: FC<SearchRecipientProperties> = ({
	title,
	description,
	isOpen,
	onClose,
	onAction,
	recipients,
	selectedAddress,
}) => {
	const {
		setSearchKeyword,
		filteredList: filteredRecipients,
		isEmptyResults,
	} = useSearchWallet({
		wallets: recipients,
	});

	const { t } = useTranslation();

	const columns = useMemo<Column<RecipientProperties>[]>(
		() => [
			{
				Header: t("COMMON.WALLET_ADDRESS"),
				accessor: "alias",
			},
			{
				Header: t("COMMON.TYPE"),
				accessor: "type",
			},
			{
				Header: (
					<HeaderSearchBar
						placeholder={t("TRANSACTION.MODAL_SEARCH_RECIPIENT.SEARCH_PLACEHOLDER")}
						offsetClassName="top-1/3 -translate-y-16 -translate-x-6"
						onSearch={setSearchKeyword}
						onReset={() => setSearchKeyword("")}
						debounceTimeout={100}
						noToggleBorder
					/>
				),
				accessor: "id",
				className: "justify-end no-border",
				disableSortBy: true,
			},
		],
		[t, setSearchKeyword],
	);

	const renderTableRow = useCallback(
		(recipient: RecipientProperties, index: number) => (
			<SearchRecipientListItem
				index={index}
				selectedAddress={selectedAddress}
				recipient={recipient}
				onAction={onAction}
			/>
		),
		[selectedAddress, onAction],
	);

	return (
		<Modal
			isOpen={isOpen}
			title={title || t("TRANSACTION.MODAL_SEARCH_RECIPIENT.TITLE")}
			description={description || t("TRANSACTION.MODAL_SEARCH_RECIPIENT.DESCRIPTION")}
			size="5xl"
			onClose={onClose}
		>
			<div className="mt-8">
				<Table columns={columns} data={filteredRecipients as RecipientProperties[]}>
					{renderTableRow}
				</Table>
				{isEmptyResults && (
					<EmptyResults
						className="mt-16"
						title={t("COMMON.EMPTY_RESULTS.TITLE")}
						subtitle={t("COMMON.EMPTY_RESULTS.SUBTITLE")}
					/>
				)}
			</div>
		</Modal>
	);
};
