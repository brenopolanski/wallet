import { Icon } from "app/components/Icon";
import React from "react";
import { useHistory } from "react-router-dom";
import { styled } from "twin.macro";

import { getStyles } from "./BackButton.styles";

interface BackButtonProperties {
	backToUrl?: string;
	className?: string;
	disabled?: boolean;
}

const StyledBackButton = styled.button<BackButtonProperties>(getStyles);

export const BackButton = ({ backToUrl, className, disabled }: BackButtonProperties) => {
	const history = useHistory();

	const handleOnClick = () => {
		if (backToUrl) {
			return history.push(backToUrl);
		}

		history.go(-1);
	};

	return (
		<StyledBackButton onClick={handleOnClick} disabled={disabled} className={className}>
			<Icon name="ChevronLeftSmall" className="mx-auto" size="sm" />
		</StyledBackButton>
	);
};
