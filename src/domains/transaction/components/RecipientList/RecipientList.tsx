import { Contracts } from "@payvo/profiles";
import { Table } from "app/components/Table";
import { useActiveProfile } from "app/hooks";
import React, { useCallback } from "react";
import tw, { styled } from "twin.macro";
import { assertString } from "utils/assertions";

import { RecipientListItem } from "./RecipientList.blocks";
import { RecipientItem, RecipientListProperties } from "./RecipientList.contracts";
import { useColumns } from "./RecipientList.helpers";
import { defaultStyle } from "./RecipientList.styles";

const RecipientListWrapper = styled.div`
	${defaultStyle}
	${tw`w-full`}
`;

export const RecipientList: React.VFC<RecipientListProperties> = ({
	disableButton,
	isEditable,
	label,
	onRemove,
	recipients,
	showAmount,
	showExchangeAmount,
	ticker,
	tooltipDisabled,
	variant,
	useMandatoryOption,
	mandatoryKeys,
	onAddMandatoryKey,
	onRemoveMandatoryKey,
}) => {
	const columns = useColumns({ isEditable, showAmount });

	const profile = useActiveProfile();

	const exchangeTicker = profile.settings().get(Contracts.ProfileSetting.ExchangeCurrency);
	assertString(exchangeTicker);

	const renderTableRow = useCallback(
		(recipient: RecipientItem, index: number) => (
			<RecipientListItem
				disableButton={disableButton}
				exchangeTicker={exchangeTicker}
				isEditable={isEditable}
				label={label}
				listIndex={index}
				onRemove={onRemove}
				recipient={recipient}
				showAmount={showAmount}
				showExchangeAmount={showExchangeAmount}
				ticker={ticker}
				tooltipDisabled={tooltipDisabled}
				variant={variant}
				useMandatoryOption={useMandatoryOption}
				isMandatory={mandatoryKeys && mandatoryKeys.some((publicKey) => publicKey === recipient.publicKey)}
				onEnableMandatory={onAddMandatoryKey}
				onDisableMandatory={onRemoveMandatoryKey}
			/>
		),
		[
			disableButton,
			exchangeTicker,
			isEditable,
			label,
			onRemove,
			showAmount,
			showExchangeAmount,
			ticker,
			tooltipDisabled,
			variant,
			mandatoryKeys,
			onAddMandatoryKey,
			onRemoveMandatoryKey,
			useMandatoryOption,
		],
	);

	return (
		<RecipientListWrapper>
			<Table columns={columns} data={recipients}>
				{renderTableRow}
			</Table>
		</RecipientListWrapper>
	);
};
