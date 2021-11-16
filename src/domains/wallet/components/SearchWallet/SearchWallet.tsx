import { Contracts } from "@payvo/sdk-profiles";
import { Address } from "app/components/Address";
import { Amount } from "app/components/Amount";
import { Avatar } from "app/components/Avatar";
import { Button } from "app/components/Button";
import { EmptyResults } from "app/components/EmptyResults";
import { HeaderSearchBar } from "app/components/Header/HeaderSearchBar";
import { Modal } from "app/components/Modal";
import { Table, TableCell, TableRow } from "app/components/Table";
import { useWalletAlias } from "app/hooks";
import { useSearchWallet } from "app/hooks/use-search-wallet";
import { NetworkIcon } from "domains/network/components/NetworkIcon";
import React, { FC, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Column } from "react-table";

import { SearchWalletListItemProperties, SearchWalletProperties } from "./SearchWallet.models";

const SearchWalletListItem = ({
	index,
	disabled,
	profile,
	wallet,
	exchangeCurrency,
	showConvertedValue,
	showNetwork,
	onAction,
	selectedAddress,
}: SearchWalletListItemProperties) => {
	const { t } = useTranslation();

	const { getWalletAlias } = useWalletAlias();

	const { alias } = useMemo(
		() =>
			getWalletAlias({
				address: wallet.address(),
				network: wallet.network(),
				profile,
			}),
		[profile, getWalletAlias, wallet],
	);

	const renderButton = () => {
		if (selectedAddress === wallet.address()) {
			return (
				<Button
					data-testid={`SearchWalletListItem__selected-${index}`}
					variant="reverse"
					onClick={() => onAction({ address: wallet.address(), name: alias, network: wallet.network() })}
				>
					{t("COMMON.SELECTED")}
				</Button>
			);
		}

		return (
			<Button
				data-testid={`SearchWalletListItem__select-${index}`}
				disabled={disabled}
				variant="secondary"
				onClick={() => onAction({ address: wallet.address(), name: alias, network: wallet.network() })}
			>
				{t("COMMON.SELECT")}
			</Button>
		);
	};

	return (
		<TableRow>
			<TableCell variant="start" innerClassName="space-x-4" className="w-full">
				<div className="flex-shrink-0 -space-x-1">
					{showNetwork && <NetworkIcon size="lg" network={wallet.network()} />}
					<Avatar size="lg" address={wallet.address()} />
				</div>
				<Address walletName={alias} address={wallet.address()} truncateOnTable />
			</TableCell>

			<TableCell innerClassName="font-semibold justify-end">
				<Amount value={wallet.balance()} ticker={wallet.currency()} />
			</TableCell>

			{showConvertedValue && (
				<TableCell innerClassName="text-theme-secondary-400 justify-end">
					<Amount value={wallet.convertedBalance()} ticker={exchangeCurrency} />
				</TableCell>
			)}

			<TableCell variant="end" innerClassName="justify-end">
				{renderButton()}
			</TableCell>
		</TableRow>
	);
};

export const SearchWallet: FC<SearchWalletProperties> = ({
	isOpen,
	title,
	description,
	disableAction,
	wallets,
	searchPlaceholder,
	size = "5xl",
	showConvertedValue = true,
	showNetwork = true,
	onClose,
	onSelectWallet,
	profile,
	selectedAddress,
}) => {
	const { setSearchKeyword, filteredList: filteredWallets, isEmptyResults } = useSearchWallet({ profile, wallets });

	const { t } = useTranslation();

	const columns = useMemo<Column<Contracts.IReadWriteWallet>[]>(() => {
		const commonColumns: Column<Contracts.IReadWriteWallet>[] = [
			{
				Header: t("COMMON.WALLET_ADDRESS"),
				accessor: (wallet) => wallet.alias(),
			},
			{
				Header: t("COMMON.BALANCE"),
				accessor: (wallet) => wallet.balance?.().toFixed(0),
				className: "justify-end",
			},
		];

		if (showConvertedValue) {
			return [
				...commonColumns,
				{
					Header: t("COMMON.VALUE"),
					accessor: (wallet: Contracts.IReadWriteWallet) => wallet.convertedBalance?.().toFixed(0),
					className: "justify-end",
				},
				{
					Header: (
						<HeaderSearchBar
							placeholder={searchPlaceholder}
							offsetClassName="top-1/3 -translate-y-16 -translate-x-6"
							onSearch={setSearchKeyword}
							onReset={() => setSearchKeyword("")}
							debounceTimeout={100}
							noToggleBorder
						/>
					),
					accessor: "search",
					className: "justify-end",
					disableSortBy: true,
				},
			] as Column<Contracts.IReadWriteWallet>[];
		}

		return [
			...commonColumns,
			{
				Header: (
					<HeaderSearchBar
						placeholder={searchPlaceholder}
						offsetClassName="top-1/3 -translate-y-16 -translate-x-6"
						onSearch={setSearchKeyword}
						onReset={() => setSearchKeyword("")}
						debounceTimeout={100}
						noToggleBorder
					/>
				),
				accessor: "search",
				className: "justify-end",
				disableSortBy: true,
			},
		] as Column<Contracts.IReadWriteWallet>[];
	}, [searchPlaceholder, setSearchKeyword, showConvertedValue, t]);

	const renderTableRow = useCallback(
		(wallet: Contracts.IReadWriteWallet, index: number) => (
			<SearchWalletListItem
				index={index}
				wallet={wallet}
				profile={profile}
				disabled={disableAction?.(wallet)}
				exchangeCurrency={
					wallet.exchangeCurrency() ||
					(profile.settings().get(Contracts.ProfileSetting.ExchangeCurrency) as string)
				}
				showConvertedValue={showConvertedValue}
				showNetwork={showNetwork}
				onAction={onSelectWallet}
				selectedAddress={selectedAddress}
			/>
		),
		[profile, disableAction, showConvertedValue, showNetwork, onSelectWallet, selectedAddress],
	);

	return (
		<Modal title={title} description={description} isOpen={isOpen} size={size} onClose={onClose}>
			<div className="mt-8">
				<Table columns={columns} data={filteredWallets as Contracts.IReadWriteWallet[]}>
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
