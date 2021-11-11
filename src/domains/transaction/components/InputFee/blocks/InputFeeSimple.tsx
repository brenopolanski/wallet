import { Amount } from "app/components/Amount";
import { ButtonGroup, ButtonGroupOption } from "app/components/ButtonGroup";
import { Skeleton } from "app/components/Skeleton";
import {
	InputFeeSimpleProperties,
	InputFeeSimpleValue,
} from "domains/transaction/components/InputFee/InputFee.contracts";
import React from "react";

export const InputFeeSimple: React.FC<InputFeeSimpleProperties> = ({
	options,
	onChange,
	value,
	ticker,
	exchangeTicker,
	showConvertedValues,
	loading,
}: InputFeeSimpleProperties) => (
	<ButtonGroup>
		{Object.entries(options).map(([optionValue, { label, displayValue, displayValueConverted }]) => (
			<ButtonGroupOption
				key={optionValue}
				value={displayValue}
				isSelected={() => optionValue === value}
				setSelectedValue={() => onChange(optionValue as InputFeeSimpleValue)}
			>
				<div className="flex flex-col space-y-2">
					<div>{label}</div>
					{loading ? (
						<Skeleton width={100} className="my-1 h-3" />
					) : (
						<>
							<Amount ticker={ticker} value={displayValue} className="text-sm" />
							{showConvertedValues && (
								<Amount
									ticker={exchangeTicker}
									value={displayValueConverted}
									className="text-sm text-theme-secondary-500"
								/>
							)}
						</>
					)}
				</div>
			</ButtonGroupOption>
		))}
	</ButtonGroup>
);
