import cn from "classnames";
import React, { FC } from "react";
import { styled } from "twin.macro";

import { getStyles, TableRowStyleProperties } from "./TableRow.styles";

type TableRowProperties = {
	children: React.ReactNode;
} & TableRowStyleProperties &
	React.HTMLProps<any>;

const TableRowStyled = styled.tr<TableRowProperties>(getStyles);

export const TableRow: FC<TableRowProperties> = ({ border = true, dotted, children, isSelected, onClick }) => (
	<TableRowStyled
		data-testid="TableRow"
		className={cn({ group: !!onClick })}
		border={border}
		dotted={dotted}
		isSelected={isSelected}
		onClick={onClick}
	>
		{children}
	</TableRowStyled>
);
