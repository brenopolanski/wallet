import { Contracts } from "@payvo/profiles";
import { Networks } from "@payvo/sdk";
import { Address } from "app/components/Address";
import { Avatar } from "app/components/Avatar";
import { Button } from "app/components/Button";
import { Clipboard } from "app/components/Clipboard";
import { Dropdown } from "app/components/Dropdown";
import { Icon } from "app/components/Icon";
import { TableCell, TableRow } from "app/components/Table";
import { useEnvironmentContext } from "app/contexts";
import { useNetworkOptions } from "app/hooks";
import { NetworkIcon } from "domains/network/components/NetworkIcon";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { assertNetwork } from "utils/assertions";

import { ContactListItemProperties, Option } from "./ContactListItem.models";

export const ContactListItem = ({ item, onAction, onSend, options, useTestNetworks }: ContactListItemProperties) => {
	const { env } = useEnvironmentContext();
	const { networkById } = useNetworkOptions();
	const { t } = useTranslation();

	const filteredAddresses = useMemo(
		() =>
			item
				.addresses()
				.values()
				.filter((address: Contracts.IContactAddress) => {
					if (useTestNetworks) {
						return true;
					}

					const network = networkById(address.network());
					assertNetwork(network);
					return network.isLive();
				}),
		[item, networkById, useTestNetworks],
	);

	return (
		<>
			{filteredAddresses.map((address: Contracts.IContactAddress, index: number) => {
				const borderClasses = () =>
					index === filteredAddresses.length - 1
						? ""
						: "border-b border-dashed border-theme-secondary-300 dark:border-theme-secondary-800";

				const network = env
					.availableNetworks()
					.find(
						(network: Networks.Network) =>
							network.coin() === address.coin() && network.id() === address.network(),
					);

				return (
					<TableRow key={`${address.address()}-${index}`} border={index === filteredAddresses.length - 1}>
						<TableCell variant="start" innerClassName="space-x-4">
							{index === 0 && (
								<>
									<Avatar data-testid="ContactListItem__user--avatar" size="lg" noShadow>
										<img
											src={`data:image/svg+xml;utf8,${item.avatar()}`}
											title={item.name()}
											alt={item.name()}
										/>
										<span className="absolute text-sm font-semibold text-theme-background">
											{item.name().slice(0, 2).toUpperCase()}
										</span>
									</Avatar>

									<span className="font-semibold" data-testid="ContactListItem__name">
										{item.name()}
									</span>
								</>
							)}
						</TableCell>

						<TableCell innerClassName="justify-center">
							<NetworkIcon network={network} size="lg" noShadow />
						</TableCell>

						<TableCell
							data-testid="ContactListItem__address"
							className={borderClasses()}
							innerClassName="space-x-4"
						>
							<Avatar address={address.address()} size="lg" noShadow />
							<Address address={address.address()} />
						</TableCell>

						<TableCell className={borderClasses()} innerClassName="space-x-4 justify-center">
							<Clipboard variant="icon" data={address.address()}>
								<div className="text-theme-primary-300 dark:text-theme-secondary-700">
									<Icon name="Copy" />
								</div>
							</Clipboard>
						</TableCell>

						<TableCell variant="end" className={borderClasses()} innerClassName="justify-end">
							<div className="flex items-center space-x-2">
								<Button
									data-testid="ContactListItem__send-button"
									variant="secondary"
									onClick={() => onSend?.(address)}
								>
									{t("COMMON.SEND")}
								</Button>

								<div className={index === 0 ? "visible" : "invisible"}>
									{options?.length > 1 ? (
										<Dropdown
											toggleContent={
												<Button variant="secondary" size="icon">
													<Icon name="EllipsisVertical" size="lg" />
												</Button>
											}
											options={options}
											onSelect={(action: Option) => onAction?.(action, address.address())}
										/>
									) : (
										<Button
											data-testid={`ContactListItem__one-option-button-${index}`}
											variant="secondary"
											onClick={() => onAction?.(options[0], address.address())}
										>
											{options?.[0]?.label}
										</Button>
									)}
								</div>
							</div>
						</TableCell>
					</TableRow>
				);
			})}
		</>
	);
};

ContactListItem.defaultProps = {
	options: [
		{ label: "Edit", value: "edit" },
		{ label: "Delete", value: "send" },
	],
};
