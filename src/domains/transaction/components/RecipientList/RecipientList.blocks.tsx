import { Address } from "app/components/Address";
import { Amount, AmountCrypto } from "app/components/Amount";
import { Avatar } from "app/components/Avatar";
import { OriginalButton as Button } from "app/components/Button/OriginalButton";
import { Icon } from "app/components/Icon";
import { Toggle } from "app/components/Toggle";
import { Tooltip } from "app/components/Tooltip";
import { useExchangeRate } from "app/hooks/use-exchange-rate";
import React from "react";
import { useTranslation } from "react-i18next";

import { RecipientListItemProperties } from "./RecipientList.contracts";

export const RecipientListItem: React.VFC<RecipientListItemProperties> = ({
	disableButton,
	exchangeTicker,
	isEditable,
	label,
	listIndex,
	onRemove,
	recipient: { address, alias, amount, publicKey },
	showAmount,
	showExchangeAmount,
	ticker,
	tooltipDisabled,
	variant,
	useMandatoryOption,
	isMandatory,
	onEnableMandatory,
	onDisableMandatory,
}) => {
	const { t } = useTranslation();

	const { convert } = useExchangeRate({ exchangeTicker, ticker });

	const renderAmount = () => {
		if (!showAmount || amount === undefined) {
			return undefined;
		}

		if (variant === "condensed") {
			return (
				<td className="flex-1 flex-shrink-0 pl-3 text-right">
					<AmountCrypto ticker={ticker} value={amount} />
				</td>
			);
		}

		return (
			<td className="flex-1 flex-shrink-0 py-6 pl-3 text-right">
				<div className="mb-1 text-sm font-semibold text-theme-secondary-500 dark:text-theme-secondary-700">
					{showExchangeAmount ? (
						<Amount ticker={exchangeTicker} value={convert(amount)} />
					) : (
						<span>{t("COMMON.AMOUNT")}</span>
					)}
				</div>
				<div className="font-semibold">
					<AmountCrypto ticker={ticker} value={amount} />
				</div>
			</td>
		);
	};

	if (variant === "condensed") {
		return (
			<tr
				className="flex items-center py-4 border-b border-dashed last:border-b-0 border-theme-secondary-300 dark:border-theme-secondary-800"
				data-testid="recipient-list__recipient-list-item"
			>
				<td>
					<Avatar size="sm" address={address} />
				</td>

				<td className="flex-1 ml-4 w-28">
					<Address address={address} walletName={alias} />
				</td>

				{renderAmount()}
			</tr>
		);
	}

	const isButtonDisabled = disableButton?.(address) || false;

	const handleMandatoryToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (!publicKey) {
			return;
		}

		if (event.target.checked) {
			return onEnableMandatory?.(publicKey);
		}

		onDisableMandatory?.(publicKey);
	};

	return (
		<tr
			className="flex items-center border-b border-dashed last:border-b-0 border-theme-secondary-300 dark:border-theme-secondary-800"
			data-testid="recipient-list__recipient-list-item"
		>
			<td className="flex-none py-6">
				<Avatar address={address} size="lg" />
			</td>

			<td className="flex-1 py-6 ml-5 w-28">
				<div className="mb-1 text-sm font-semibold text-theme-secondary-500 dark:text-theme-secondary-700">
					<span>{t(label ?? "COMMON.RECIPIENT_#", { count: listIndex + 1 })}</span>
				</div>
				<Address address={address} walletName={alias} />
			</td>

			{renderAmount()}

			{isEditable && (
				<>
					{useMandatoryOption && (
						<td className="flex-0 py-6 w-36">
							{listIndex === 0 && (
								<div className="mb-2 text-sm font-semibold text-theme-secondary-500 dark:text-theme-secondary-700 text-center">
									<span>{t("COMMON.MANDATORY")}</span>
								</div>
							)}

							<div className="flex justify-center">
								<Toggle
									onChange={handleMandatoryToggle}
									name="isMandatory"
									checked={isMandatory}
									data-testid="RecipientListItem__mandatory-toggle"
								/>
							</div>
						</td>
					)}

					<td className="flex-none py-6 ml-3">
						<Tooltip content={tooltipDisabled} disabled={!isButtonDisabled}>
							<span className="inline-block">
								<Button
									disabled={isButtonDisabled}
									variant="danger"
									onClick={() => !isButtonDisabled && onRemove?.(listIndex)}
									data-testid="recipient-list__remove-recipient"
								>
									<div className="py-1">
										<Icon name="Trash" />
									</div>
								</Button>
							</span>
						</Tooltip>
					</td>
				</>
			)}
		</tr>
	);
};